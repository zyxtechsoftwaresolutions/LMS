import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  PlayCircle,
  Loader2,
  ChevronRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { VideoPlayer } from "@/components/VideoPlayer";

interface Step {
  id: string;
  stepNumber: number;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  quiz_id: string | null;
  quiz: Quiz | null;
  isCompleted: boolean;
  isLocked: boolean;
  lesson_id: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  qtype: string;
  options: Option[];
}

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

interface Course {
  id: string;
  title: string;
  instructor_id: string | null;
}

export default function CourseSteps() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (id && user) {
      fetchCourseData();
    }
  }, [id, user]);

  const fetchCourseData = async () => {
    if (!id || !user) return;
    try {
      setLoading(true);

      // Fetch course
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, title, instructor_id")
        .eq("id", id)
        .single();

      if (!courseData) {
        toast.error("Course not found");
        navigate("/courses");
        return;
      }

      setCourse(courseData);

      // Check enrollment
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", id)
        .eq("student_id", user.id)
        .maybeSingle();

      setIsEnrolled(!!enrollment);

      if (!enrollment && role === "student") {
        toast.error("You must enroll in this course first");
        navigate(`/courses/${id}`);
        return;
      }

      // Fetch modules (steps) with lessons
      const { data: modules } = await supabase
        .from("modules")
        .select(`
          id,
          title,
          description,
          position,
          lessons(id, title, content, media_url, position)
        `)
        .eq("course_id", id)
        .order("position", { ascending: true });

      if (!modules) {
        setSteps([]);
        return;
      }

      // Fetch lesson progress
      const lessonIds = modules.flatMap((m) => m.lessons?.map((l: any) => l.id) || []);
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("student_id", user.id)
        .in("lesson_id", lessonIds);

      const progressMap = new Map(progress?.map((p) => [p.lesson_id, p.completed]) || []);

      // Fetch quizzes for each module
      const moduleIds = modules.map((m) => m.id);
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select(`
          id,
          title,
          module_id,
          questions(
            id,
            text,
            qtype,
            position,
            options(id, text, is_correct, position)
          )
        `)
        .in("module_id", moduleIds)
        .eq("is_published", true)
        .order("created_at", { ascending: true });

      const quizMap = new Map(
        quizzes?.map((q) => [
          q.module_id,
          {
            id: q.id,
            title: q.title,
            questions: (q.questions || []).map((ques: any) => ({
              id: ques.id,
              text: ques.text,
              qtype: ques.qtype,
              options: (ques.options || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
            })),
          },
        ]) || []
      );

      // Check quiz passes for all modules
      const quizPassedMap = new Map<string, boolean>();
      for (const module of modules) {
        const quiz = quizMap.get(module.id);
        if (quiz) {
          const passed = await checkQuizPassed(quiz.id, user.id);
          quizPassedMap.set(module.id, passed);
        }
      }

      // Build steps
      const stepsData: Step[] = modules.map((module, index) => {
        const lesson = module.lessons?.[0] || null;
        const quiz = quizMap.get(module.id) || null;
        const lessonCompleted = lesson ? progressMap.get(lesson.id) : false;

        // Step is locked if previous step is not completed
        let isLocked = false;
        if (index > 0) {
          const prevModule = modules[index - 1];
          const prevLesson = prevModule.lessons?.[0];
          if (prevLesson) {
            const prevCompleted = progressMap.get(prevLesson.id);
            // Also check if previous quiz was passed
            const prevQuiz = quizMap.get(prevModule.id);
            if (prevQuiz) {
              const prevQuizPassed = quizPassedMap.get(prevModule.id) || false;
              isLocked = !prevCompleted || !prevQuizPassed;
            } else {
              isLocked = !prevCompleted;
            }
          }
        }

        return {
          id: module.id,
          stepNumber: index + 1,
          title: module.title,
          description: module.description,
          content: lesson?.content || null,
          video_url: lesson?.media_url || null,
          quiz_id: quiz?.id || null,
          quiz: quiz,
          isCompleted: lessonCompleted || false,
          isLocked: isLocked,
          lesson_id: lesson?.id || "",
        };
      });

      setSteps(stepsData);

      // Find first unlocked step
      const firstUnlocked = stepsData.findIndex((s) => !s.isLocked);
      if (firstUnlocked >= 0) {
        setCurrentStep(firstUnlocked);
      }
    } catch (error: any) {
      console.error("Error fetching course data:", error);
      toast.error(error.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const checkQuizPassed = async (quizId: string, studentId: string): Promise<boolean> => {
    try {
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("percentage, status")
        .eq("quiz_id", quizId)
        .eq("student_id", studentId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(1);

      if (!attempts || attempts.length === 0) return false;

      const { data: quiz } = await supabase
        .from("quizzes")
        .select("passing_score")
        .eq("id", quizId)
        .single();

      const passingScore = quiz?.passing_score || 50;
      return (attempts[0].percentage || 0) >= passingScore;
    } catch {
      return false;
    }
  };

  const handleStepComplete = async (step: Step) => {
    if (!user || !step.lesson_id) return;

    try {
      const { error } = await supabase
        .from("lesson_progress")
        .upsert({
          lesson_id: step.lesson_id,
          student_id: user.id,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Step completed!");
      fetchCourseData();
    } catch (error: any) {
      console.error("Error completing step:", error);
      toast.error(error.message || "Failed to mark step as complete");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!course || steps.length === 0) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto max-w-7xl">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No steps available for this course</p>
              <Button variant="outline" onClick={() => navigate(`/courses/${id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const activeStep = steps[currentStep];

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/courses/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Steps</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {steps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => !step.isLocked && setCurrentStep(index)}
                      disabled={step.isLocked}
                      className={`w-full text-left p-4 border-l-4 transition-colors ${
                        index === currentStep
                          ? "border-primary bg-primary/5"
                          : step.isLocked
                          ? "border-muted bg-muted/30 opacity-50 cursor-not-allowed"
                          : step.isCompleted
                          ? "border-green-500 hover:bg-muted/50"
                          : "border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {step.isLocked ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : step.isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                            <span className="text-xs font-semibold">{step.stepNumber}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{step.title}</div>
                          {step.isLocked && (
                            <div className="text-xs text-muted-foreground">Locked</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeStep.isLocked ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Step Locked</h3>
                  <p className="text-muted-foreground mb-6">
                    Complete the previous step to unlock this one.
                  </p>
                  {currentStep > 0 && (
                    <Button onClick={() => setCurrentStep(currentStep - 1)}>
                      Go to Previous Step
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Step Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Step {activeStep.stepNumber}</Badge>
                          {activeStep.isCompleted && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-2xl">{activeStep.title}</CardTitle>
                        {activeStep.description && (
                          <p className="text-muted-foreground mt-2">{activeStep.description}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Step Content */}
                {activeStep.content && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: activeStep.content }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step Video */}
                {activeStep.video_url && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlayCircle className="h-5 w-5" />
                        Video Lesson
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <VideoPlayer
                        videoUrl={activeStep.video_url}
                        title={activeStep.title}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step Quiz */}
                {activeStep.quiz && activeStep.quiz.questions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Quiz: {activeStep.quiz.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Answer the following questions to proceed to the next step.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <StepQuiz
                        quiz={activeStep.quiz}
                        step={activeStep}
                        onComplete={async () => {
                          // Refresh course data to update step locks
                          await fetchCourseData();
                          // Wait for state to update, then check next step
                          setTimeout(async () => {
                            // Fetch fresh data to get updated step locks
                            const { data: modules } = await supabase
                              .from("modules")
                              .select(`
                                id,
                                title,
                                description,
                                position,
                                lessons(id, title, content, media_url, position)
                              `)
                              .eq("course_id", id)
                              .order("position", { ascending: true });

                            if (!modules || !user) return;

                            const lessonIds = modules.flatMap((m) => m.lessons?.map((l: any) => l.id) || []);
                            const { data: progress } = await supabase
                              .from("lesson_progress")
                              .select("lesson_id, completed")
                              .eq("student_id", user.id)
                              .in("lesson_id", lessonIds);

                            const progressMap = new Map(progress?.map((p) => [p.lesson_id, p.completed]) || []);

                            const moduleIds = modules.map((m) => m.id);
                            const { data: quizzes } = await supabase
                              .from("quizzes")
                              .select("id, title, module_id")
                              .in("module_id", moduleIds)
                              .eq("is_published", true);

                            const quizMap = new Map(quizzes?.map((q) => [q.module_id, q.id]) || []);

                            const quizPassedMap = new Map<string, boolean>();
                            for (const module of modules) {
                              const quizId = quizMap.get(module.id);
                              if (quizId) {
                                const passed = await checkQuizPassed(quizId, user.id);
                                quizPassedMap.set(module.id, passed);
                              }
                            }

                            // Check if next step is unlocked
                            const nextStepIndex = currentStep + 1;
                            if (nextStepIndex < modules.length) {
                              const nextModule = modules[nextStepIndex];
                              const prevModule = modules[currentStep];
                              const prevLesson = prevModule.lessons?.[0];
                              
                              let isNextLocked = false;
                              if (prevLesson) {
                                const prevCompleted = progressMap.get(prevLesson.id);
                                const prevQuizId = quizMap.get(prevModule.id);
                                if (prevQuizId) {
                                  const prevQuizPassed = quizPassedMap.get(prevModule.id) || false;
                                  isNextLocked = !prevCompleted || !prevQuizPassed;
                                } else {
                                  isNextLocked = !prevCompleted;
                                }
                              }

                              if (!isNextLocked) {
                                setCurrentStep(nextStepIndex);
                                toast.success("Next step unlocked!");
                              } else {
                                toast.info("Next step will unlock after the page refreshes.");
                              }
                            }
                          }, 1000);
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Complete Step Button */}
                {!activeStep.quiz && (
                  <Card>
                    <CardContent className="py-6">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground">
                          {activeStep.isCompleted
                            ? "You have completed this step"
                            : "Mark this step as complete to proceed"}
                        </p>
                        <Button
                          onClick={() => handleStepComplete(activeStep)}
                          disabled={activeStep.isCompleted}
                        >
                          {activeStep.isCompleted ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Completed
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark as Complete
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous Step
                  </Button>
                  <Button
                    onClick={() => {
                      if (currentStep < steps.length - 1) {
                        setCurrentStep(currentStep + 1);
                      } else {
                        toast.success("Congratulations! You've completed the course!");
                      }
                    }}
                    disabled={currentStep >= steps.length - 1 || steps[currentStep + 1]?.isLocked}
                  >
                    Next Step
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Step Quiz Component
function StepQuiz({
  quiz,
  step,
  onComplete,
}: {
  quiz: Quiz;
  step: Step;
  onComplete: () => void;
}) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passed, setPassed] = useState(false);

  const handleAnswerChange = (questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      if (isMultiple) {
        const current = prev[questionId] || [];
        if (current.includes(optionId)) {
          return { ...prev, [questionId]: current.filter((id) => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...current, optionId] };
        }
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Calculate score
      let correct = 0;
      let total = quiz.questions.length;

      quiz.questions.forEach((question) => {
        const userAnswers = answers[question.id] || [];
        const correctOptions = question.options
          .filter((opt) => opt.is_correct)
          .map((opt) => opt.id);

        if (
          userAnswers.length === correctOptions.length &&
          userAnswers.every((ans) => correctOptions.includes(ans))
        ) {
          correct++;
        }
      });

      const percentage = (correct / total) * 100;

      // Create quiz attempt
      const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quiz.id,
          student_id: user.id,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          score: correct,
          max_score: total,
          percentage: percentage,
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      // Save responses
      const responses = quiz.questions.flatMap((question) => {
        const userAnswers = answers[question.id] || [];
        const correctOptions = question.options
          .filter((opt) => opt.is_correct)
          .map((opt) => opt.id);
        const isCorrect =
          userAnswers.length === correctOptions.length &&
          userAnswers.every((ans) => correctOptions.includes(ans));

        return userAnswers.map((optionId) => ({
          attempt_id: attempt.id,
          question_id: question.id,
          selected_options: [optionId],
          is_correct: isCorrect,
          marks_obtained: isCorrect ? 1 : 0,
        }));
      });

      if (responses.length > 0) {
        await supabase.from("question_responses").insert(responses);
      }

      setScore(percentage);
      setSubmitted(true);

      // Get passing score from quiz (default 70%)
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("passing_score")
        .eq("id", quiz.id)
        .single();

      const passingScore = quizData?.passing_score || 70;

      // Check if passed
      if (percentage >= passingScore) {
        setPassed(true);
        toast.success(`Quiz passed! Score: ${correct}/${total} (${percentage.toFixed(1)}%)`);
        // Mark lesson as complete
        if (step.lesson_id && user) {
          await supabase
            .from("lesson_progress")
            .upsert({
              lesson_id: step.lesson_id,
              student_id: user.id,
              completed: true,
              completed_at: new Date().toISOString(),
            });
        }
        // Unlock next step after a delay
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setPassed(false);
        toast.error(
          `Quiz failed. Score: ${correct}/${total} (${percentage.toFixed(1)}%). You need ${passingScore}% to pass. You can retry.`
        );
      }
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      toast.error(error.message || "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {quiz.questions.map((question, qIndex) => (
        <Card key={question.id}>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h4 className="font-semibold mb-2">
                Question {qIndex + 1}: {question.text}
              </h4>
            </div>
            <div className="space-y-2">
              {question.options.map((option) => {
                const isSelected = (answers[question.id] || []).includes(option.id);
                const isMultiple = question.qtype === "multiple";
                const showResult = submitted;

                return (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? showResult
                          ? option.is_correct
                            ? "bg-green-50 border-green-500"
                            : "bg-red-50 border-red-500"
                          : "bg-primary/5 border-primary"
                        : showResult && option.is_correct
                        ? "bg-green-50 border-green-500"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type={isMultiple ? "checkbox" : "radio"}
                      name={question.id}
                      checked={isSelected}
                      onChange={() => handleAnswerChange(question.id, option.id, isMultiple)}
                      disabled={submitted}
                      className="mt-1"
                    />
                    <span className="flex-1">{option.text}</span>
                    {showResult && option.is_correct && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {submitted && score !== null && (
        <Card className={passed ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}>
          <CardContent className="py-6 text-center">
            <h3 className="text-2xl font-bold mb-2">
              Score: {score.toFixed(1)}%
            </h3>
            <p className={passed ? "text-green-700 font-semibold" : "text-red-700"}>
              {passed
                ? "Congratulations! You passed the quiz. Next step unlocked!"
                : `You need to score at least 70% to pass. You can retry the quiz.`}
            </p>
          </CardContent>
        </Card>
      )}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(answers).length === 0}
          size="lg"
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Quiz"
          )}
        </Button>
      )}

      {submitted && !passed && (
        <Button
          onClick={() => {
            setSubmitted(false);
            setAnswers({});
            setScore(null);
            toast.info("You can retry the quiz. Good luck!");
          }}
          size="lg"
          className="w-full"
          variant="outline"
        >
          Retry Quiz
        </Button>
      )}
    </div>
  );
}


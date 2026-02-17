import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function StepEdit() {
  const { courseId, stepId } = useParams<{ courseId: string; stepId?: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isNew = !stepId;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [stepData, setStepData] = useState({
    title: "",
    description: "",
    content: "",
    video_url: "",
    position: 0,
  });

  const [quizData, setQuizData] = useState({
    title: "",
    questions: [
      {
        text: "",
        qtype: "single" as "single" | "multiple",
        options: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      },
    ],
  });

  useEffect(() => {
    if (role && role !== "faculty" && role !== "admin") {
      toast.error("You don't have permission to create steps");
      navigate("/dashboard");
    }
    if (!isNew && stepId) {
      fetchStep();
    }
  }, [stepId, isNew, role, navigate]);

  const fetchStep = async () => {
    if (!stepId || !courseId) return;
    try {
      setIsLoading(true);
      // Fetch module (step)
      const { data: module } = await supabase
        .from("modules")
        .select("*")
        .eq("id", stepId)
        .single();

      if (module) {
        setStepData({
          title: module.title || "",
          description: module.description || "",
          content: "",
          video_url: "",
          position: module.position || 0,
        });

        // Fetch lesson
        const { data: lessons } = await supabase
          .from("lessons")
          .select("*")
          .eq("module_id", stepId)
          .order("position")
          .limit(1);

        if (lessons && lessons.length > 0) {
          const lesson = lessons[0];
          setStepData((prev) => ({
            ...prev,
            content: lesson.content || "",
            video_url: lesson.media_url || "",
          }));
        }

        // Fetch quiz
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id, title")
          .eq("module_id", stepId)
          .limit(1);

        if (quizzes && quizzes.length > 0) {
          const quiz = quizzes[0];
          const { data: questions } = await supabase
            .from("questions")
            .select(`
              id,
              text,
              qtype,
              options(id, text, is_correct, position)
            `)
            .eq("quiz_id", quiz.id)
            .order("position");

          if (questions) {
            setQuizData({
              title: quiz.title || "",
              questions: questions.map((q: any) => ({
                text: q.text,
                qtype: q.qtype || "single",
                options: (q.options || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
              })),
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching step:", error);
      toast.error(error.message || "Failed to load step");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          text: "",
          qtype: "single",
          options: [
            { text: "", is_correct: false },
            { text: "", is_correct: false },
          ],
        },
      ],
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.filter((_, i) => i !== index),
    });
  };

  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...quizData.questions];
    newQuestions[questionIndex].options.push({ text: "", is_correct: false });
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...quizData.questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId) return;

    if (!stepData.title) {
      toast.error("Please enter step title");
      return;
    }

    setIsSaving(true);
    try {
      // Get next position
      const { count } = await supabase
        .from("modules")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId);

      const position = isNew ? (count || 0) : stepData.position;

      // Create/update module (step)
      let moduleId: string;
      if (isNew) {
        const { data: module, error: moduleError } = await supabase
          .from("modules")
          .insert({
            course_id: courseId,
            title: stepData.title,
            description: stepData.description || null,
            position: position,
          })
          .select()
          .single();

        if (moduleError) throw moduleError;
        moduleId = module.id;
      } else {
        const { error: moduleError } = await supabase
          .from("modules")
          .update({
            title: stepData.title,
            description: stepData.description || null,
            position: position,
          })
          .eq("id", stepId);

        if (moduleError) throw moduleError;
        moduleId = stepId!;
      }

      // Create/update lesson
      const { data: existingLessons } = await supabase
        .from("lessons")
        .select("id")
        .eq("module_id", moduleId)
        .limit(1);

      if (existingLessons && existingLessons.length > 0) {
        await supabase
          .from("lessons")
          .update({
            title: stepData.title,
            content: stepData.content || null,
            media_url: stepData.video_url || null,
            content_type: "video",
          })
          .eq("id", existingLessons[0].id);
      } else {
        await supabase.from("lessons").insert({
          module_id: moduleId,
          title: stepData.title,
          content: stepData.content || null,
          media_url: stepData.video_url || null,
          content_type: "video",
          position: 0,
        });
      }

      // Create/update quiz if questions exist
      if (quizData.questions.length > 0 && quizData.questions.some((q) => q.text.trim())) {
        const { data: existingQuizzes } = await supabase
          .from("quizzes")
          .select("id")
          .eq("module_id", moduleId)
          .limit(1);

        let quizId: string;
        if (existingQuizzes && existingQuizzes.length > 0) {
          quizId = existingQuizzes[0].id;
          await supabase
            .from("quizzes")
            .update({
              title: quizData.title || `Quiz for ${stepData.title}`,
              module_id: moduleId,
              is_published: true,
              passing_score: 70,
            })
            .eq("id", quizId);
        } else {
          const { data: newQuiz, error: quizError } = await supabase
            .from("quizzes")
            .insert({
              title: quizData.title || `Quiz for ${stepData.title}`,
              module_id: moduleId,
              created_by: user.id,
              is_published: true,
              passing_score: 70,
            })
            .select()
            .single();

          if (quizError) throw quizError;
          quizId = newQuiz.id;
        }

        // Delete existing questions
        await supabase.from("questions").delete().eq("quiz_id", quizId);

        // Create questions and options
        for (let qIndex = 0; qIndex < quizData.questions.length; qIndex++) {
          const question = quizData.questions[qIndex];
          if (!question.text.trim()) continue;

          const { data: newQuestion, error: questionError } = await supabase
            .from("questions")
            .insert({
              quiz_id: quizId,
              text: question.text,
              qtype: question.qtype,
              position: qIndex,
              marks: 1,
            })
            .select()
            .single();

          if (questionError) throw questionError;

          // Create options
          const optionsToInsert = question.options
            .filter((opt) => opt.text.trim())
            .map((opt, oIndex) => ({
              question_id: newQuestion.id,
              text: opt.text,
              is_correct: opt.is_correct,
              position: oIndex,
            }));

          if (optionsToInsert.length > 0) {
            await supabase.from("options").insert(optionsToInsert);
          }
        }
      }

      toast.success(isNew ? "Step created successfully!" : "Step updated successfully!");
      navigate(`/courses/${courseId}/edit`);
    } catch (error: any) {
      console.error("Error saving step:", error);
      toast.error(error.message || "Failed to save step");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isNew ? "Create New Step" : "Edit Step"}</CardTitle>
            <CardDescription>
              {isNew
                ? "Create a step with content, video, and quiz questions"
                : "Update step information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step Basic Info */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">
                    Step Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Step 1: Introduction to HTML"
                    value={stepData.title}
                    onChange={(e) => setStepData({ ...stepData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Step Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this step"
                    value={stepData.description}
                    onChange={(e) => setStepData({ ...stepData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="content">Step Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Detailed content/matter for this step..."
                    value={stepData.content}
                    onChange={(e) => setStepData({ ...stepData, content: e.target.value })}
                    rows={6}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="video">Step Video</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        id="video_url"
                        placeholder="Or enter video URL (YouTube, Vimeo, or direct link)"
                        value={stepData.video_url}
                        onChange={(e) => setStepData({ ...stepData, video_url: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground text-center">OR</div>
                    <div className="space-y-2">
                      <Label htmlFor="video_upload" className="cursor-pointer">
                        <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors">
                          {uploadingVideo ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Uploading...</span>
                            </div>
                          ) : videoFile ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{videoFile.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setVideoFile(null);
                                    setStepData({ ...stepData, video_url: "" });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-6 w-6 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Click to upload video or drag and drop
                              </span>
                              <span className="text-xs text-muted-foreground">
                                MP4, WebM, MOV (Max 100MB)
                              </span>
                            </div>
                          )}
                        </div>
                      </Label>
                      <input
                        type="file"
                        id="video_upload"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Check file size (100MB limit)
                          if (file.size > 100 * 1024 * 1024) {
                            toast.error("Video file size must be less than 100MB");
                            return;
                          }

                          setVideoFile(file);
                          setUploadingVideo(true);

                          try {
                            // Generate unique filename
                            const fileExt = file.name.split(".").pop();
                            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                            const filePath = `step-videos/${fileName}`;

                            // Upload to Supabase Storage
                            const { data: uploadData, error: uploadError } = await supabase.storage
                              .from("videos")
                              .upload(filePath, file, {
                                cacheControl: "3600",
                                upsert: false,
                              });

                            if (uploadError) {
                              // If bucket doesn't exist, create it first
                              if (uploadError.message.includes("Bucket not found")) {
                                toast.error("Video storage bucket not found. Please create a 'videos' bucket in Supabase Storage.");
                                setVideoFile(null);
                                setUploadingVideo(false);
                                return;
                              }
                              throw uploadError;
                            }

                            // Get public URL
                            const { data: urlData } = supabase.storage
                              .from("videos")
                              .getPublicUrl(filePath);

                            if (urlData?.publicUrl) {
                              setStepData({ ...stepData, video_url: urlData.publicUrl });
                              toast.success("Video uploaded successfully!");
                            } else {
                              throw new Error("Failed to get video URL");
                            }
                          } catch (error: any) {
                            console.error("Error uploading video:", error);
                            toast.error(error.message || "Failed to upload video");
                            setVideoFile(null);
                          } finally {
                            setUploadingVideo(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quiz Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Quiz Questions (3-4 recommended)</h3>
                    <p className="text-sm text-muted-foreground">
                      Add MCQ questions that students must pass to unlock the next step
                    </p>
                  </div>
                  <Button type="button" onClick={handleAddQuestion} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-6">
                  {quizData.questions.map((question, qIndex) => (
                    <Card key={qIndex}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                          {quizData.questions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveQuestion(qIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Question Text</Label>
                          <Input
                            placeholder="Enter question text"
                            value={question.text}
                            onChange={(e) => {
                              const newQuestions = [...quizData.questions];
                              newQuestions[qIndex].text = e.target.value;
                              setQuizData({ ...quizData, questions: newQuestions });
                            }}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Question Type</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={question.qtype}
                            onChange={(e) => {
                              const newQuestions = [...quizData.questions];
                              newQuestions[qIndex].qtype = e.target.value as "single" | "multiple";
                              setQuizData({ ...quizData, questions: newQuestions });
                            }}
                          >
                            <option value="single">Single Choice</option>
                            <option value="multiple">Multiple Choice</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddOption(qIndex)}
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Add Option
                            </Button>
                          </div>
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex gap-2">
                              <Input
                                placeholder={`Option ${oIndex + 1}`}
                                value={option.text}
                                onChange={(e) => {
                                  const newQuestions = [...quizData.questions];
                                  newQuestions[qIndex].options[oIndex].text = e.target.value;
                                  setQuizData({ ...quizData, questions: newQuestions });
                                }}
                              />
                              <label className="flex items-center gap-2 px-3 border rounded-md cursor-pointer hover:bg-muted">
                                <input
                                  type={question.qtype === "single" ? "radio" : "checkbox"}
                                  name={`correct-${qIndex}`}
                                  checked={option.is_correct}
                                  onChange={(e) => {
                                    const newQuestions = [...quizData.questions];
                                    if (question.qtype === "single") {
                                      // For single choice, uncheck all others
                                      newQuestions[qIndex].options.forEach((opt, idx) => {
                                        opt.is_correct = idx === oIndex;
                                      });
                                    } else {
                                      newQuestions[qIndex].options[oIndex].is_correct =
                                        e.target.checked;
                                    }
                                    setQuizData({ ...quizData, questions: newQuestions });
                                  }}
                                />
                                <span className="text-sm">Correct</span>
                              </label>
                              {question.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveOption(qIndex, oIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {isNew ? "Create Step" : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


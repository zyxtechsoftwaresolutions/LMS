import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function QuizEdit() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isNew = !id;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course_id: "",
    module_id: "",
    time_limit_seconds: null as number | null,
    passing_score: 50,
    max_attempts: 1,
    show_results: true,
    randomize_questions: true,
    randomize_options: false,
    negative_marking: false,
    negative_marks_value: 0,
    is_published: false,
  });

  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (role && role !== "faculty" && role !== "admin") {
      toast.error("You don't have permission to create quizzes");
      navigate("/dashboard");
    }
    fetchCourses();
    if (!isNew && id) {
      fetchQuiz();
    }
  }, [id, isNew, role, navigate]);

  const fetchCourses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("instructor_id", user.id)
        .order("title");

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchQuiz = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || "",
          description: data.description || "",
          course_id: data.course_id || "",
          module_id: data.module_id || "",
          time_limit_seconds: data.time_limit_seconds,
          passing_score: data.passing_score || 50,
          max_attempts: data.max_attempts || 1,
          show_results: data.show_results ?? true,
          randomize_questions: data.randomize_questions ?? true,
          randomize_options: data.randomize_options ?? false,
          negative_marking: data.negative_marking ?? false,
          negative_marks_value: data.negative_marks_value || 0,
          is_published: data.is_published ?? false,
        });
      }
    } catch (error: any) {
      console.error("Error fetching quiz:", error);
      toast.error(error.message || "Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!formData.title) {
      toast.error("Please fill in the quiz title");
      return;
    }

    setIsSaving(true);
    try {
      const quizData = {
        title: formData.title,
        description: formData.description || null,
        course_id: formData.course_id || null,
        module_id: formData.module_id || null,
        time_limit_seconds: formData.time_limit_seconds,
        passing_score: formData.passing_score,
        max_attempts: formData.max_attempts,
        show_results: formData.show_results,
        randomize_questions: formData.randomize_questions,
        randomize_options: formData.randomize_options,
        negative_marking: formData.negative_marking,
        negative_marks_value: formData.negative_marks_value,
        is_published: formData.is_published,
        created_by: user.id,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("quizzes")
          .insert(quizData)
          .select()
          .single();

        if (error) throw error;
        toast.success("Quiz created successfully!");
        navigate(`/quizzes/${data.id}/edit`);
      } else {
        const { error } = await supabase
          .from("quizzes")
          .update(quizData)
          .eq("id", id);

        if (error) throw error;
        toast.success("Quiz updated successfully!");
      }
    } catch (error: any) {
      console.error("Error saving quiz:", error);
      toast.error(error.message || "Failed to save quiz");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isNew ? "Create New Quiz" : "Edit Quiz"}</CardTitle>
            <CardDescription>
              {isNew ? "Fill in the details to create a new quiz" : "Update the quiz information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Quiz Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Midterm Exam"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Quiz description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="course_id">Course (Optional)</Label>
                <select
                  id="course_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="time_limit_seconds">Time Limit (seconds)</Label>
                  <Input
                    id="time_limit_seconds"
                    type="number"
                    placeholder="3600"
                    value={formData.time_limit_seconds || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        time_limit_seconds: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="passing_score">Passing Score (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passing_score}
                    onChange={(e) =>
                      setFormData({ ...formData, passing_score: parseInt(e.target.value) || 50 })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="max_attempts">Max Attempts</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  min="1"
                  value={formData.max_attempts}
                  onChange={(e) =>
                    setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_results"
                    checked={formData.show_results}
                    onChange={(e) => setFormData({ ...formData, show_results: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="show_results">Show results after submission</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="randomize_questions"
                    checked={formData.randomize_questions}
                    onChange={(e) =>
                      setFormData({ ...formData, randomize_questions: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="randomize_questions">Randomize questions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="randomize_options"
                    checked={formData.randomize_options}
                    onChange={(e) =>
                      setFormData({ ...formData, randomize_options: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="randomize_options">Randomize answer options</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="negative_marking"
                    checked={formData.negative_marking}
                    onChange={(e) =>
                      setFormData({ ...formData, negative_marking: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="negative_marking">Enable negative marking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_published">Publish quiz</Label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {isNew ? "Create Quiz" : "Save Changes"}
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

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, BookOpen, Users, Clock, Edit, Loader2, Play, User } from "lucide-react";
import { toast } from "sonner";
import { VideoPlayer } from "@/components/VideoPlayer";

interface Module {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  content_type: string;
  media_url: string | null;
  duration_seconds: number | null;
  position: number;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  visibility: string;
  video_url: string | null;
  tags: string[] | null;
  instructor_id: string | null;
  instructor_name: string | null;
  created_at: string;
  modules: Module[];
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCourse();
      if (user) {
        checkEnrollment();
        fetchEnrollmentCount();
      }
    }
  }, [id, user]);

  const fetchCourse = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");

      const { data, error: courseError } = await supabase
        .from("courses")
        .select(`
          *,
          profiles!courses_instructor_id_fkey(full_name),
          modules(
            *,
            lessons(*)
          )
        `)
        .eq("id", id)
        .single();

      if (courseError) throw courseError;

      if (data) {
        const courseData: Course = {
          id: data.id,
          title: data.title,
          slug: data.slug,
          description: data.description,
          thumbnail_url: data.thumbnail_url,
          visibility: data.visibility,
          video_url: (data as any).video_url || null,
          tags: data.tags,
          instructor_id: data.instructor_id,
          instructor_name: (data.profiles as any)?.full_name || null,
          created_at: data.created_at,
          modules: (data.modules || []).map((mod: any) => ({
            id: mod.id,
            title: mod.title,
            description: mod.description,
            position: mod.position || 0,
            lessons: (mod.lessons || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
          })).sort((a: any, b: any) => a.position - b.position),
        };
        setCourse(courseData);
      }
    } catch (error: any) {
      console.error("Error fetching course:", error);
      setError(error.message || "Failed to load course");
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!id || !user) return;
    try {
      const { data } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", id)
        .eq("student_id", user.id)
        .maybeSingle();

      setIsEnrolled(!!data);
    } catch (error) {
      console.error("Error checking enrollment:", error);
    }
  };

  const fetchEnrollmentCount = async () => {
    if (!id) return;
    try {
      const { count } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("course_id", id);

      setEnrollmentCount(count || 0);
    } catch (error) {
      console.error("Error fetching enrollment count:", error);
    }
  };

  const handleEnroll = async () => {
    if (!id || !user) {
      toast.error("You must be logged in to enroll");
      return;
    }

    try {
      const { error } = await supabase
        .from("enrollments")
        .insert({
          course_id: id,
          student_id: user.id,
        });

      if (error) throw error;

      toast.success("Successfully enrolled in course!");
      setIsEnrolled(true);
      fetchEnrollmentCount();
    } catch (error: any) {
      console.error("Error enrolling:", error);
      toast.error(error.message || "Failed to enroll in course");
    }
  };

  const canEdit = role === "admin" || (role === "faculty" && course?.instructor_id === user?.id);

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

  if (error || !course) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto max-w-7xl">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">{error || "Course not found"}</p>
              <Button variant="outline" onClick={() => navigate("/courses")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl space-y-6">
        {/* Course Header */}
        <Card>
          {course.video_url ? (
            <div className="p-6">
              <VideoPlayer
                videoUrl={course.video_url}
                thumbnailUrl={course.thumbnail_url}
                title={course.title}
              />
            </div>
          ) : course.thumbnail_url ? (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-3xl">{course.title}</CardTitle>
                  {course.visibility === "targeted" && (
                    <Badge variant="secondary">Targeted</Badge>
                  )}
                  {course.visibility === "private" && (
                    <Badge variant="outline">Private</Badge>
                  )}
                </div>
                {course.instructor_name && (
                  <CardDescription className="flex items-center gap-1 text-base">
                    <User className="h-4 w-4" />
                    Instructor: {course.instructor_name}
                  </CardDescription>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {enrollmentCount} enrolled
                  </div>
                  {course.modules.length > 0 && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.modules.length} module{course.modules.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/courses/${course.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Course
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {course.description && (
              <p className="text-lg mb-6 whitespace-pre-wrap">{course.description}</p>
            )}

            {course.tags && course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {course.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}


            {role === "student" && !isEnrolled && course.visibility === "public" && (
              <Button onClick={handleEnroll} size="lg" className="w-full sm:w-auto">
                Enroll in Course
              </Button>
            )}

            {isEnrolled && (
              <div className="space-y-4">
                <Badge variant="default" className="text-base px-4 py-2">
                  You are enrolled in this course
                </Badge>
                <Button
                  onClick={() => navigate(`/courses/${id}/steps`)}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Learning
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modules and Lessons */}
        {course.modules && course.modules.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Course Content</h2>
            {course.modules.map((module) => (
              <Card key={module.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {module.title}
                  </CardTitle>
                  {module.description && (
                    <CardDescription>{module.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {module.lessons && module.lessons.length > 0 ? (
                    <div className="space-y-2">
                      {module.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                              {lesson.position || 0}
                            </div>
                            <div>
                              <div className="font-medium">{lesson.title}</div>
                              {lesson.duration_seconds && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {Math.floor(lesson.duration_seconds / 60)} min
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {lesson.content_type || "html"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No lessons in this module yet.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No content yet</h3>
              <p className="text-muted-foreground mb-6">
                This course doesn't have any modules or lessons yet.
              </p>
              {canEdit && (
                <Button onClick={() => navigate(`/courses/${course.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Add Content
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

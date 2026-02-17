import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Plus, BookOpen, Eye, Edit, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  visibility: string;
  created_at: string;
  enrollments_count?: number;
}

export default function MyCourses() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && (role === "faculty" || role === "admin")) {
      fetchCourses();
    } else {
      toast.error("You don't have permission to view this page");
      navigate("/dashboard");
    }
  }, [user, role, navigate]);

  const fetchCourses = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, slug, description, thumbnail_url, visibility, created_at")
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get enrollment counts for each course
      if (data) {
        const coursesWithCounts = await Promise.all(
          data.map(async (course) => {
            const { count } = await supabase
              .from("enrollments")
              .select("id", { count: "exact", head: true })
              .eq("course_id", course.id);
            return { ...course, enrollments_count: count || 0 };
          })
        );
        setCourses(coursesWithCounts);
      }
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast.error(error.message || "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-1">Manage your courses</p>
          </div>
          <Button onClick={() => navigate("/courses/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first course to start teaching
              </p>
              <Button onClick={() => navigate("/courses/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {course.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.enrollments_count || 0} students</span>
                    </div>
                    <span className="capitalize">{course.visibility}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/courses/${course.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}






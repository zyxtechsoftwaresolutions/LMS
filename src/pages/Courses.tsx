import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Filter, Sparkles, TrendingUp, Clock, Users, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  visibility: string;
  instructor_id: string | null;
  instructor_name: string | null;
  tags: string[] | null;
  created_at: string;
}

export default function Courses() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
  }, [user, role]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      
      // Build query based on user role and visibility
      let query = supabase
        .from("courses")
        .select(`
          id,
          title,
          slug,
          description,
          thumbnail_url,
          visibility,
          instructor_id,
          tags,
          created_at,
          profiles!courses_instructor_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      // Apply visibility filter based on user role
      if (role === "admin") {
        // Admins can see all courses
      } else if (role === "faculty") {
        // Faculty can see their own courses and public courses
        if (user?.id) {
          query = query.or(`visibility.eq.public,instructor_id.eq.${user.id}`);
        } else {
          query = query.eq("visibility", "public");
        }
      } else {
        // Students can see public courses and targeted courses they're enrolled in
        if (user?.id) {
          // Get targeted courses for this student
          const { data: targetedCourses } = await (supabase as any)
            .from("course_target_students")
            .select("course_id")
            .eq("student_id", user.id);

          const targetedCourseIds = targetedCourses?.map((tc: any) => tc.course_id) || [];

          if (targetedCourseIds.length > 0) {
            query = query.or(`visibility.eq.public,id.in.(${targetedCourseIds.join(",")})`);
          } else {
            query = query.eq("visibility", "public");
          }
        } else {
          query = query.eq("visibility", "public");
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include instructor name
      const transformedCourses = (data || []).map((course: any) => {
        // Handle both nested profile object and direct profile data
        const instructorName = 
          course.profiles?.full_name || 
          (typeof course.profiles === 'object' && course.profiles !== null 
            ? course.profiles.full_name 
            : null) ||
          null;
        
        return {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          visibility: course.visibility,
          instructor_id: course.instructor_id,
          instructor_name: instructorName,
          tags: course.tags,
          created_at: course.created_at,
        };
      });

      setCourses(transformedCourses);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast.error(error.message || "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      course.title.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      course.instructor_name?.toLowerCase().includes(query) ||
      course.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Browse Courses</h1>
              <p className="text-lg text-muted-foreground mt-1">
                Discover courses to enhance your skills and advance your career
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-2 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search courses by title, instructor, or topic..."
                  className="pl-12 h-12 text-base border-2 focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="h-12 px-6 border-2 hover:bg-muted/50"
              >
                <Filter className="mr-2 h-5 w-5" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <BookOpen className="h-12 w-12 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-2xl font-bold">
                  {searchQuery ? "No courses found" : "No courses available yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Courses will appear here once faculty members create them. Check back soon for exciting new content!"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                {course.thumbnail_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    {course.visibility === "targeted" && (
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md whitespace-nowrap">
                        Targeted
                      </span>
                    )}
                  </div>
                  {course.instructor_name && (
                    <CardDescription className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {course.instructor_name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {course.description || "No description available"}
                  </p>
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/courses/${course.id}`);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Course
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

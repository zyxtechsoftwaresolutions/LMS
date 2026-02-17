import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileQuestion, TrendingUp, ArrowRight, GraduationCap, Plus, BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    myCourses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    avgScore: "N/A",
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      if (!user?.id) return;

      // Get courses created by this faculty
      const { data: courses, count: coursesCount } = await supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", user.id);

      // Get total students enrolled in faculty's courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user.id);

      const courseIds = coursesData?.map((c) => c.id) || [];
      let totalStudents = 0;
      if (courseIds.length > 0) {
        const { count } = await supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .in("course_id", courseIds);
        totalStudents = count || 0;
      }

      // Get quizzes created by this faculty
      const { count: quizzesCount } = await supabase
        .from("quizzes")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id);

      // Calculate average score from quiz attempts
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("id")
        .eq("created_by", user.id);

      const quizIds = quizzesData?.map((q) => q.id) || [];
      let avgScore = "N/A";
      if (quizIds.length > 0) {
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("percentage")
          .in("quiz_id", quizIds)
          .not("percentage", "is", null);

        if (attempts && attempts.length > 0) {
          const sum = attempts.reduce((acc, a) => acc + (a.percentage || 0), 0);
          avgScore = (sum / attempts.length).toFixed(1) + "%";
        }
      }

      setStats({
        myCourses: coursesCount || 0,
        totalStudents: totalStudents,
        totalQuizzes: quizzesCount || 0,
        avgScore: avgScore,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const facultyActions = [
    {
      title: "Create Course",
      description: "Create a new course and start teaching",
      icon: Plus,
      action: () => navigate("/courses/new"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "My Courses",
      description: "View and manage your courses",
      icon: BookOpen,
      action: () => navigate("/courses/my"),
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Create Quiz",
      description: "Create assessments for your students",
      icon: FileQuestion,
      action: () => navigate("/quizzes/new"),
      color: "from-orange-500 to-red-500",
    },
    {
      title: "View Analytics",
      description: "See student performance and statistics",
      icon: BarChart3,
      action: () => navigate("/faculty/analytics"),
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl space-y-8">
        {/* Welcome Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">
                Welcome, {profile?.full_name?.split(" ")[0] || "Faculty"}! 👋
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Manage your courses and help students succeed
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                My Courses
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {stats.myCourses}
              </div>
              <p className="text-xs text-muted-foreground">Courses created</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Students
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                {stats.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Quizzes
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <FileQuestion className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {stats.totalQuizzes}
              </div>
              <p className="text-xs text-muted-foreground">Quizzes created</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Avg. Score
              </CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {stats.avgScore}
              </div>
              <p className="text-xs text-muted-foreground">Student performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Faculty Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {facultyActions.map((action) => (
              <Card
                key={action.title}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer"
                onClick={action.action}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
                <CardContent className="p-6 flex items-center gap-4 relative z-10">
                  <div
                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity or Empty State */}
        {stats.myCourses === 0 && (
          <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-muted/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Get Started</CardTitle>
                  <CardDescription className="text-base">Create your first course</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <Plus className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No courses yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start by creating your first course and sharing your knowledge with students.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate("/courses/new")}
                >
                  Create Course <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

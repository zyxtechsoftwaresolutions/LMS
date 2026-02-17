import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BarChart3, Users, BookOpen, TrendingUp, Loader2, Award, Clock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function FacultyAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    avgScore: "N/A",
    completionRate: "N/A",
  });
  const [detailedStats, setDetailedStats] = useState({
    coursePerformance: [] as { course: string; students: number; avgProgress: number }[],
    quizScores: [] as { quiz: string; avgScore: number }[],
    studentEngagement: [] as { month: string; enrollments: number }[],
    completionRates: [] as { course: string; rate: number }[],
    topPerformingQuizzes: [] as { quiz: string; passRate: number }[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);

      // Get courses
      const { count: coursesCount } = await supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", user.id);

      // Get students enrolled in courses
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

      // Get quizzes
      const { count: quizzesCount } = await supabase
        .from("quizzes")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id);

      // Get average score
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
        totalCourses: coursesCount || 0,
        totalStudents: totalStudents,
        totalQuizzes: quizzesCount || 0,
        avgScore: avgScore,
        completionRate: "N/A", // Can be calculated based on enrollments vs completions
      });

      // Fetch detailed analytics
      await fetchDetailedAnalytics();
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetailedAnalytics = async () => {
    if (!user?.id) return;

    try {
      // Course performance
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, enrollments(id, progress, completed_at)")
        .eq("instructor_id", user.id);

      const coursePerformance = coursesData?.map((course: any) => {
        const enrollments = course.enrollments || [];
        const avgProgress =
          enrollments.length > 0
            ? enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / enrollments.length
            : 0;
        return {
          course: course.title.length > 20 ? course.title.substring(0, 20) + "..." : course.title,
          students: enrollments.length,
          avgProgress: Math.round(avgProgress),
        };
      }) || [];

      // Quiz scores by quiz
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("id, title, quiz_attempts(percentage)")
        .eq("created_by", user.id);

      const quizScores = quizzesData
        ?.map((quiz: any) => {
          const attempts = quiz.quiz_attempts || [];
          const validScores = attempts.filter((a: any) => a.percentage != null).map((a: any) => a.percentage);
          const avgScore = validScores.length > 0 ? validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length : 0;
          return {
            quiz: quiz.title.length > 20 ? quiz.title.substring(0, 20) + "..." : quiz.title,
            avgScore: Math.round(avgScore),
          };
        })
        .filter((item) => item.avgScore > 0) || [];

      // Student engagement (enrollments over time)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Get course IDs first
      const { data: instructorCourses } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user.id);

      const courseIds = instructorCourses?.map((c) => c.id) || [];
      let enrollmentsData: any[] = [];

      if (courseIds.length > 0) {
        const { data } = await supabase
          .from("enrollments")
          .select("enrolled_at")
          .in("course_id", courseIds)
          .gte("enrolled_at", sixMonthsAgo.toISOString())
          .order("enrolled_at", { ascending: true });
        enrollmentsData = data || [];
      }

      const engagementMap = new Map<string, number>();
      enrollmentsData?.forEach((enrollment) => {
        const date = new Date(enrollment.enrolled_at || new Date());
        const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        engagementMap.set(month, (engagementMap.get(month) || 0) + 1);
      });

      const studentEngagement = Array.from(engagementMap.entries()).map(([month, enrollments]) => ({
        month,
        enrollments,
      }));

      // Course completion rates
      const completionRates = coursesData
        ?.map((course: any) => {
          const enrollments = course.enrollments || [];
          const completed = enrollments.filter((e: any) => e.completed_at).length;
          const rate = enrollments.length > 0 ? (completed / enrollments.length) * 100 : 0;
          return {
            course: course.title.length > 25 ? course.title.substring(0, 25) + "..." : course.title,
            rate: Math.round(rate),
          };
        })
        .filter((item) => item.rate > 0)
        .sort((a, b) => b.rate - a.rate) || [];

      // Top performing quizzes (by pass rate)
      const topPerformingQuizzes = quizzesData
        ?.map((quiz: any) => {
          const attempts = quiz.quiz_attempts || [];
          const passingScore = 50; // Default passing score
          const passed = attempts.filter((a: any) => a.percentage && a.percentage >= passingScore).length;
          const passRate = attempts.length > 0 ? (passed / attempts.length) * 100 : 0;
          return {
            quiz: quiz.title.length > 20 ? quiz.title.substring(0, 20) + "..." : quiz.title,
            passRate: Math.round(passRate),
          };
        })
        .filter((item) => item.passRate > 0)
        .sort((a, b) => b.passRate - a.passRate)
        .slice(0, 5) || [];

      setDetailedStats({
        coursePerformance: coursePerformance.slice(0, 5),
        quizScores: quizScores.slice(0, 5),
        studentEngagement: studentEngagement.length > 0 ? studentEngagement : [{ month: "No data", enrollments: 0 }],
        completionRates: completionRates.slice(0, 5),
        topPerformingQuizzes,
      });
    } catch (error) {
      console.error("Error fetching detailed analytics:", error);
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
      <div className="container px-4 py-8 mx-auto max-w-7xl space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Analytics</h1>
            <p className="text-lg text-muted-foreground mt-1">View your teaching performance</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                Courses
              </CardTitle>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Total courses created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                Students
              </CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                Quizzes
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalQuizzes}</div>
              <p className="text-xs text-muted-foreground">Quizzes created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                Avg Score
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgScore}</div>
              <p className="text-xs text-muted-foreground">Student average</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Course Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>Student enrollment and average progress</CardDescription>
            </CardHeader>
            <CardContent>
              {detailedStats.coursePerformance.length > 0 ? (
                <ChartContainer
                  config={{
                    students: {
                      label: "Students",
                      color: "hsl(var(--chart-1))",
                    },
                    avgProgress: {
                      label: "Avg Progress (%)",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={detailedStats.coursePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="students" fill="var(--color-students)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="avgProgress" fill="var(--color-avgProgress)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No course data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Student Engagement</CardTitle>
              <CardDescription>New enrollments over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  enrollments: {
                    label: "Enrollments",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <LineChart data={detailedStats.studentEngagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    stroke="var(--color-enrollments)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-enrollments)" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Quiz Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Average Scores</CardTitle>
              <CardDescription>Average performance by quiz</CardDescription>
            </CardHeader>
            <CardContent>
              {detailedStats.quizScores.length > 0 ? (
                <ChartContainer
                  config={{
                    avgScore: {
                      label: "Average Score (%)",
                      color: "hsl(var(--chart-4))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={detailedStats.quizScores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="quiz" type="category" width={120} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No quiz data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Completion Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Course Completion Rates</CardTitle>
              <CardDescription>Percentage of students who completed courses</CardDescription>
            </CardHeader>
            <CardContent>
              {detailedStats.completionRates.length > 0 ? (
                <ChartContainer
                  config={{
                    rate: {
                      label: "Completion Rate (%)",
                      color: "hsl(var(--chart-5))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={detailedStats.completionRates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="rate" fill="var(--color-rate)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No completion data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Quizzes */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Top Performing Quizzes</CardTitle>
              <CardDescription>Quizzes with highest pass rates</CardDescription>
            </CardHeader>
            <CardContent>
              {detailedStats.topPerformingQuizzes.length > 0 ? (
                <div className="space-y-4">
                  {detailedStats.topPerformingQuizzes.map((quiz, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{quiz.quiz}</span>
                        <span className="text-sm font-bold text-primary">{quiz.passRate}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${quiz.passRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No quiz performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}



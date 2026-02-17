import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BarChart3, Users, BookOpen, GraduationCap, Loader2, TrendingUp, Award, Clock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminAnalytics() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalQuizzes: 0,
  });
  const [detailedStats, setDetailedStats] = useState({
    userGrowth: [] as { month: string; users: number }[],
    topCourses: [] as { title: string; enrollments: number }[],
    enrollmentTrends: [] as { month: string; enrollments: number }[],
    quizPerformance: { passed: 0, failed: 0, total: 0 },
    completionRates: [] as { course: string; rate: number }[],
    recentActivity: [] as { type: string; description: string; date: string }[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && role === "admin") {
      fetchAnalytics();
    }
  }, [user, role]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      const [
        usersResult,
        coursesResult,
        studentsResult,
        facultyResult,
        quizzesResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student"),
        supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "faculty"),
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalStudents: studentsResult.count || 0,
        totalFaculty: facultyResult.count || 0,
        totalQuizzes: quizzesResult.count || 0,
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
    try {
      // User growth over last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: usersData } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true });

      const userGrowthMap = new Map<string, number>();
      usersData?.forEach((user) => {
        const date = new Date(user.created_at);
        const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        userGrowthMap.set(month, (userGrowthMap.get(month) || 0) + 1);
      });

      let cumulative = 0;
      const userGrowth = Array.from(userGrowthMap.entries()).map(([month, count]) => {
        cumulative += count;
        return { month, users: cumulative };
      });

      // Top courses by enrollment
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select("course_id, courses(title)");

      const courseEnrollmentMap = new Map<string, { title: string; count: number }>();
      enrollmentsData?.forEach((enrollment: any) => {
        const courseId = enrollment.course_id;
        const courseTitle = enrollment.courses?.title || "Unknown Course";
        const current = courseEnrollmentMap.get(courseId) || { title: courseTitle, count: 0 };
        courseEnrollmentMap.set(courseId, { ...current, count: current.count + 1 });
      });

      const topCourses = Array.from(courseEnrollmentMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item) => ({ title: item.title.length > 30 ? item.title.substring(0, 30) + "..." : item.title, enrollments: item.count }));

      // Enrollment trends
      const { data: enrollmentsTrendData } = await supabase
        .from("enrollments")
        .select("enrolled_at")
        .gte("enrolled_at", sixMonthsAgo.toISOString())
        .order("enrolled_at", { ascending: true });

      const enrollmentTrendMap = new Map<string, number>();
      enrollmentsTrendData?.forEach((enrollment) => {
        const date = new Date(enrollment.enrolled_at || new Date());
        const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        enrollmentTrendMap.set(month, (enrollmentTrendMap.get(month) || 0) + 1);
      });

      const enrollmentTrends = Array.from(enrollmentTrendMap.entries()).map(([month, enrollments]) => ({
        month,
        enrollments,
      }));

      // Quiz performance
      const { data: quizAttempts } = await supabase
        .from("quiz_attempts")
        .select("percentage, quizzes(passing_score)");

      let passed = 0;
      let failed = 0;
      quizAttempts?.forEach((attempt: any) => {
        const passingScore = attempt.quizzes?.passing_score || 50;
        if (attempt.percentage && attempt.percentage >= passingScore) {
          passed++;
        } else {
          failed++;
        }
      });

      // Course completion rates
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, enrollments(id, completed_at)");

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
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5) || [];

      // Recent activity (simplified - can be enhanced)
      const { data: recentCourses } = await supabase
        .from("courses")
        .select("title, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const recentActivity = recentCourses?.map((course) => ({
        type: "course",
        description: `New course: ${course.title}`,
        date: new Date(course.created_at).toLocaleDateString(),
      })) || [];

      setDetailedStats({
        userGrowth: userGrowth.length > 0 ? userGrowth : [{ month: "No data", users: 0 }],
        topCourses: topCourses.length > 0 ? topCourses : [{ title: "No courses", enrollments: 0 }],
        enrollmentTrends: enrollmentTrends.length > 0 ? enrollmentTrends : [{ month: "No data", enrollments: 0 }],
        quizPerformance: { passed, failed, total: passed + failed },
        completionRates: completionRates,
        recentActivity,
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
            <h1 className="text-4xl font-bold">Platform Analytics</h1>
            <p className="text-lg text-muted-foreground mt-1">Overview of platform performance</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                Users
              </CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                Students
              </CardTitle>
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                Faculty
              </CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalFaculty}</div>
              <p className="text-xs text-muted-foreground">Instructors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                Courses
              </CardTitle>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Total courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">
                Quizzes
              </CardTitle>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalQuizzes}</div>
              <p className="text-xs text-muted-foreground">Total quizzes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New users over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  users: {
                    label: "Users",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <LineChart data={detailedStats.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="var(--color-users)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-users)" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Enrollment Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trends</CardTitle>
              <CardDescription>Course enrollments over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  enrollments: {
                    label: "Enrollments",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <BarChart data={detailedStats.enrollmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Top Courses by Enrollment</CardTitle>
              <CardDescription>Most popular courses</CardDescription>
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
                <BarChart data={detailedStats.topCourses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="title" type="category" width={150} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Quiz Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Performance</CardTitle>
              <CardDescription>Overall quiz pass/fail rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  passed: {
                    label: "Passed",
                    color: "hsl(142, 76%, 36%)",
                  },
                  failed: {
                    label: "Failed",
                    color: "hsl(0, 84%, 60%)",
                  },
                }}
                className="h-[300px]"
              >
                <PieChart>
                  <Pie
                    data={[
                      { name: "Passed", value: detailedStats.quizPerformance.passed },
                      { name: "Failed", value: detailedStats.quizPerformance.failed },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="hsl(142, 76%, 36%)" />
                    <Cell fill="hsl(0, 84%, 60%)" />
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{detailedStats.quizPerformance.passed}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{detailedStats.quizPerformance.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Completion Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Course Completion Rates</CardTitle>
              <CardDescription>Top courses by completion percentage</CardDescription>
            </CardHeader>
            <CardContent>
              {detailedStats.completionRates.length > 0 ? (
                <ChartContainer
                  config={{
                    rate: {
                      label: "Completion Rate (%)",
                      color: "hsl(var(--chart-4))",
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedStats.recentActivity.length > 0 ? (
                  detailedStats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}



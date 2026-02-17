import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Award, TrendingUp, ArrowRight, Sparkles, Target, Zap } from "lucide-react";
import AdminDashboard from "./dashboard/AdminDashboard";
import FacultyDashboard from "./dashboard/FacultyDashboard";

export default function Dashboard() {
  const { user, profile, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            <div className="text-muted-foreground">Loading your dashboard...</div>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = [
    { 
      title: "Enrolled Courses", 
      value: "0", 
      icon: BookOpen, 
      gradient: "from-blue-500 to-cyan-500",
      description: "Active courses"
    },
    { 
      title: "Hours Learned", 
      value: "0", 
      icon: Clock, 
      gradient: "from-purple-500 to-pink-500",
      description: "Total time spent"
    },
    { 
      title: "Quizzes Completed", 
      value: "0", 
      icon: Award, 
      gradient: "from-orange-500 to-red-500",
      description: "Assessments finished"
    },
    { 
      title: "Avg. Score", 
      value: "N/A", 
      icon: TrendingUp, 
      gradient: "from-green-500 to-emerald-500",
      description: "Overall performance"
    },
  ];

  const quickActions = [
    { title: "Browse Courses", description: "Discover new courses", icon: BookOpen, action: () => navigate("/courses"), color: "from-blue-500 to-cyan-500" },
    { title: "View Profile", description: "Update your information", icon: Target, action: () => navigate("/profile"), color: "from-purple-500 to-pink-500" },
  ];

  // Show admin dashboard for admin users
  if (role === "admin") {
    return <AdminDashboard />;
  }

  // Show faculty dashboard for faculty users
  if (role === "faculty") {
    return <FacultyDashboard />;
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl space-y-8">
        {/* Welcome Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">
                Welcome back, {profile?.full_name?.split(" ")[0] || "Learner"}! 👋
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Continue your learning journey and achieve your goals
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl bg-card"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {quickActions.map((action) => (
            <Card 
              key={action.title}
              className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer"
              onClick={action.action}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <CardContent className="p-6 flex items-center gap-4 relative z-10">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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

        {/* Get Started Section */}
        <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription className="text-base">Begin your learning journey today</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">No courses enrolled yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start by exploring our course catalog and find the perfect course to begin your learning journey.
              </p>
            </div>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate("/courses")}
              >
                Browse Courses <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

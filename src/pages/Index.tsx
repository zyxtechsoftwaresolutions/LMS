import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, Play, ArrowRight, CheckCircle2, Sparkles, TrendingUp, Clock, Star, Zap, Shield, GraduationCap, Video, FileText, Brain, Rocket, Globe, Target, ChevronRight } from "lucide-react";

const features = [
  { 
    icon: Video, 
    title: "Video Lessons", 
    description: "High-quality video content from expert instructors",
    color: "from-red-500 to-pink-500",
    bg: "bg-red-50 dark:bg-red-950/20"
  },
  { 
    icon: Brain, 
    title: "Interactive Quizzes", 
    description: "Test your knowledge with engaging assessments",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-950/20"
  },
  { 
    icon: FileText, 
    title: "Study Materials", 
    description: "Download PDFs, notes, and resources",
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50 dark:bg-purple-950/20"
  },
  { 
    icon: Award, 
    title: "Certificates", 
    description: "Earn verified certificates upon completion",
    color: "from-orange-500 to-amber-500",
    bg: "bg-orange-50 dark:bg-orange-950/20"
  },
];

const benefits = [
  { icon: Rocket, title: "Fast Track Learning", description: "Accelerate your career with focused courses" },
  { icon: Globe, title: "Learn Anywhere", description: "Access courses from any device, anywhere" },
  { icon: Target, title: "Goal-Oriented", description: "Structured paths to achieve your objectives" },
  { icon: Zap, title: "Instant Access", description: "Start learning immediately after enrollment" },
];

const stats = [
  { value: "50K+", label: "Active Learners", sublabel: "Growing daily", icon: Users, color: "from-blue-500 to-cyan-500" },
  { value: "1,200+", label: "Courses", sublabel: "Expert-led content", icon: BookOpen, color: "from-purple-500 to-pink-500" },
  { value: "98%", label: "Success Rate", sublabel: "Student satisfaction", icon: Star, color: "from-orange-500 to-red-500" },
  { value: "24/7", label: "Support", sublabel: "Always available", icon: Clock, color: "from-green-500 to-emerald-500" },
];

const testimonials = [
  { name: "Sarah Johnson", role: "Software Engineer", text: "The courses here transformed my career. Best investment I've made!", rating: 5 },
  { name: "Michael Chen", role: "Data Analyst", text: "Clear explanations and practical examples. Highly recommended!", rating: 5 },
  { name: "Emily Rodriguez", role: "Marketing Manager", text: "Flexible learning schedule fits perfectly with my work life.", rating: 5 },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section - Split Design */}
      <section className="relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-pink-500/30 to-orange-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="container px-4 mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[85vh] py-20">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 text-primary text-sm font-semibold backdrop-blur-sm">
                <Sparkles className="h-4 w-4" /> 
                <span>Developed by the Team Onetap Orbit</span>
              </div>

              <div className="space-y-6">
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight uppercase tracking-tight flex items-center gap-4 justify-start">
                  <img 
                    src="/V Connect V03.png" 
                    alt="VIDHYA HUB Logo" 
                    className="h-24 md:h-32 lg:h-40 w-auto object-contain flex-shrink-0 -ml-[100px]"
                  />
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      VIDHYA HUB
                    </span>
                    <span className="absolute bottom-2 left-0 right-0 h-4 bg-primary/20 -rotate-1"></span>
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl">
                  Unlock your potential with expert-led courses, hands-on projects, and a community of passionate learners.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-pink-600/90 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300" 
                  asChild
                >
                  <Link to="/auth?tab=signup">
                    Start Free Trial <Rocket className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-8 text-lg font-semibold border-2 hover:bg-muted/80 hover:scale-105 transition-all" 
                  asChild
                >
                  <Link to="/courses" className="flex items-center">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                {["No credit card", "Free courses", "Cancel anytime"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-medium">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Card */}
                <Card className="border-2 shadow-2xl bg-gradient-to-br from-card to-muted/30 backdrop-blur-sm">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                        <GraduationCap className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Interactive Learning</h3>
                        <p className="text-sm text-muted-foreground">Real-time progress tracking</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-primary/20 rounded-full mb-1" style={{ width: `${60 + i * 10}%` }}></div>
                            <p className="text-xs text-muted-foreground">Course Module {i}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-gradient-to-br from-orange-500 to-red-500 text-white p-4 rounded-2xl shadow-xl animate-float">
                  <Award className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-green-500 to-emerald-500 text-white p-4 rounded-2xl shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                  <Star className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 via-background to-muted/30">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={stat.label} 
                className="text-center border-2 hover:border-primary/50 transition-all hover:shadow-xl group"
              >
                <CardContent className="p-6 space-y-3">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} mb-2 shadow-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className={`text-3xl md:text-4xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-foreground">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Zap className="h-4 w-4" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Excel
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive learning platform with all the tools you need to succeed
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-card"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardContent className="p-6 relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((benefit, index) => (
              <div 
                key={benefit.title}
                className="flex items-start gap-4 p-6 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Star className="h-4 w-4" />
              Student Reviews
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Loved by <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Thousands</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our students have to say about their learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:shadow-xl transition-all hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="container px-4 mx-auto max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Ready to Start Your
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Learning Journey?
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join thousands of students who are already advancing their careers. 
                Start learning today with our free courses.
              </p>
              
              <div className="space-y-3">
                {["No credit card required", "Free courses available", "Cancel anytime", "Lifetime access"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-pink-600/90 shadow-xl hover:shadow-2xl hover:scale-105 transition-all" 
                  asChild
                >
                  <Link to="/auth?tab=signup">
                    Get Started Free <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-8 text-lg font-semibold border-2 hover:bg-muted/80" 
                  asChild
                >
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            </div>

            {/* Right Side - Visual Card */}
            <Card className="border-2 shadow-2xl bg-gradient-to-br from-card to-muted/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                  Quick Start Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { step: "1", title: "Create Account", desc: "Sign up in 30 seconds" },
                  { step: "2", title: "Choose Course", desc: "Browse our catalog" },
                  { step: "3", title: "Start Learning", desc: "Begin immediately" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold mb-1">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}

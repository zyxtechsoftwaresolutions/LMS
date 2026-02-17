import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import AdminSettings from "./pages/AdminSettings";
import UserManagement from "./pages/admin/UserManagement";
import AdminAnalytics from "./pages/admin/Analytics";
import CourseEdit from "./pages/courses/CourseEdit";
import CourseDetail from "./pages/courses/CourseDetail";
import CourseSteps from "./pages/courses/CourseSteps";
import StepEdit from "./pages/courses/StepEdit";
import MyCourses from "./pages/courses/MyCourses";
import QuizEdit from "./pages/quizzes/QuizEdit";
import FacultyAnalytics from "./pages/faculty/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/faculty" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/new" element={<CourseEdit />} />
            <Route path="/courses/my" element={<MyCourses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/courses/:id/steps" element={<CourseSteps />} />
            <Route path="/courses/:id/edit" element={<CourseEdit />} />
            <Route path="/courses/:courseId/steps/new" element={<StepEdit />} />
            <Route path="/courses/:courseId/steps/:stepId/edit" element={<StepEdit />} />
            <Route path="/quizzes/new" element={<QuizEdit />} />
            <Route path="/quizzes/:id/edit" element={<QuizEdit />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/faculty/analytics" element={<FacultyAnalytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

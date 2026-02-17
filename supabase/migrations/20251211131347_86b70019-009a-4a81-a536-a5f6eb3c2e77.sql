-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'faculty', 'student');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT CHECK (content_type IN ('video', 'html', 'pdf', 'file')) DEFAULT 'html',
  media_url TEXT,
  duration_seconds INT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  progress NUMERIC DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE (course_id, student_id)
);

-- Lesson progress tracking
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE (lesson_id, student_id)
);

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_seconds INT,
  show_results BOOLEAN DEFAULT TRUE,
  randomize_questions BOOLEAN DEFAULT TRUE,
  randomize_options BOOLEAN DEFAULT FALSE,
  negative_marking BOOLEAN DEFAULT FALSE,
  negative_marks_value NUMERIC DEFAULT 0,
  passing_score NUMERIC DEFAULT 50,
  max_attempts INT DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  qtype TEXT CHECK (qtype IN ('single', 'multiple', 'text')) DEFAULT 'single',
  marks NUMERIC DEFAULT 1,
  position INT DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Options table
CREATE TABLE public.options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0
);

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('in_progress', 'submitted', 'terminated', 'graded')) DEFAULT 'in_progress',
  score NUMERIC,
  max_score NUMERIC,
  percentage NUMERIC,
  duration_seconds INT,
  tab_switches INT DEFAULT 0,
  termination_reason TEXT
);

-- Question responses table
CREATE TABLE public.question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  selected_options UUID[] DEFAULT '{}',
  text_answer TEXT,
  is_correct BOOLEAN,
  marks_obtained NUMERIC DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table for course organization
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_courses_visibility ON public.courses(visibility);
CREATE INDEX idx_modules_course ON public.modules(course_id);
CREATE INDEX idx_lessons_module ON public.lessons(module_id);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX idx_questions_quiz ON public.questions(quiz_id);
CREATE INDEX idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: viewable by all authenticated, editable by owner
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles: only admins can manage
CREATE POLICY "Roles viewable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Courses: public courses visible to all, private to enrolled/owner
CREATE POLICY "Public courses viewable by all" ON public.courses FOR SELECT USING (visibility = 'public');
CREATE POLICY "Instructors can manage own courses" ON public.courses FOR ALL TO authenticated USING (instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Faculty can create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));

-- Modules: viewable if course is accessible
CREATE POLICY "Modules viewable with course access" ON public.modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND (visibility = 'public' OR instructor_id = auth.uid()))
);
CREATE POLICY "Instructors can manage modules" ON public.modules FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND (instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- Lessons: viewable if enrolled or instructor
CREATE POLICY "Lessons viewable with enrollment" ON public.lessons FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND (
      c.instructor_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = c.id AND student_id = auth.uid()) OR
      c.visibility = 'public'
    )
  )
);
CREATE POLICY "Instructors can manage lessons" ON public.lessons FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND (c.instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Enrollments
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can enroll in public courses" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (
  student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND visibility = 'public')
);
CREATE POLICY "Students can unenroll" ON public.enrollments FOR DELETE TO authenticated USING (student_id = auth.uid());

-- Lesson progress
CREATE POLICY "Users can manage own lesson progress" ON public.lesson_progress FOR ALL TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Instructors can view student progress" ON public.lesson_progress FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE l.id = lesson_id AND c.instructor_id = auth.uid()
  )
);

-- Quizzes
CREATE POLICY "Published quizzes viewable by enrolled students" ON public.quizzes FOR SELECT TO authenticated USING (
  is_published = true OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Faculty can manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (
  created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Faculty can create quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin')
);

-- Questions
CREATE POLICY "Questions viewable with quiz access" ON public.questions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND (is_published = true OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Faculty can manage questions" ON public.questions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- Options
CREATE POLICY "Options viewable with question access" ON public.options FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.quizzes qz ON qz.id = q.quiz_id
    WHERE q.id = question_id AND (qz.is_published = true OR qz.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Faculty can manage options" ON public.options FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.quizzes qz ON qz.id = q.quiz_id
    WHERE q.id = question_id AND (qz.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Quiz attempts
CREATE POLICY "Users can manage own attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Instructors can view course attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- Question responses
CREATE POLICY "Users can manage own responses" ON public.question_responses FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.quiz_attempts WHERE id = attempt_id AND student_id = auth.uid())
);
CREATE POLICY "Instructors can view responses" ON public.question_responses FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    JOIN public.quizzes q ON q.id = qa.quiz_id
    WHERE qa.id = attempt_id AND (q.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Categories: public read, admin manage
CREATE POLICY "Categories viewable by all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Site settings: admin only
CREATE POLICY "Settings viewable by admins" ON public.site_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
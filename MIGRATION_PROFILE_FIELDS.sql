-- ============================================
-- Migration: Add Profile Fields and Course Targeting
-- ============================================
-- Run this if you already have an existing database
-- and need to add the new profile fields and course targeting features
-- ============================================

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS regno TEXT,
ADD COLUMN IF NOT EXISTS faculty_id TEXT,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS dept TEXT;

-- Make full_name NOT NULL if it's not already
ALTER TABLE public.profiles 
ALTER COLUMN full_name SET NOT NULL;

-- Update existing profiles to set email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Add new columns to courses table for video, materials, and links
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';

-- Update visibility check constraint to include 'targeted'
ALTER TABLE public.courses 
DROP CONSTRAINT IF EXISTS courses_visibility_check;

ALTER TABLE public.courses 
ADD CONSTRAINT courses_visibility_check 
CHECK (visibility IN ('public', 'private', 'targeted'));

-- Create course_target_students table
CREATE TABLE IF NOT EXISTS public.course_target_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (course_id, student_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_target_students_course ON public.course_target_students(course_id);
CREATE INDEX IF NOT EXISTS idx_course_target_students_student ON public.course_target_students(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_regno ON public.profiles(regno) WHERE regno IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_faculty_id ON public.profiles(faculty_id) WHERE faculty_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_dept ON public.profiles(dept);
CREATE INDEX IF NOT EXISTS idx_profiles_year ON public.profiles(year);
CREATE INDEX IF NOT EXISTS idx_profiles_section ON public.profiles(section);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS on course_target_students
ALTER TABLE public.course_target_students ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for course_target_students
CREATE POLICY IF NOT EXISTS "Instructors can view course targets" 
  ON public.course_target_students FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id 
      AND (instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY IF NOT EXISTS "Students can view own targets" 
  ON public.course_target_students FOR SELECT 
  TO authenticated 
  USING (student_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Instructors can manage course targets" 
  ON public.course_target_students FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id 
      AND (instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Update existing course policies to handle targeted visibility
DROP POLICY IF EXISTS "Public courses viewable by all" ON public.courses;
CREATE POLICY "Public courses viewable by all" 
  ON public.courses FOR SELECT 
  USING (visibility = 'public');

CREATE POLICY IF NOT EXISTS "Targeted courses viewable by targeted students" 
  ON public.courses FOR SELECT 
  TO authenticated 
  USING (
    visibility = 'targeted' AND (
      EXISTS (
        SELECT 1 FROM public.course_target_students 
        WHERE course_id = courses.id 
        AND student_id = auth.uid()
      ) OR 
      instructor_id = auth.uid() OR 
      public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "Private courses viewable by instructor and admin" 
  ON public.courses FOR SELECT 
  TO authenticated 
  USING (
    visibility = 'private' AND (
      instructor_id = auth.uid() OR 
      public.has_role(auth.uid(), 'admin')
    )
  );

-- Update handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    avatar_url, 
    phone, 
    regno, 
    faculty_id, 
    year, 
    section, 
    dept
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'regno',
    NEW.raw_user_meta_data ->> 'faculty_id',
    NEW.raw_user_meta_data ->> 'year',
    NEW.raw_user_meta_data ->> 'section',
    NEW.raw_user_meta_data ->> 'dept'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- ============================================
-- Migration Complete!
-- ============================================







-- ============================================
-- Mock Users for Testing
-- ============================================
-- This script creates 3 test users with different roles
-- Run this AFTER running supabase_setup.sql
--
-- Credentials:
-- Admin:    admin@lms.test / admin123
-- Faculty:  faculty@lms.test / faculty123
-- Student:  student@lms.test / student123
-- ============================================

-- Note: In Supabase, you need to create users through the Auth API or Dashboard
-- This script creates the auth users and their profiles/roles
-- 
-- IMPORTANT: You need to manually set passwords in Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. For each user, click "..." > "Reset Password"
-- 3. Or use the Supabase Auth API to create users with passwords

-- ============================================
-- Option 1: Create via Supabase Dashboard
-- ============================================
-- 1. Go to Authentication > Users > Add User
-- 2. Create these users manually:
--    - Email: admin@lms.test, Password: admin123
--    - Email: faculty@lms.test, Password: faculty123
--    - Email: student@lms.test, Password: student123
-- 3. Then run the UPDATE statements below to set their roles

-- ============================================
-- Option 2: Use Supabase Management API
-- ============================================
-- You can use the Supabase Management API or Admin API to create users programmatically

-- ============================================
-- After creating auth users, set their roles:
-- ============================================

-- Get the user IDs first (replace with actual UUIDs from auth.users table)
-- You can find them in: Authentication > Users in Supabase Dashboard

-- Example: Set admin role (replace USER_ID with actual UUID)
/*
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@lms.test');

UPDATE public.user_roles 
SET role = 'faculty' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'faculty@lms.test');

UPDATE public.user_roles 
SET role = 'student' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'student@lms.test');
*/

-- ============================================
-- Update profiles with additional info
-- ============================================
/*
UPDATE public.profiles 
SET 
  full_name = 'Admin User',
  dept = 'IT',
  phone = '+1234567890'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@lms.test');

UPDATE public.profiles 
SET 
  full_name = 'Faculty User',
  faculty_id = 'FAC001',
  dept = 'CSE',
  phone = '+1234567891'
WHERE id = (SELECT id FROM auth.users WHERE email = 'faculty@lms.test');

UPDATE public.profiles 
SET 
  full_name = 'Student User',
  regno = 'STU001',
  year = '2nd Year',
  section = 'A',
  dept = 'CSE',
  phone = '+1234567892'
WHERE id = (SELECT id FROM auth.users WHERE email = 'student@lms.test');
*/

-- ============================================
-- Quick Setup Instructions:
-- ============================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" and create:
--    - admin@lms.test / admin123
--    - faculty@lms.test / faculty123
--    - student@lms.test / student123
-- 3. Copy the UUIDs from the users you just created
-- 4. Run the UPDATE statements above with the actual UUIDs
-- 5. Or use the SQL below with email lookups (if emails match)

-- ============================================
-- Automated Setup (if users already exist)
-- ============================================

-- Set roles based on email
DO $$
DECLARE
  admin_id UUID;
  faculty_id UUID;
  student_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@lms.test' LIMIT 1;
  SELECT id INTO faculty_id FROM auth.users WHERE email = 'faculty@lms.test' LIMIT 1;
  SELECT id INTO student_id FROM auth.users WHERE email = 'student@lms.test' LIMIT 1;

  -- Update roles
  IF admin_id IS NOT NULL THEN
    UPDATE public.user_roles SET role = 'admin' WHERE user_id = admin_id;
    IF NOT FOUND THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'admin');
    END IF;
    
    UPDATE public.profiles 
    SET full_name = 'Admin User', dept = 'IT', phone = '+1234567890'
    WHERE id = admin_id;
  END IF;

  IF faculty_id IS NOT NULL THEN
    UPDATE public.user_roles SET role = 'faculty' WHERE user_id = faculty_id;
    IF NOT FOUND THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (faculty_id, 'faculty');
    END IF;
    
    UPDATE public.profiles 
    SET full_name = 'Faculty User', faculty_id = 'FAC001', dept = 'CSE', phone = '+1234567891'
    WHERE id = faculty_id;
  END IF;

  IF student_id IS NOT NULL THEN
    UPDATE public.user_roles SET role = 'student' WHERE user_id = student_id;
    IF NOT FOUND THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (student_id, 'student');
    END IF;
    
    UPDATE public.profiles 
    SET full_name = 'Student User', regno = 'STU001', year = '2nd Year', section = 'A', dept = 'CSE', phone = '+1234567892'
    WHERE id = student_id;
  END IF;
END $$;






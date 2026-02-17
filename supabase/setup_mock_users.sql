-- ============================================
-- Setup Mock Users - Run this AFTER creating users in Auth Dashboard
-- ============================================
-- 
-- STEP 1: Create users in Supabase Dashboard:
--   - Go to Authentication > Users > Add User
--   - Create: admin@lms.test / admin123
--   - Create: faculty@lms.test / faculty123
--   - Create: student@lms.test / student123
--
-- STEP 2: Run this SQL script to set roles and profile data
-- ============================================

-- Set Admin Role and Profile
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@lms.test' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Update or insert role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin'::app_role;
    
    -- Update profile
    UPDATE public.profiles 
    SET 
      full_name = 'Admin User',
      dept = 'IT',
      phone = '+1234567890'
    WHERE id = admin_id;
    
    RAISE NOTICE 'Admin user configured: %', admin_id;
  ELSE
    RAISE NOTICE 'Admin user not found. Please create admin@lms.test in Auth Dashboard first.';
  END IF;
END $$;

-- Set Faculty Role and Profile
DO $$
DECLARE
  faculty_id UUID;
BEGIN
  SELECT id INTO faculty_id FROM auth.users WHERE email = 'faculty@lms.test' LIMIT 1;
  
  IF faculty_id IS NOT NULL THEN
    -- Update or insert role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (faculty_id, 'faculty'::app_role)
    ON CONFLICT (user_id, role) DO UPDATE SET role = 'faculty'::app_role;
    
    -- Update profile
    UPDATE public.profiles 
    SET 
      full_name = 'Faculty User',
      faculty_id = 'FAC001',
      dept = 'CSE',
      phone = '+1234567891'
    WHERE id = faculty_id;
    
    RAISE NOTICE 'Faculty user configured: %', faculty_id;
  ELSE
    RAISE NOTICE 'Faculty user not found. Please create faculty@lms.test in Auth Dashboard first.';
  END IF;
END $$;

-- Set Student Role and Profile
DO $$
DECLARE
  student_id UUID;
BEGIN
  SELECT id INTO student_id FROM auth.users WHERE email = 'student@lms.test' LIMIT 1;
  
  IF student_id IS NOT NULL THEN
    -- Update or insert role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (student_id, 'student'::app_role)
    ON CONFLICT (user_id, role) DO UPDATE SET role = 'student'::app_role;
    
    -- Update profile
    UPDATE public.profiles 
    SET 
      full_name = 'Student User',
      regno = 'STU001',
      year = '2nd Year',
      section = 'A',
      dept = 'CSE',
      phone = '+1234567892'
    WHERE id = student_id;
    
    RAISE NOTICE 'Student user configured: %', student_id;
  ELSE
    RAISE NOTICE 'Student user not found. Please create student@lms.test in Auth Dashboard first.';
  END IF;
END $$;

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify all users are set up correctly:
SELECT 
  u.email,
  p.full_name,
  ur.role,
  p.dept,
  p.regno,
  p.faculty_id,
  p.year,
  p.section
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('admin@lms.test', 'faculty@lms.test', 'student@lms.test')
ORDER BY ur.role;






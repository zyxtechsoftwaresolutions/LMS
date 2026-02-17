# Create Mock Users for Testing

This guide will help you create 3 test users (Admin, Faculty, Student) with mock credentials.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Create Users in Authentication

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** button
4. Create the following 3 users:

#### Admin User
- **Email**: `admin@lms.test`
- **Password**: `admin123`
- Click **"Create User"**

#### Faculty User
- **Email**: `faculty@lms.test`
- **Password**: `faculty123`
- Click **"Create User"**

#### Student User
- **Email**: `student@lms.test`
- **Password**: `student123`
- Click **"Create User"**

### Step 2: Set User Roles

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the following SQL:

```sql
-- Set Admin Role
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@lms.test');

-- If role doesn't exist, insert it
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@lms.test'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.users.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Set Faculty Role
UPDATE public.user_roles 
SET role = 'faculty' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'faculty@lms.test');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'faculty'::app_role
FROM auth.users
WHERE email = 'faculty@lms.test'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.users.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Set Student Role (should already be set by trigger, but ensure it)
UPDATE public.user_roles 
SET role = 'student' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'student@lms.test');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'::app_role
FROM auth.users
WHERE email = 'student@lms.test'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.users.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Update profiles with additional information
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
```

3. Click **"Run"** to execute the SQL

### Step 3: Verify Users

1. Go to **Table Editor** → **user_roles**
2. You should see 3 users with their respective roles
3. Go to **Table Editor** → **profiles**
4. You should see the user profiles with additional information

## Method 2: Using SQL Script

If you prefer, you can use the `supabase/mock_users.sql` file which contains automated setup instructions.

## Test Credentials Summary

| Role    | Email              | Password   |
|---------|-------------------|------------|
| Admin   | admin@lms.test    | admin123   |
| Faculty | faculty@lms.test  | faculty123 |
| Student | student@lms.test  | student123 |

## Testing

1. Start your application: `npm run dev`
2. Go to the login page
3. Try logging in with each credential set
4. Verify that:
   - Admin can access admin dashboard and user management
   - Faculty can create courses
   - Student can view courses and enroll

## Notes

- These are test credentials. Change them in production!
- Email confirmation is automatically handled when creating users via Dashboard
- Users created through the dashboard will automatically get profiles via the trigger
- You may need to manually set roles if the trigger sets them all to 'student'






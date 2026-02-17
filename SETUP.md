# Complete Supabase Setup Guide

This guide will help you set up Supabase for the LearnHub LMS application from scratch.

## 📋 Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- Basic knowledge of SQL (optional, but helpful)

## 🚀 Quick Start

### Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: LearnHub LMS (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be created

### Step 2: Run the Database Setup

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase_setup.sql` from this project
4. Copy the **entire contents** of the file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for all queries to execute (should take 10-30 seconds)
8. You should see "Success. No rows returned" messages

> **Note**: The setup script is idempotent - you can run it multiple times safely. It will drop and recreate policies if they already exist.

### Step 3: Configure Environment Variables

1. Go to **Settings** → **API** (in the left sidebar)
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

3. Create a `.env` file in your project root:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 4: Verify the Setup

1. **Check Tables**: Go to **Table Editor** in Supabase dashboard
   - You should see these tables:
     - profiles
     - user_roles
     - courses
     - course_target_students
     - modules
     - lessons
     - enrollments
     - lesson_progress
     - quizzes
     - questions
     - options
     - quiz_attempts
     - question_responses
     - categories
     - site_settings
     - notifications

2. **Test Authentication**:
   ```bash
   npm install
   npm run dev
   ```
   - Try signing up a new user
   - Check the `profiles` and `user_roles` tables - a new row should be created automatically

## 👤 Creating User Roles

### Create an Admin User

By default, all new users are assigned the "student" role. To create an admin:

**Method 1: Using SQL Editor**

1. Sign up a user through your app
2. Go to **Authentication** → **Users** in Supabase dashboard
3. Copy the user's UUID
4. Go to **SQL Editor** and run:
   ```sql
   UPDATE public.user_roles 
   SET role = 'admin' 
   WHERE user_id = 'paste-user-uuid-here';
   ```

**Method 2: Using Table Editor**

1. Go to **Table Editor** → **user_roles**
2. Find the user you want to make admin
3. Click on the row to edit
4. Change `role` from `student` to `admin`
5. Save

### Create a Faculty User

To create a faculty member (instructor):

```sql
UPDATE public.user_roles 
SET role = 'faculty' 
WHERE user_id = 'paste-user-uuid-here';
```

Or use the Table Editor method above.

## 📊 Database Schema Overview

### Core Tables

- **profiles**: User profile information (name, email, regno, faculty_id, year, section, dept)
- **user_roles**: User role assignments (admin, faculty, student)
- **courses**: Course information with visibility options (public, private, targeted)
- **course_target_students**: Targeted course access for specific students
- **modules**: Course modules/sections
- **lessons**: Individual lessons within modules
- **enrollments**: Student course enrollments
- **lesson_progress**: Lesson completion tracking

### Quiz System

- **quizzes**: Quiz definitions with settings (time limits, passing scores, etc.)
- **questions**: Quiz questions (single choice, multiple choice, text)
- **options**: Answer options for questions
- **quiz_attempts**: Student quiz attempts with tracking
- **question_responses**: Individual question answers

### Supporting Tables

- **categories**: Course categories
- **site_settings**: Platform settings
- **notifications**: User notifications

## 🔒 Security Features

The database includes:

- **Row Level Security (RLS)**: All tables have RLS enabled
- **Role-based access control**: Different permissions for admin, faculty, and students
- **Automatic profile creation**: New users get profiles automatically via trigger
- **Secure functions**: Role checking functions use SECURITY DEFINER
- **Idempotent setup**: All policies use DROP IF EXISTS before CREATE

## 🧪 Testing the Setup

1. **Test User Signup**:
   - Sign up through your app
   - Check `profiles` table - should have new row with email synced
   - Check `user_roles` table - should have role = 'student'

2. **Test Admin Access**:
   - Create an admin user (see above)
   - Sign in as admin
   - Should be able to access admin features

3. **Test Course Creation**:
   - Create a faculty user
   - Sign in as faculty
   - Should be able to create courses

4. **Test Targeted Courses**:
   - Create a course with visibility = 'targeted'
   - Add students to `course_target_students` table
   - Only those students should see the course

## 🐛 Troubleshooting

### "relation does not exist" error
- Make sure you ran the entire SQL script
- Check that all tables were created in Table Editor
- Verify you're using the correct schema (public)

### "permission denied" error
- Check that RLS policies are enabled
- Verify user role in `user_roles` table
- Check that user is authenticated
- Review the policy definitions in the setup script

### Profile not created on signup
- Check that the trigger `on_auth_user_created` exists
- Verify the function `handle_new_user()` exists
- Check Supabase logs for errors (Settings > Logs)

### Can't access admin features
- Verify user role is set to 'admin' in `user_roles` table
- Check that the `has_role()` function exists
- Sign out and sign back in to refresh session

### "policy already exists" error
- The setup script should handle this automatically with DROP IF EXISTS
- If you see this error, manually drop the policy first:
  ```sql
  DROP POLICY IF EXISTS "policy-name" ON table_name;
  ```

### Environment variable issues
- Make sure `.env` file is in the project root
- Verify variable names match: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Restart your dev server after changing `.env`

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

## ✅ Setup Checklist

- [ ] Created Supabase project
- [ ] Ran SQL setup script (`supabase_setup.sql`)
- [ ] Copied API keys to `.env` file
- [ ] Verified all tables exist in Table Editor
- [ ] Tested user signup
- [ ] Created admin user
- [ ] Tested authentication
- [ ] Verified RLS policies are working
- [ ] Tested course creation (as faculty)
- [ ] Tested targeted courses feature

## 🎉 You're All Set!

Your Supabase database is now configured and ready to use with LearnHub LMS. Start building amazing courses!

---

**Need Help?** Check the Supabase documentation or review the SQL setup script comments for more details.


# Supabase Setup Guide for LearnHub LMS

This guide will help you set up a new Supabase database for the LearnHub LMS application.

## 📋 Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Basic knowledge of SQL (optional, but helpful)

## 🚀 Step-by-Step Setup

### Step 1: Create a New Supabase Project

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: LearnHub LMS (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be created

### Step 2: Run the SQL Setup Script

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase_setup.sql` from this project
4. Copy the **entire contents** of the file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for all queries to execute (should take 10-30 seconds)
8. You should see "Success. No rows returned" messages

### Step 3: Get Your API Keys

1. Go to **Settings** → **API** (in the left sidebar)
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### Step 4: Set Up Storage for Profile Pictures

1. Go to **Storage** in the Supabase dashboard (left sidebar)
2. Click **"New bucket"**
3. Create a bucket with the following settings:
   - **Name**: `avatars` (must be exactly this name)
   - **Public bucket**: ✅ **Enable this** (so profile pictures can be accessed)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/*` (or leave empty for all types)
4. Click **"Create bucket"**
5. Set up bucket policies (optional but recommended):
   - Go to **Storage** → **Policies** → **avatars**
   - Add a policy to allow authenticated users to upload:
     - Policy name: "Users can upload own avatars"
     - Allowed operation: INSERT
     - Target roles: authenticated
     - Policy definition: `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text`
   - Add a policy to allow public read access:
     - Policy name: "Public read access"
     - Allowed operation: SELECT
     - Target roles: anon, authenticated
     - Policy definition: `bucket_id = 'avatars'`

### Step 5: Configure Your Application

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add the following variables:

```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace `your-project-url-here` and `your-anon-key-here` with the values from Step 3.

### Step 6: Verify the Setup

1. Check that all tables were created:
   - Go to **Table Editor** in Supabase dashboard
   - You should see these tables:
     - profiles
     - user_roles
     - courses
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

2. Test authentication:
   - Start your app: `npm run dev`
   - Try signing up a new user
   - Check the `profiles` and `user_roles` tables - a new row should be created automatically

## 👤 Creating an Admin User

By default, all new users are assigned the "student" role. To create an admin:

### Method 1: Using SQL Editor

1. Sign up a user through your app
2. Go to **Authentication** → **Users** in Supabase dashboard
3. Copy the user's UUID
4. Go to **SQL Editor** and run:

```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'paste-user-uuid-here';
```

### Method 2: Using Supabase Dashboard

1. Go to **Table Editor** → **user_roles**
2. Find the user you want to make admin
3. Click on the row to edit
4. Change `role` from `student` to `admin`
5. Save

## 🎓 Creating a Faculty User

To create a faculty member (instructor):

```sql
UPDATE public.user_roles 
SET role = 'faculty' 
WHERE user_id = 'paste-user-uuid-here';
```

Or use the Table Editor method above.

## 📊 Database Schema Overview

### Core Tables

- **profiles**: User profile information
- **user_roles**: User role assignments (admin, faculty, student)
- **courses**: Course information
- **modules**: Course modules/sections
- **lessons**: Individual lessons within modules
- **enrollments**: Student course enrollments
- **lesson_progress**: Lesson completion tracking

### Quiz System

- **quizzes**: Quiz definitions
- **questions**: Quiz questions
- **options**: Answer options for questions
- **quiz_attempts**: Student quiz attempts
- **question_responses**: Individual question answers

### Supporting Tables

- **categories**: Course categories
- **site_settings**: Platform settings
- **notifications**: User notifications

## 🔒 Security Features

The database includes:

- **Row Level Security (RLS)**: All tables have RLS enabled
- **Role-based access control**: Different permissions for admin, faculty, and students
- **Automatic profile creation**: New users get profiles automatically
- **Secure functions**: Role checking functions use SECURITY DEFINER

## 🧪 Testing the Setup

1. **Test User Signup**:
   - Sign up through your app
   - Check `profiles` table - should have new row
   - Check `user_roles` table - should have role = 'student'

2. **Test Admin Access**:
   - Create an admin user (see above)
   - Sign in as admin
   - Should be able to access admin features

3. **Test Course Creation**:
   - Create a faculty user
   - Sign in as faculty
   - Should be able to create courses

## 🐛 Troubleshooting

### "relation does not exist" error
- Make sure you ran the entire SQL script
- Check that all tables were created in Table Editor

### "permission denied" error
- Check that RLS policies are enabled
- Verify user role in `user_roles` table
- Check that user is authenticated

### Profile not created on signup
- Check that the trigger `on_auth_user_created` exists
- Verify the function `handle_new_user()` exists
- Check Supabase logs for errors

### Can't access admin features
- Verify user role is set to 'admin' in `user_roles` table
- Check that the `has_role()` function exists
- Sign out and sign back in to refresh session

### Profile picture upload fails
- Verify the `avatars` storage bucket exists
- Check that the bucket is set to public
- Verify storage policies allow authenticated users to upload
- Check file size (must be under 5MB)
- Ensure file is an image format (JPG, PNG, GIF, etc.)

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Functions](https://supabase.com/docs/guides/database/functions)

## ✅ Setup Checklist

- [ ] Created Supabase project
- [ ] Ran SQL setup script
- [ ] Created `avatars` storage bucket
- [ ] Configured storage bucket policies
- [ ] Copied API keys to .env file
- [ ] Verified all tables exist
- [ ] Tested user signup
- [ ] Created admin user
- [ ] Tested authentication
- [ ] Tested profile picture upload
- [ ] Verified RLS policies are working

## 🎉 You're All Set!

Your Supabase database is now configured and ready to use with LearnHub LMS. Start building amazing courses!

---

**Need Help?** Check the Supabase documentation or open an issue in the project repository.



# Enable Login for Admin-Created Users

## Problem
Users created by admins cannot log in because Supabase requires email confirmation by default.

## Solution Options

### Option 1: Run Database Migration (Recommended)

Run this SQL script in your Supabase SQL Editor to create a function that auto-confirms users:

**File:** `supabase/migrations/20250102_auto_confirm_admin_users.sql`

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of the migration file
4. Click **Run**

This creates a function that admins can use to auto-confirm users after creation.

### Option 2: Disable Email Confirmation (Quick Fix)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Find **"Enable email confirmations"**
4. **Disable** this setting
5. Save changes

**Note:** This disables email confirmation for ALL users, including self-registered ones.

### Option 3: Manual Confirmation (For Existing Users)

If you have users that were already created and can't log in:

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Find the user
3. Click on the user
4. Click **"Confirm email"** or set **Email Confirmed** to the current timestamp

Or run this SQL for a specific user:

```sql
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'user@example.com';
```

## After Running the Migration

Once you've run the migration, all new users created by admins will be automatically confirmed and can log in immediately with their credentials.



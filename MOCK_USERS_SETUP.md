# Mock Users Setup Complete ✅

## What Was Created

### 1. **User Management Page** (`src/pages/admin/UserManagement.tsx`)
   - ✅ View all users with their roles and details
   - ✅ Create new users with roles (admin, faculty, student)
   - ✅ Update user roles
   - ✅ Delete users
   - ✅ Form with all profile fields (regno, faculty_id, year, section, dept, etc.)

### 2. **SQL Scripts for Mock Users**
   - ✅ `supabase/setup_mock_users.sql` - Automated setup script
   - ✅ `supabase/mock_users.sql` - Detailed instructions
   - ✅ `CREATE_MOCK_USERS.md` - Step-by-step guide

## Quick Setup Instructions

### Step 1: Create Users in Supabase Dashboard

1. Go to **Authentication** → **Users** → **Add User**
2. Create these 3 users:

| Email              | Password   | Role    |
|-------------------|------------|---------|
| admin@lms.test    | admin123   | Admin   |
| faculty@lms.test | faculty123| Faculty |
| student@lms.test  | student123 | Student |

### Step 2: Run SQL Script

1. Go to **SQL Editor** in Supabase Dashboard
2. Open `supabase/setup_mock_users.sql`
3. Copy and paste the entire script
4. Click **Run**
5. You should see success messages for each user

### Step 3: Verify

Run the verification query at the end of the script to see all users with their roles.

## Test Credentials

After setup, you can log in with:

- **Admin**: `admin@lms.test` / `admin123`
- **Faculty**: `faculty@lms.test` / `faculty123`
- **Student**: `student@lms.test` / `student123`

## Features

### Admin User Management

Once logged in as admin, you can:

1. **View All Users**
   - See all registered users
   - View their roles, departments, and details

2. **Create New Users**
   - Click "Create User" button
   - Fill in user details:
     - Email and password
     - Full name
     - Role (admin, faculty, or student)
     - Additional fields based on role:
       - **Student**: Registration number, year, section
       - **Faculty**: Faculty ID
       - **Admin**: Department

3. **Update User Roles**
   - Change user roles directly from the table
   - Select new role from dropdown

4. **Delete Users**
   - Remove users from the system

## Notes

- User creation via the UI requires Supabase Admin API access
- If you get permission errors, create users manually in Supabase Dashboard
- The SQL script handles role assignment automatically
- All users get profiles created automatically via database triggers

## Troubleshooting

### "User creation requires admin privileges"
- Create users manually in Supabase Dashboard first
- Then use the User Management page to update roles and details

### "User not found" in SQL script
- Make sure you created the users in Auth Dashboard first
- Check that email addresses match exactly

### Can't see User Management page
- Make sure you're logged in as admin
- Check your role in the `user_roles` table

## Next Steps

1. ✅ Create mock users (follow steps above)
2. ✅ Test login with each role
3. ✅ Verify admin can access User Management
4. ✅ Test creating a new user as admin
5. ✅ Test updating user roles

---

**All set!** You now have 3 test users and a complete user management system for admins.






# Quick Supabase Setup

## 1. Create Supabase Project
- Go to https://supabase.com
- Create new project
- Wait for setup to complete

## 2. Run Database Setup
1. Open **SQL Editor** in Supabase dashboard
2. Copy entire `supabase_setup.sql` file
3. Paste and run in SQL Editor
4. Wait for completion (10-30 seconds)

## 3. Get API Keys
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public** key

## 4. Configure Environment
Create `.env` file in project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Create Admin User
After signing up through the app, run in SQL Editor:
```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'your-user-uuid';
```

## 6. Test
```bash
npm install
npm run dev
```

Sign up and verify profile is created automatically.

---

**Full details**: See `SETUP.md` or `SUPABASE_SETUP_GUIDE.md`


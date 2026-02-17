# Create .env File

You need to create a `.env` file in the project root with your Supabase credentials.

## Steps:

1. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **API**
   - Copy the **Project URL**
   - Copy the **anon public** key

2. **Create the `.env` file:**
   - Create a new file named `.env` in the project root (same directory as `package.json`)
   - Add the following content (replace with your actual values):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Example:**
   ```env
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.example
   ```

4. **Restart your dev server:**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again

## Quick Copy Template

Copy this and fill in your values:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Need Help?

- See `SETUP.md` for complete setup instructions
- See `QUICK_SETUP.md` for quick reference
- Make sure you've run `supabase_setup.sql` in your Supabase SQL Editor first


# Environment Variables Setup

## 📍 Location

Your Supabase credentials should be placed in a `.env` file in the **project root** (same directory as `package.json`).

```
D:\PROJECTS\realtime\lms\
├── .env                    ← Create/Edit this file
├── package.json
├── src/
└── ...
```

## 📝 Format

The `.env` file should contain:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🔑 How to Get Your Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Paste as `VITE_SUPABASE_URL`
   - **anon public** key → Paste as `VITE_SUPABASE_ANON_KEY`

## ✅ Your Current Setup

You already have a `.env` file with your credentials! It's located at:
```
D:\PROJECTS\realtime\lms\.env
```

## ⚠️ Important Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Restart your dev server** after changing `.env`:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```
3. **The variable names must start with `VITE_`** - This is required for Vite to expose them to your code

## 🔍 Verification

Your code reads these values in `src/integrations/supabase/client.ts`:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

If these are missing, you'll see an error when the app starts.



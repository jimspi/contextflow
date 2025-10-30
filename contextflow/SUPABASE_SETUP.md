# Supabase Setup Guide for ContextFlow

This guide will help you set up Supabase authentication and database for ContextFlow.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Your ContextFlow application code

## Step 1: Create a New Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: ContextFlow (or any name you prefer)
   - Database Password: (create a strong password)
   - Region: Choose the closest to your users
4. Click "Create new project"
5. Wait for the project to finish setting up (2-3 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on the ⚙️ **Settings** icon (bottom left)
2. Click on **API** in the settings menu
3. You'll need two values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in your ContextFlow project root:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace the placeholders with your actual values:
   - `your-project.supabase.co` → Your Project URL from Step 2
   - `your_anon_key_here` → Your anon public key from Step 2
   - `your_openai_api_key_here` → Your OpenAI API key

## Step 4: Create Database Tables

1. In your Supabase project, click on the **SQL Editor** icon (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste it into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)

This will create:
- `contexts` table (stores user contexts)
- `insights` table (stores AI-generated insights)
- Row Level Security (RLS) policies (users can only see their own data)
- Performance indexes

## Step 5: Configure Authentication

1. In your Supabase project, click on **Authentication** (left sidebar)
2. Click on **Providers** tab
3. Enable **Email** provider (should be enabled by default)
4. (Optional) Configure other providers like Google, GitHub, etc.

### Email Settings

1. Go to **Authentication** → **Email Templates**
2. Customize your confirmation email if desired
3. By default, users will need to confirm their email before signing in

### For Development (Disable Email Confirmation)

If you want to test without email confirmation:
1. Go to **Authentication** → **Providers**
2. Click on **Email**
3. Uncheck "Enable email confirmations"
4. Click "Save"

**Warning**: Only disable email confirmation in development. Always enable it in production!

## Step 6: Deploy to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables in Vercel:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

## Step 7: Test Your Application

1. Visit your deployed app (or run locally with `npm run dev`)
2. You should see a sign-in screen
3. Create a new account
4. Check your email for confirmation (if enabled)
5. Sign in and start using ContextFlow!

## Verify Database Setup

You can check if everything is working:

1. Sign up for a new account
2. Add a context in the app
3. Go to Supabase → **Table Editor** → **contexts**
4. You should see your context in the table

## Troubleshooting

### "Supabase credentials not found" error

- Make sure `.env.local` exists and has the correct values
- Restart your development server after adding environment variables
- Check that variable names start with `NEXT_PUBLIC_` for client-side access

### Can't sign in

- Check that Email provider is enabled in Authentication → Providers
- If using email confirmation, check your spam folder
- Check browser console for error messages

### Database errors when adding contexts

- Make sure you ran the SQL schema (Step 4)
- Check that RLS policies are enabled
- Go to Supabase → Table Editor to verify tables exist

### "Row Level Security" errors

- RLS is working correctly! This means unauthorized users can't access data
- Make sure you're signed in
- Check that policies were created (they're in the schema SQL)

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use email confirmation in production** - Protects against spam
3. **Keep your API keys secret** - Don't share them publicly
4. **Use environment variables** - In Vercel, Netlify, etc.
5. **Enable RLS** - Already done in the schema, keeps user data private

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Next.js Docs: https://nextjs.org/docs

## Schema Overview

### Contexts Table
- Stores all user contexts (projects, goals, notes, etc.)
- Includes title, summary, type, priority, connections
- Automatically timestamps creation and updates

### Insights Table
- Stores AI-generated insights
- Links to contexts
- Tracks actionable items
- Auto-generated from your contexts using GPT-4

Both tables have Row Level Security enabled, ensuring users can only access their own data.

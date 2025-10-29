# Supabase Setup Guide for ContextFlow

This guide will walk you through setting up Supabase for ContextFlow with database persistence and user authentication.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - **Name**: ContextFlow (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to finish setting up (this takes ~2 minutes)

## Step 2: Run the Database Schema

1. In your Supabase project dashboard, click on the **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `database-schema.sql` from this repository
4. Paste it into the SQL editor
5. Click **Run** or press `Ctrl+Enter` (Cmd+Enter on Mac)
6. You should see a success message confirming the tables and policies were created

The schema creates:
- `contexts` table - stores user contexts with connections and metadata
- `insights` table - stores AI-generated insights
- `chat_messages` table - stores chat history (optional)
- Row Level Security (RLS) policies to ensure users can only access their own data
- Indexes for better query performance

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, click on the **Settings** icon (gear) in the left sidebar
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`

## Step 4: Configure Environment Variables

1. In your ContextFlow project directory, create a `.env.local` file
2. Copy the contents from `.env.local.example`
3. Fill in your Supabase credentials:

```env
# OpenAI API Key (if you want AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**:
- Replace `https://xxxxxxxxxxxxx.supabase.co` with your actual Project URL
- Replace the anon key with your actual anon/public key
- Never commit `.env.local` to version control (it's already in `.gitignore`)

## Step 5: Enable Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it should be by default)
3. For development, you may want to:
   - Disable email confirmation (Auth → Settings → Email Auth)
   - Or set up a custom SMTP server for sending emails

### Optional: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the confirmation and password recovery emails if desired

## Step 6: Install Dependencies and Run

```bash
# Install all dependencies (including Supabase client)
npm install

# Run the development server
npm run dev
```

Visit `http://localhost:3000` and you should see the ContextFlow login page!

## Step 7: Create Your First User

1. Click "Sign up" on the login page
2. Enter an email and password (minimum 6 characters)
3. If email confirmation is enabled, check your email for the confirmation link
4. If email confirmation is disabled, you can sign in immediately

## Features Now Available

### ✅ User Authentication
- Sign up with email/password
- Sign in with existing credentials
- Sign out
- Secure session management

### ✅ Data Persistence
- All contexts are saved to Supabase PostgreSQL database
- Data persists across sessions and devices
- Real-time sync when you make changes

### ✅ Edit/Delete Contexts
- Hover over any context card to see edit and delete buttons
- Edit: Update title, summary, type, priority
- Delete: Permanently remove contexts (with confirmation)

### ✅ Export/Import Data
- **Export**: Click the download icon in the header to export all your data as JSON
- **Import**: Click the upload icon to import contexts from a JSON file
- Great for backups and migrating data

### ✅ Search Functionality
- Real-time search across context titles and summaries
- Search bar in the Contexts view
- Results update as you type

## Troubleshooting

### "Invalid API key" error
- Double-check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure there are no extra spaces or quotes
- Restart your dev server after changing `.env.local`

### "Row Level Security policy violation" error
- This means the RLS policies weren't created correctly
- Re-run the `database-schema.sql` in Supabase SQL Editor
- Make sure you're signed in as a user

### Sign up not working
- Check if email confirmation is required in Auth settings
- Check the Supabase logs: Authentication → Logs
- Verify email provider is configured if confirmation is enabled

### Data not persisting
- Check browser console for errors
- Verify tables were created: Go to Database → Tables
- Check that you're signed in (user icon should show in header)

## Security Notes

### Row Level Security (RLS)
ContextFlow uses RLS to ensure:
- Users can only see their own data
- Users can only modify their own data
- No user can access another user's contexts or insights

### API Keys
- The `anon` key is safe to use in the browser
- It's protected by RLS policies
- Never share your `service_role` key (not used in this app)

### Best Practices
- Use strong passwords
- Enable email confirmation in production
- Set up a custom email domain for better deliverability
- Monitor your Supabase usage in the dashboard

## Optional Enhancements

### Enable Social Auth (Google, GitHub, etc.)
1. Go to Authentication → Providers
2. Enable your preferred provider
3. Follow the setup instructions for OAuth credentials
4. Update the Auth component to include social login buttons

### Add Real-time Updates
Supabase supports real-time subscriptions. To enable:
```javascript
supabase
  .channel('contexts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'contexts' }, (payload) => {
    console.log('Change received!', payload)
    // Update local state
  })
  .subscribe()
```

### Set up Backups
1. Go to Settings → Backups
2. Configure automated backups (Pro plan)
3. Or manually export data regularly using the Export feature

## Next Steps

Now that Supabase is set up, you can:
1. Add contexts and see them persist across sessions
2. Test the edit and delete functionality
3. Try exporting and importing your data
4. Integrate with OpenAI API for AI-powered insights (add `OPENAI_API_KEY`)

For more Supabase features, visit: https://supabase.com/docs

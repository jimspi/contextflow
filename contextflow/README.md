# ContextFlow - Personal AI Memory Layer

A forward-looking AI product that builds continuous, evolving understanding of your work, life, and goals - acting as a persistent context layer across all your activities.

## Features

### Core Features
- **Context Management**: Track and manage all your important contexts (projects, goals, relationships)
- **AI-Powered Insights**: Automatically generate proactive insights based on your context graph
- **Smart Connections**: Detect connections between different areas of your life
- **Priority Tracking**: Automatic prioritization based on recency and importance
- **Context-Aware Chat**: Natural conversation with full awareness of your entire context history
- **Sleek, Contemporary UI**: Modern dark theme with smooth animations and professional design

### New Features ✨
- **User Authentication**: Secure sign up/sign in with email and password
- **Data Persistence**: All data saved to Supabase PostgreSQL database
- **Edit/Delete Contexts**: Full CRUD operations for managing your contexts
- **Export Data**: Download all your contexts and insights as JSON
- **Import Data**: Restore or migrate data from JSON files
- **Search Functionality**: Real-time search across all contexts

## Tech Stack

- **Frontend**: React 18 with Next.js 14
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: OpenAI GPT-4 API
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone or Create Project Directory

```bash
mkdir contextflow
cd contextflow
```

### 2. Create Project Structure

Create the following directory structure:
```
contextflow/
├── pages/
│   ├── api/
│   │   ├── generate-insight.js
│   │   └── chat.js
│   ├── _app.js
│   └── index.js
├── contextflow.jsx
├── globals.css
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

### 3. Copy All Files

Copy all the provided files into their respective locations:
- `contextflow.jsx` → root directory
- `api-generate-insight.js` → `pages/api/generate-insight.js`
- `api-chat.js` → `pages/api/chat.js`
- `pages-_app.js` → `pages/_app.js`
- `pages-index.js` → `pages/index.js`
- All config files to root directory

### 4. Install Dependencies

```bash
npm install
```

### 5. Set Up Supabase

**Important**: ContextFlow now requires Supabase for data persistence and authentication.

Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
1. Create a Supabase project
2. Run the database schema
3. Get your API keys
4. Configure environment variables

### 6. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# OpenAI API Key (optional, for AI insights)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Copy from `.env.local.example` and fill in your actual values.

**Important**: Never commit this file to version control. It's already in `.gitignore`.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deploying to Vercel

### Option 1: Deploy from Git Repository

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Add environment variable:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable
vercel env add OPENAI_API_KEY

# Deploy to production
vercel --prod
```

## Environment Variables in Vercel

In your Vercel project settings:
1. Go to "Settings" → "Environment Variables"
2. Add `OPENAI_API_KEY` with your OpenAI API key
3. Make sure it's available for all environments (Production, Preview, Development)

## Usage

### Authentication
- **Sign Up**: Create a new account with email and password
- **Sign In**: Access your existing account
- **Sign Out**: Use the logout button in the header

### Dashboard View
- View recent AI-generated insights
- See statistics on contexts and connections
- Monitor high-priority contexts
- Edit or delete contexts directly from cards

### Contexts View
- **Browse**: View all your contexts with real-time search
- **Add**: Create new contexts with title, summary, type, and priority
- **Edit**: Click the edit icon on any context card to modify it
- **Delete**: Click the delete icon to remove contexts (with confirmation)
- **Search**: Use the search bar to find contexts by title or summary

### Data Management
- **Export**: Click the download icon in the header to export all data as JSON
- **Import**: Click the upload icon to import contexts from a JSON file

### Chat View
- Have context-aware conversations
- Ask questions about your contexts
- Get personalized recommendations based on your full context history

## API Integration

The application includes two API routes that integrate with OpenAI:

### Generate Insight API
**Endpoint**: `/api/generate-insight`
- Analyzes contexts and generates proactive insights
- Uses GPT-4 with context-aware system prompts

### Chat API
**Endpoint**: `/api/chat`
- Handles context-aware conversations
- Maintains full context history in system prompt

## Customization

### Modify AI Behavior
Edit the system prompts in:
- `pages/api/generate-insight.js` - for insight generation
- `pages/api/chat.js` - for chat responses

### Update Styling
All styling uses Tailwind CSS classes. Modify:
- `tailwind.config.js` - theme configuration
- Component classes in `contextflow.jsx` - UI elements

### Add Features
The modular structure makes it easy to add:
- New context types
- Additional insight categories
- Integration with external APIs
- Data persistence (database)

## Recently Added ✅

- ✅ Database integration (Supabase PostgreSQL)
- ✅ User authentication (Supabase Auth)
- ✅ Data persistence across sessions
- ✅ Edit/delete contexts
- ✅ Export/import functionality
- ✅ Search across contexts

## Future Enhancements

Consider adding:
- Real-time notifications
- Calendar integration
- Email scanning
- Mobile app
- Browser extension
- Webhook integrations
- Social authentication (Google, GitHub)
- Two-factor authentication

## Performance

- Server-side rendering with Next.js
- Optimized API routes
- Efficient state management
- Lazy loading for improved initial load

## Security

- **Row Level Security (RLS)**: Supabase RLS ensures users can only access their own data
- **Secure Authentication**: Password hashing and secure session management via Supabase Auth
- **API Keys**: All keys stored in environment variables, never in client code
- **Server-side API calls**: AI features use server-side API routes only
- **HTTPS**: Enforced on Vercel deployment
- **Data Isolation**: Each user's contexts, insights, and messages are completely isolated

## License

MIT License - feel free to use and modify for your projects

## Support

For issues or questions:
- Check OpenAI API status: https://status.openai.com
- Vercel documentation: https://vercel.com/docs
- Next.js documentation: https://nextjs.org/docs

---

Built with cutting-edge AI technology for the future of personal productivity.

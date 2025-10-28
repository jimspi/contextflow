# ContextFlow - Personal AI Memory Layer

A forward-looking AI product that builds continuous, evolving understanding of your work, life, and goals - acting as a persistent context layer across all your activities.

## Features

- **Context Management**: Track and manage all your important contexts (projects, goals, relationships)
- **AI-Powered Insights**: Automatically generate proactive insights based on your context graph
- **Smart Connections**: Detect connections between different areas of your life
- **Priority Tracking**: Automatic prioritization based on recency and importance
- **Context-Aware Chat**: Natural conversation with full awareness of your entire context history
- **Sleek, Contemporary UI**: Modern dark theme with smooth animations and professional design

## Tech Stack

- **Frontend**: React with Next.js
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

### 5. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: Never commit this file to version control. It's already in `.gitignore`.

### 6. Run Development Server

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

### Dashboard View
- View recent AI-generated insights
- See statistics on contexts and connections
- Monitor high-priority contexts

### Contexts View
- Browse all your contexts
- Add new contexts
- View connections and relationships
- Track last update times

### Chat View
- Have context-aware conversations
- Ask questions about your contexts
- Get personalized recommendations

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

## Future Enhancements

Consider adding:
- Database integration (PostgreSQL, MongoDB)
- User authentication (NextAuth.js)
- Real-time notifications
- Calendar integration
- Email scanning
- Mobile app
- Browser extension
- Webhook integrations

## Performance

- Server-side rendering with Next.js
- Optimized API routes
- Efficient state management
- Lazy loading for improved initial load

## Security

- API keys stored in environment variables
- No sensitive data in client-side code
- Server-side API calls only
- HTTPS enforced on Vercel

## License

MIT License - feel free to use and modify for your projects

## Support

For issues or questions:
- Check OpenAI API status: https://status.openai.com
- Vercel documentation: https://vercel.com/docs
- Next.js documentation: https://nextjs.org/docs

---

Built with cutting-edge AI technology for the future of personal productivity.

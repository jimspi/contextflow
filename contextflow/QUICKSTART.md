# ContextFlow - Quick Start Guide

## Fastest Way to Deploy

### 1. Download and Extract
Download all files from the `project-structure` folder.

### 2. Install Dependencies
```bash
cd contextflow
npm install
```

### 3. Add Your OpenAI API Key
```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-key-here
```

### 4. Test Locally
```bash
npm run dev
```
Visit http://localhost:3000

### 5. Deploy to Vercel (2 minutes)

#### Via Vercel Website:
1. Go to https://vercel.com
2. Sign in with GitHub/GitLab/Bitbucket
3. Click "Add New Project"
4. Import your repository or drag & drop the folder
5. Add Environment Variable:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
6. Click "Deploy"

#### Via Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel
# Follow prompts, add OPENAI_API_KEY when asked
```

## That's It!

Your ContextFlow instance will be live at `your-project.vercel.app`

## What You Get

✅ Fully functional AI-powered context management system
✅ Real-time insight generation using GPT-4
✅ Context-aware chat interface
✅ Modern, sleek UI with dark theme
✅ Auto-scaling infrastructure via Vercel
✅ HTTPS by default
✅ Global CDN distribution

## Cost Estimate

- Vercel hosting: FREE (Hobby plan)
- OpenAI API: ~$0.03 per 1K tokens (GPT-4)
  - Average insight: ~200 tokens (~$0.006)
  - Average chat: ~300 tokens (~$0.009)

## Customization

All styling and behavior can be customized:
- Edit `contextflow.jsx` for UI changes
- Edit `pages/api/*.js` for AI behavior
- Modify Tailwind classes for styling

## Need Help?

1. Check README.md for detailed documentation
2. Verify your OpenAI API key is valid
3. Check Vercel deployment logs
4. Ensure environment variables are set

---

**Built with:** React, Next.js, Tailwind CSS, OpenAI GPT-4
**Deploy time:** ~2 minutes
**Skill level required:** Beginner-friendly

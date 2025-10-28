# Troubleshooting 404 Errors

If you're seeing a 404 error after deploying to Vercel, follow these steps:

## 1. Check Build Logs

1. Go to your Vercel dashboard
2. Click on your deployment
3. Click on "Building" or the latest deployment
4. Check the build logs for any errors

Common build errors:
- Missing dependencies
- Syntax errors
- Missing environment variables during build

## 2. Verify Environment Variables

Make sure `OPENAI_API_KEY` is set in Vercel:
1. Go to Project Settings → Environment Variables
2. Verify `OPENAI_API_KEY` exists
3. Make sure it's enabled for "Production"
4. Redeploy after adding variables

## 3. Check Deployment Settings

In Vercel project settings:
- **Framework Preset**: Should be "Next.js"
- **Build Command**: `npm run build` or `next build`
- **Output Directory**: Leave as default (Next.js handles this)
- **Install Command**: `npm install`

## 4. Local Testing First

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Test the production build
npm start
```

If it works locally but not on Vercel, the issue is deployment-specific.

## 5. Common Fixes

### Fix 1: Force Redeploy
Sometimes Vercel cache causes issues:
1. Go to your deployment
2. Click the three dots menu
3. Select "Redeploy"
4. Check "Use existing Build Cache" is UNCHECKED

### Fix 2: Check Node Version
Add to `package.json`:
```json
"engines": {
  "node": ">=18.0.0"
}
```

### Fix 3: Verify File Structure
Your structure should be:
```
contextflow/
├── pages/
│   ├── api/
│   │   ├── chat.js
│   │   └── generate-insight.js
│   ├── _app.js
│   └── index.js
├── public/
├── contextflow.jsx
├── globals.css
├── package.json
├── next.config.js
└── ...
```

### Fix 4: Clear Browser Cache
Sometimes the 404 is cached in your browser:
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or open in incognito/private window

## 6. Check Vercel URL

Make sure you're visiting the correct URL:
- Should be: `https://your-project-name.vercel.app`
- NOT: `https://your-project-name.vercel.app/index`

## 7. Review Build Output

In the Vercel build logs, look for:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
```

If you see errors here, that's your issue.

## 8. Manual Deployment Steps

If automatic deployment isn't working:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# When prompted:
# - Set up and deploy? Y
# - Which scope? (choose your account)
# - Link to existing project? N
# - Project name? contextflow
# - Directory? ./
# - Override settings? N
```

## 9. Environment Variable Test

To verify your API is accessible, check:
`https://your-project.vercel.app/api/generate-insight`

You should get a 405 error (Method Not Allowed) - this means the API route exists.

If you get 404, the API routes aren't deploying correctly.

## 10. Still Not Working?

Check Vercel's status page: https://www.vercel-status.com

Or contact Vercel support with:
- Your deployment URL
- Build logs (screenshot)
- Error message

## Quick Fix: Start Fresh

If nothing works, try a clean deployment:

1. Delete the project from Vercel
2. Create a new project
3. Import from Git or drag/drop
4. Add `OPENAI_API_KEY` environment variable
5. Deploy

---

**Most Common Issue**: Missing or incorrectly named environment variable

Make sure it's exactly `OPENAI_API_KEY` (case-sensitive) in Vercel settings.

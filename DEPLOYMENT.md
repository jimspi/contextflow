# ContextFlow - Deployment Guide

This guide will help you deploy ContextFlow to production.

## Prerequisites

1. OpenAI API Key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Vercel account (free tier works fine) from [https://vercel.com](https://vercel.com)
3. Git repository with your code

## Quick Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "Add New Project"

3. **Import your repository**
   - Select your ContextFlow repository
   - Click "Import"

4. **Configure your project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./contextflow`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. **Add Environment Variables**
   - Click "Environment Variables"
   - Add: `OPENAI_API_KEY` with your OpenAI API key
   - Make sure it's available for all environments (Production, Preview, Development)

6. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)
   - Your app will be live at `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to your project**
   ```bash
   cd /path/to/contextflow/contextflow
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy to preview**
   ```bash
   vercel
   ```

5. **Add environment variable**
   ```bash
   vercel env add OPENAI_API_KEY
   ```
   - Select "Production, Preview, Development"
   - Paste your OpenAI API key

6. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Environment Variables

The following environment variables are required:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for GPT-4 access | Yes |

### Getting Your OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again)
5. Add it to your Vercel environment variables

## Post-Deployment

### Verify Your Deployment

1. Visit your deployed URL
2. Test the following features:
   - Dashboard loads correctly
   - Add a new context
   - Generate an insight (requires API key)
   - Chat with AI (requires API key)

### Configure Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 24 hours)

## Monitoring and Maintenance

### Check Logs

**Vercel Dashboard:**
- Go to your project
- Click on a deployment
- View "Functions" tab for API logs
- View "Build Logs" for build errors

**CLI:**
```bash
vercel logs
```

### Update Your Deployment

Vercel automatically deploys when you push to your repository:

```bash
git add .
git commit -m "Update feature"
git push
```

### Manual Redeploy

In Vercel dashboard:
1. Go to "Deployments"
2. Find the deployment you want to redeploy
3. Click "⋯" → "Redeploy"

## Troubleshooting

### Build Fails

**Check build logs:**
- In Vercel dashboard → Deployments → Click failed deployment → Build Logs

**Common issues:**
- Missing dependencies: Check `package.json`
- Syntax errors: Run `npm run build` locally
- Node version: Vercel uses Node 18.x by default

### API Routes Not Working

**Check environment variables:**
- Vercel Dashboard → Settings → Environment Variables
- Ensure `OPENAI_API_KEY` is set for all environments
- Redeploy after adding variables

**Check API logs:**
- Vercel Dashboard → Functions tab
- Look for error messages

### OpenAI API Errors

**Common issues:**
- Invalid API key: Check your key in OpenAI dashboard
- Rate limits: Check OpenAI usage dashboard
- No credits: Add payment method to OpenAI account
- Model not available: Ensure you have GPT-4 access

## Cost Considerations

### Vercel Costs
- Free tier includes:
  - 100 GB bandwidth
  - Unlimited deployments
  - Automatic HTTPS
- Pro tier ($20/month) for:
  - Custom domains
  - More bandwidth
  - Team collaboration

### OpenAI Costs
- GPT-4 pricing (as of 2024):
  - Input: $0.03 per 1K tokens
  - Output: $0.06 per 1K tokens
- Typical conversation: $0.05-0.15
- Monitor usage at [platform.openai.com](https://platform.openai.com/usage)

## Security Best Practices

1. **Never commit `.env.local` to Git**
   - Already in `.gitignore`
   - Always use environment variables

2. **Rotate API keys regularly**
   - Revoke old keys in OpenAI dashboard
   - Update Vercel environment variables

3. **Monitor API usage**
   - Set up usage alerts in OpenAI
   - Check Vercel analytics regularly

4. **Use environment-specific keys**
   - Development key for testing
   - Production key for deployment

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **OpenAI API Documentation**: [platform.openai.com/docs](https://platform.openai.com/docs)

## Next Steps

After successful deployment:

1. Test all features thoroughly
2. Set up custom domain (optional)
3. Configure analytics (Vercel Analytics)
4. Add user authentication (NextAuth.js)
5. Implement database for persistence
6. Set up monitoring and alerts

---

**Your ContextFlow app is now live and ready to use!**

# KB Portal Deployment Guide

This guide covers deploying the NABLA KB Portal to Vercel with custom domain configuration.

## Prerequisites

- GitHub account with repository access
- Vercel account
- Domain access for kb.nabla.ai
- Supabase project credentials

## Step 1: GitHub Repository Setup

The repository has been created at: https://github.com/NuminaSRL/nabla-kb-portal

1. Clone the repository locally:
```bash
git clone https://github.com/NuminaSRL/nabla-kb-portal.git
cd nabla-kb-portal
```

2. Install dependencies:
```bash
npm install
```

3. Test locally:
```bash
npm run dev
```

## Step 2: Vercel Project Setup

### Option A: Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link project:
```bash
vercel link
```

4. Configure environment variables:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

5. Deploy to production:
```bash
vercel --prod
```

### Option B: Vercel Dashboard

1. Go to https://vercel.com/new
2. Import the GitHub repository: `NuminaSRL/nabla-kb-portal`
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `NEXT_PUBLIC_APP_URL`: https://kb.nabla.ai
   - `NEXT_PUBLIC_APP_NAME`: NABLA KB Portal

5. Click "Deploy"

## Step 3: Custom Domain Configuration

### Add Domain to Vercel

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add domain: `kb.nabla.ai`
4. Vercel will provide DNS records

### Configure DNS

Add the following DNS records to your domain provider:

**For CNAME (Recommended):**
```
Type: CNAME
Name: kb
Value: cname.vercel-dns.com
```

**For A Record (Alternative):**
```
Type: A
Name: kb
Value: 76.76.21.21
```

### Verify Domain

1. Wait for DNS propagation (up to 48 hours, usually minutes)
2. Verify in Vercel dashboard
3. Enable automatic HTTPS

## Step 4: Supabase Configuration

### Database Access

The KB Portal uses the same Supabase database as the main NABLA project:

- Project URL: Available in main project `.env.local`
- Anon Key: Available in main project `.env.local`

### Required Tables

Ensure these tables exist in Supabase:

- `documents`: Regulatory documents
- `document_embeddings`: Vector embeddings (768-dim)
- `users`: User accounts
- `subscriptions`: Subscription tiers
- `search_history`: User search history

### Row Level Security (RLS)

Enable RLS policies for:
- Public read access to `documents` table
- User-specific access to `search_history`
- Subscription-based access limits

## Step 5: Environment Variables

### Production Environment Variables

Set these in Vercel dashboard:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Application
NEXT_PUBLIC_APP_URL=https://kb.nabla.ai
NEXT_PUBLIC_APP_NAME=NABLA KB Portal

# Features
NEXT_PUBLIC_ENABLE_SEARCH=true
NEXT_PUBLIC_ENABLE_AUTH=true
```

### GitHub Secrets (for CI/CD)

Add these secrets to GitHub repository:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## Step 6: Verify Deployment

### Health Checks

1. Visit https://kb.nabla.ai
2. Verify homepage loads correctly
3. Test navigation links
4. Check Supabase connection

### Functionality Tests

- [ ] Homepage renders correctly
- [ ] Search page accessible
- [ ] Pricing page displays tiers
- [ ] Login/signup flow works
- [ ] Supabase authentication functional
- [ ] Database queries execute successfully

### Performance Checks

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Core Web Vitals pass

## Step 7: Monitoring Setup

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Monitor:
   - Page views
   - Performance metrics
   - Error rates

### Supabase Monitoring

1. Monitor database performance
2. Track API usage
3. Set up alerts for errors

## Troubleshooting

### Domain Not Resolving

- Check DNS propagation: https://dnschecker.org
- Verify DNS records are correct
- Wait up to 48 hours for full propagation

### Build Failures

- Check environment variables are set
- Verify Node.js version (18+)
- Review build logs in Vercel dashboard

### Supabase Connection Issues

- Verify Supabase URL and key
- Check RLS policies
- Ensure database tables exist

### Performance Issues

- Enable Vercel Edge caching
- Optimize images with Next.js Image component
- Review database query performance

## Rollback Procedure

If deployment fails:

1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find last working deployment
4. Click "Promote to Production"

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Review Next.js documentation: https://nextjs.org/docs
- Contact development team

## Next Steps

After successful deployment:

1. Implement search functionality (TASK-036)
2. Add authentication pages (TASK-037)
3. Create pricing page (TASK-038)
4. Implement subscription management (TASK-039)
5. Add analytics tracking (TASK-040)

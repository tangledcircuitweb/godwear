# Wrangler Deployment Guide for GodWear

This guide covers the correct procedures for deploying the GodWear HonoX application to Cloudflare Pages using Wrangler.

## 🏗️ Project Architecture

GodWear is a **Cloudflare Pages project** (not Workers), built with:
- **HonoX** - Full-stack framework
- **TypeScript** - Type safety
- **Vite** - Build system
- **SSR** - Server-side rendering

## 📋 Prerequisites

1. **Wrangler CLI** installed and authenticated
2. **Node.js** and npm installed
3. **Git repository** connected (optional but recommended)
4. **Cloudflare account** with Pages access

## 🚀 Deployment Commands

### Standard Development Deployment (Preview)

```bash
# Build and deploy to preview environment
npm run deploy
```

This runs:
1. `npm run build` - TypeScript check + Vite build
2. `wrangler pages deploy dist` - Deploy to preview

**Result:** Creates a preview deployment accessible via `https://[hash].godwear.pages.dev`

### Production Deployment (Custom Domain)

```bash
# Deploy to production branch (live on custom domain)
npm run build
wrangler pages deploy dist --branch production
```

**Result:** Creates a production deployment live on `godwear.ca`

### Manual Build Steps

```bash
# 1. Type checking
npm run type-check

# 2. Client build
vite build --mode client

# 3. Server build
vite build --outDir dist-server

# 4. Copy worker
cp dist-server/_worker.js dist/

# 5. Cleanup
rm -rf dist-server

# 6. Deploy
wrangler pages deploy dist --branch production
```

## 🌐 Environment Types

### Preview Deployments
- **Branch:** `master` (or any non-production branch)
- **URL Pattern:** `https://[hash].godwear.pages.dev`
- **Purpose:** Testing and development
- **Command:** `wrangler pages deploy dist`

### Production Deployments
- **Branch:** `production`
- **URL Pattern:** `https://godwear.ca` (custom domain)
- **Purpose:** Live website
- **Command:** `wrangler pages deploy dist --branch production`

## 📊 Monitoring Deployments

### List All Deployments
```bash
wrangler pages deployment list
```

### Check Project Status
```bash
wrangler pages project list
```

### View Specific Deployment
```bash
wrangler pages deployment list | grep Production
```

## 🔧 Troubleshooting

### Issue: "Workers-specific command in Pages project"
**Error:** `It looks like you've run a Workers-specific command in a Pages project`

**Solution:** Use `wrangler pages deploy` instead of `wrangler deploy`

### Issue: Custom Domain Shows Old Content
**Problem:** godwear.ca shows outdated content after deployment

**Cause:** Preview deployments don't affect custom domains

**Solution:** Deploy to production branch:
```bash
wrangler pages deploy dist --branch production
```

### Issue: TypeScript Errors During Build
**Problem:** Build fails with TypeScript errors

**Solution:** Fix errors first, then deploy:
```bash
npm run type-check  # Check for errors
npm run build       # Fix any issues
wrangler pages deploy dist --branch production
```

### Issue: DNS/Cache Problems
**Problem:** Custom domain not updating immediately

**Solutions:**
1. **Hard refresh:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear cache:** Browser settings → Clear browsing data
3. **Incognito mode:** Test in private browsing
4. **Wait:** DNS propagation can take 2-5 minutes

## 📁 Project Structure

```
godwear/
├── app/
│   ├── routes/
│   │   ├── index.tsx          # Main landing page
│   │   ├── _renderer.tsx      # HTML renderer
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   └── emails/               # Email system
├── dist/                     # Build output (auto-generated)
├── docs/                     # Documentation
└── package.json             # Scripts and dependencies
```

## 🎯 Custom Domain Configuration

### Current Setup
- **Primary Domain:** `godwear.ca`
- **Cloudflare Pages:** `godwear.pages.dev`
- **DNS:** CNAME record pointing to Pages

### Verification
```bash
# Check configured domains
wrangler pages project list

# Should show: godwear.pages.dev, godwear.ca
```

## 📝 Best Practices

### 1. Always Test Preview First
```bash
# Deploy to preview
npm run deploy

# Test the preview URL
# Then deploy to production
wrangler pages deploy dist --branch production
```

### 2. Use Proper Branch Strategy
- **master branch** → Preview deployments
- **production branch** → Live website

### 3. Monitor Deployments
```bash
# Check recent deployments
wrangler pages deployment list | head -5

# Look for "Production" environment
```

### 4. Handle Uncommitted Changes
```bash
# If you see warnings about uncommitted changes
wrangler pages deploy dist --branch production --commit-dirty=true
```

## 🔄 Automated Deployment (Future)

Consider setting up GitHub Actions for automated deployments:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [production]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: godwear
          directory: dist
```

## 📞 Support

For deployment issues:
1. Check this documentation first
2. Review Cloudflare Pages logs in dashboard
3. Verify DNS configuration
4. Test with direct Cloudflare URLs

## 🎉 Success Indicators

A successful production deployment should show:
- ✅ TypeScript compilation passes
- ✅ Vite build completes
- ✅ Wrangler upload succeeds
- ✅ Production environment in deployment list
- ✅ Custom domain (godwear.ca) shows new content
- ✅ No console errors in browser

---

*Last updated: July 2024*
*GodWear - Built with ❤️ for the Kingdom*

# Frontend Deployment Guide

## Option 1: AWS Amplify (Recommended) ⭐

AWS Amplify provides automatic builds, deployments, and hosting with CI/CD integration.

### Cost: $0-5/month (includes free tier)

### Step 1: Update Environment Variables

First, update your `.env` file with the backend URL:

```bash
# .env
VITE_API_URL=http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com
```

### Step 2: Create Amplify App

```bash
# Install Amplify CLI (if not already installed)
npm install -g @aws-amplify/cli

# Initialize Amplify in your project
amplify init
# Choose:
# - Environment name: production
# - Default editor: Visual Studio Code
# - App type: javascript
# - Framework: react
# - Source directory: src
# - Distribution directory: dist
# - Build command: npm run build
# - Start command: npm run dev

# Add hosting
amplify add hosting
# Choose:
# - Hosting with Amplify Console (Managed hosting with custom domains, Continuous deployment)
# - Continuous deployment (Git-based deployments)

# Publish
amplify publish
```

### Step 3: Connect to GitHub (Alternative)

1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Select branch: `main` or `feature/deployment`
5. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
6. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com`
7. Click "Save and deploy"

### Step 4: Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Add your domain (e.g., krishiera.com)
3. Follow DNS configuration instructions
4. SSL certificate is automatically provisioned

---

## Option 2: Vercel (Easiest) 🚀

### Cost: Free for personal projects

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? krishi-era
# - Directory? ./
# - Override settings? No

# Set environment variable
vercel env add VITE_API_URL production
# Enter: http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com

# Deploy to production
vercel --prod
```

### Step 3: Configure Build Settings

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Option 3: Netlify

### Cost: Free for personal projects

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Deploy

```bash
# Login
netlify login

# Initialize
netlify init

# Follow prompts:
# - Create & configure a new site
# - Team: Your team
# - Site name: krishi-era
# - Build command: npm run build
# - Directory to deploy: dist

# Set environment variable
netlify env:set VITE_API_URL http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com

# Deploy
netlify deploy --prod
```

### Step 3: Configure Redirects

Create `public/_redirects`:

```
/*    /index.html   200
```

---

## Option 4: AWS S3 + CloudFront (Advanced)

### Cost: $1-5/month

### Step 1: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://krishi-era-frontend --region us-east-1

# Enable static website hosting
aws s3 website s3://krishi-era-frontend \
  --index-document index.html \
  --error-document index.html
```

### Step 2: Build and Upload

```bash
# Update .env
echo "VITE_API_URL=http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com" > .env

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://krishi-era-frontend --delete

# Make public
aws s3api put-bucket-policy \
  --bucket krishi-era-frontend \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::krishi-era-frontend/*"
    }]
  }'
```

### Step 3: Create CloudFront Distribution

```bash
# Create distribution
aws cloudfront create-distribution \
  --origin-domain-name krishi-era-frontend.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

### Step 4: Deployment Script

Create `deploy-frontend.sh`:

```bash
#!/bin/bash

echo "🏗️  Building frontend..."
npm run build

echo "📦 Uploading to S3..."
aws s3 sync dist/ s3://krishi-era-frontend --delete

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Deployment complete!"
```

---

## Comparison

| Option | Cost/Month | Setup Time | CI/CD | Custom Domain | SSL |
|--------|-----------|------------|-------|---------------|-----|
| **Amplify** ⭐ | $0-5 | 10 min | ✅ Auto | ✅ Free | ✅ Auto |
| **Vercel** 🚀 | Free | 5 min | ✅ Auto | ✅ Free | ✅ Auto |
| **Netlify** | Free | 5 min | ✅ Auto | ✅ Free | ✅ Auto |
| **S3+CloudFront** | $1-5 | 30 min | ❌ Manual | ✅ Paid | ✅ Manual |

---

## Recommended: Vercel (Fastest)

For quick deployment, I recommend Vercel:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Update .env
echo "VITE_API_URL=http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com" > .env

# 3. Deploy
vercel --prod

# 4. Set environment variable in Vercel dashboard
# Go to: https://vercel.com/dashboard
# Project Settings → Environment Variables
# Add: VITE_API_URL = http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com
```

Your app will be live at: `https://krishi-era.vercel.app`

---

## Post-Deployment Checklist

### 1. Update Backend CORS

Update `backend/src/index.ts` to allow your frontend domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://krishi-era.vercel.app',  // Add your Vercel URL
    'https://your-custom-domain.com'   // Add custom domain if any
  ],
  credentials: true
}));
```

Redeploy backend:
```bash
cd backend
./deploy-ecs.sh
```

### 2. Test the Deployment

```bash
# Test health endpoint
curl https://krishi-era.vercel.app

# Test API connection
# Open browser console and check for API calls
```

### 3. Set Up Monitoring

- Enable error tracking (Sentry, LogRocket)
- Set up analytics (Google Analytics, Mixpanel)
- Configure uptime monitoring (UptimeRobot, Pingdom)

### 4. Configure Custom Domain (Optional)

For Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. SSL is automatic

---

## Troubleshooting

### Issue: API calls failing

**Solution:** Check CORS settings in backend and ensure `VITE_API_URL` is set correctly.

```bash
# Verify environment variable
vercel env ls

# Check browser console for CORS errors
```

### Issue: 404 on page refresh

**Solution:** Configure SPA routing.

For Vercel, add `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

For Netlify, add `public/_redirects`:
```
/*    /index.html   200
```

### Issue: Build fails

**Solution:** Check build logs and ensure all dependencies are installed.

```bash
# Test build locally
npm run build

# Check for missing dependencies
npm install
```

---

## Continuous Deployment

### GitHub Actions (for any platform)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Cost Summary

### Monthly Costs (Frontend Only)

| Platform | Free Tier | Paid Plan |
|----------|-----------|-----------|
| Vercel | ✅ Free (100GB bandwidth) | $20/month (1TB) |
| Netlify | ✅ Free (100GB bandwidth) | $19/month (1TB) |
| AWS Amplify | ✅ Free (15GB served) | ~$5/month |
| S3+CloudFront | ~$1-5/month | ~$5-20/month |

### Total Project Cost (Frontend + Backend)

- **Backend (ECS):** $35-50/month
- **Frontend (Vercel):** Free
- **Total:** $35-50/month

---

## Next Steps

1. Choose deployment platform (Vercel recommended)
2. Deploy frontend
3. Update backend CORS settings
4. Test end-to-end functionality
5. Set up custom domain (optional)
6. Configure monitoring and analytics

Ready to deploy? Start with Vercel for the fastest setup! 🚀

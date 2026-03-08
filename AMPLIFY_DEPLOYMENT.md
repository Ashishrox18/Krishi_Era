# AWS Amplify Deployment Guide

## Quick Start

Your frontend is ready to deploy to AWS Amplify! Follow these steps:

### Option 1: Deploy via AWS Console (Recommended for First Time)

#### Step 1: Open Amplify Console
```
https://console.aws.amazon.com/amplify/home?region=us-east-1
```

#### Step 2: Create New App
1. Click **"New app"** → **"Host web app"**
2. Choose **"GitHub"** as the source
3. Click **"Authorize AWS Amplify"** (if not already authorized)

#### Step 3: Select Repository
1. Repository: **Ashishrox18/Krishi_Era**
2. Branch: **feature/deployment** (or **main**)
3. Click **"Next"**

#### Step 4: Configure Build Settings
Amplify will auto-detect settings from `amplify.yml`. Verify:

```yaml
Build command: npm run build
Output directory: dist
```

#### Step 5: Add Environment Variables
Click **"Advanced settings"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/api` |

#### Step 6: Deploy
1. Click **"Save and deploy"**
2. Wait 5-10 minutes for the build to complete
3. Your app will be live at: `https://[branch].[app-id].amplifyapp.com`

---

## Option 2: Deploy via AWS CLI

### Prerequisites
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure AWS credentials (already done)
aws configure
```

### Create App
```bash
# Create Amplify app
aws amplify create-app \
  --name krishi-era \
  --repository https://github.com/Ashishrox18/Krishi_Era \
  --region us-east-1

# Note the appId from the output
```

### Connect Branch
```bash
# Replace APP_ID with your app ID
APP_ID="your-app-id"

# Create branch connection
aws amplify create-branch \
  --app-id $APP_ID \
  --branch-name feature/deployment \
  --region us-east-1

# Enable auto-build
aws amplify update-branch \
  --app-id $APP_ID \
  --branch-name feature/deployment \
  --enable-auto-build \
  --region us-east-1
```

### Set Environment Variables
```bash
aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables VITE_API_BASE_URL=http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/api \
  --region us-east-1
```

### Start Deployment
```bash
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name feature/deployment \
  --job-type RELEASE \
  --region us-east-1
```

---

## Post-Deployment Configuration

### 1. Update Backend CORS

Your backend needs to allow requests from the Amplify domain.

Edit `backend/src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://feature-deployment.YOUR_APP_ID.amplifyapp.com',  // Add your Amplify URL
    'https://main.YOUR_APP_ID.amplifyapp.com'                 // If using main branch
  ],
  credentials: true
}));
```

Redeploy backend:
```bash
cd backend
./deploy-ecs.sh
```

### 2. Custom Domain (Optional)

#### Add Domain in Amplify Console
1. Go to **App settings** → **Domain management**
2. Click **"Add domain"**
3. Enter your domain (e.g., `krishiera.com`)
4. Follow DNS configuration instructions
5. SSL certificate is automatically provisioned

#### Update DNS Records
Add the CNAME records provided by Amplify to your domain registrar:

```
Type: CNAME
Name: www
Value: [provided by Amplify]
```

### 3. Enable Branch Deployments

For automatic deployments on every push:

1. Go to **App settings** → **Build settings**
2. Enable **"Automatically build all branches"**
3. Or select specific branches to auto-deploy

---

## Monitoring & Logs

### View Build Logs
```bash
# List recent builds
aws amplify list-jobs \
  --app-id $APP_ID \
  --branch-name feature/deployment \
  --region us-east-1

# Get specific build logs
aws amplify get-job \
  --app-id $APP_ID \
  --branch-name feature/deployment \
  --job-id [JOB_ID] \
  --region us-east-1
```

### Access Logs in Console
```
https://console.aws.amazon.com/amplify/home?region=us-east-1#/[APP_ID]
```

---

## Continuous Deployment

### Automatic Deployments
Once connected to GitHub, Amplify automatically deploys on every push to the connected branch.

### Manual Deployment
Use the provided script:
```bash
./deploy-amplify.sh
```

Or trigger via console:
1. Go to Amplify Console
2. Select your app
3. Click **"Run build"**

---

## Cost Monitoring

### View Current Usage
```bash
# Get app details including usage
aws amplify get-app \
  --app-id $APP_ID \
  --region us-east-1
```

### Set Up Billing Alerts
```bash
# Create budget for Amplify
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "Amplify-Monthly",
    "BudgetLimit": {
      "Amount": "10",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

### Expected Costs
- **Free Tier:** 15 GB served, 1000 build minutes
- **Your Usage:** ~60 GB/month = **$6.75/month**
- **Total Project:** $42-57/month (backend + frontend)

---

## Troubleshooting

### Build Fails

**Check build logs:**
```bash
aws amplify list-jobs --app-id $APP_ID --branch-name feature/deployment --region us-east-1
```

**Common issues:**
1. Missing environment variables
2. Build command incorrect
3. Node version mismatch

**Solution:**
Update build settings in `amplify.yml`:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - node --version
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
```

### API Calls Failing

**Check CORS settings** in backend:
```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://YOUR_AMPLIFY_URL.amplifyapp.com'
  ],
  credentials: true
}));
```

**Verify environment variable:**
```bash
aws amplify get-app --app-id $APP_ID --region us-east-1 --query 'app.environmentVariables'
```

### 404 on Page Refresh

**Add rewrites in Amplify Console:**
1. Go to **App settings** → **Rewrites and redirects**
2. Add rule:
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`

---

## Performance Optimization

### Enable Compression
Already configured in `amplify.yml` with caching.

### Add Custom Headers
In Amplify Console → **App settings** → **Custom headers**:

```yaml
customHeaders:
  - pattern: '**/*'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=31536000, immutable'
      - key: 'Strict-Transport-Security'
        value: 'max-age=31536000; includeSubDomains'
```

### Monitor Performance
Use CloudWatch metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/AmplifyHosting \
  --metric-name Requests \
  --dimensions Name=App,Value=$APP_ID \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 86400 \
  --statistics Sum \
  --region us-east-1
```

---

## Useful Commands

### Get App URL
```bash
aws amplify get-app --app-id $APP_ID --region us-east-1 --query 'app.defaultDomain' --output text
```

### List All Apps
```bash
aws amplify list-apps --region us-east-1
```

### Delete App (Cleanup)
```bash
aws amplify delete-app --app-id $APP_ID --region us-east-1
```

### Update Environment Variables
```bash
aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables VITE_API_BASE_URL=NEW_VALUE \
  --region us-east-1
```

---

## Next Steps

1. ✅ Deploy frontend to Amplify
2. ⏳ Update backend CORS settings
3. ⏳ Test end-to-end functionality
4. ⏳ Set up custom domain (optional)
5. ⏳ Configure monitoring and alerts

---

## Support

### AWS Amplify Documentation
- https://docs.aws.amazon.com/amplify/

### Amplify Console
- https://console.aws.amazon.com/amplify/home?region=us-east-1

### Cost Calculator
- https://calculator.aws/#/addService/Amplify

---

Ready to deploy! Start with the AWS Console method for the easiest setup. 🚀

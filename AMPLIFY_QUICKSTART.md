# AWS Amplify - Quick Start Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Open AWS Amplify Console
Click here: [AWS Amplify Console](https://console.aws.amazon.com/amplify/home?region=us-east-1)

### Step 2: Create New App
1. Click **"New app"** → **"Host web app"**
2. Select **"GitHub"**
3. Authorize AWS Amplify (if needed)

### Step 3: Connect Repository
- **Repository:** Ashishrox18/Krishi_Era
- **Branch:** feature/deployment
- Click **"Next"**

### Step 4: Configure Build
Amplify auto-detects settings from `amplify.yml`. Just verify:
- Build command: `npm run build`
- Output directory: `dist`

### Step 5: Add Environment Variable
Click **"Advanced settings"** → Add variable:

```
Key: VITE_API_BASE_URL
Value: http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/api
```

### Step 6: Deploy
1. Click **"Save and deploy"**
2. Wait 5-10 minutes
3. Your app will be live! 🎉

---

## After Deployment

### Get Your App URL
Your app will be available at:
```
https://feature-deployment.[app-id].amplifyapp.com
```

### Update Backend CORS
Add your Amplify URL to backend CORS settings:

```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://feature-deployment.[YOUR-APP-ID].amplifyapp.com'
  ],
  credentials: true
}));
```

Then redeploy backend:
```bash
cd backend
./deploy-ecs.sh
```

---

## Cost Summary

### Expected Monthly Cost
- **Free Tier:** 15 GB served
- **Your Usage:** ~60 GB/month
- **Cost:** $6.75/month (45 GB × $0.15)

### Total Project Cost
- Backend (ECS): $35-50/month
- Frontend (Amplify): $6.75/month
- **Total: $42-57/month**

---

## Automatic Deployments

Once connected, Amplify automatically deploys on every push to `feature/deployment` branch.

To trigger manual deployment:
```bash
./deploy-amplify.sh
```

---

## Troubleshooting

### Build Fails?
Check build logs in Amplify Console → Your App → Build logs

### API Not Working?
1. Verify environment variable is set correctly
2. Check backend CORS settings
3. Ensure backend ECS service is running

### 404 on Refresh?
Add rewrite rule in Amplify Console:
- App settings → Rewrites and redirects
- Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>`
- Target: `/index.html`
- Type: `200 (Rewrite)`

---

## Next Steps

1. ✅ Deploy to Amplify
2. Update backend CORS
3. Test the application
4. Add custom domain (optional)

For detailed instructions, see: [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md)

---

Ready to deploy! Open the AWS Console and follow the steps above. 🚀

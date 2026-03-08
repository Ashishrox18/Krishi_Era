# 🚀 Next Steps: Complete Your Deployment

## ✅ What's Already Done

Your AWS infrastructure is 100% complete and ready:
- ✅ ECS Cluster created
- ✅ Application Load Balancer configured
- ✅ Security groups set up
- ✅ IAM roles created
- ✅ ECR repository ready
- ✅ Task definition registered
- ✅ ECS service created

**Your Backend URL**: `http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com`

---

## 🐳 Step 1: Install Docker (If Not Already Installed)

### macOS
```bash
# Download Docker Desktop from:
# https://www.docker.com/products/docker-desktop

# Or install via Homebrew:
brew install --cask docker

# Start Docker Desktop application
open -a Docker
```

### Verify Docker Installation
```bash
docker --version
# Should show: Docker version 24.x.x or similar
```

---

## 🚀 Step 2: Deploy Backend to ECS

Once Docker is running, execute:

```bash
cd backend
./deploy-ecs.sh
```

**What this does:**
1. Builds Docker image from your Dockerfile
2. Authenticates with AWS ECR
3. Pushes image to ECR repository
4. Updates ECS service with new image
5. Waits for deployment to complete (~5 minutes)

**Expected output:**
```
🚀 Starting ECS Fargate Deployment
==================================
📋 Getting AWS account ID...
✅ Account ID: 120569622669
🔨 Building Docker image...
✅ Docker image built successfully
🔐 Logging into ECR...
✅ Logged into ECR
🏷️  Tagging image...
✅ Image tagged
📤 Pushing image to ECR...
✅ Image pushed to ECR
🔄 Updating ECS service...
✅ ECS service update initiated
⏳ Waiting for service to stabilize...
✅ Service is stable and running!
🌐 Your API is available at: http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com
🎉 Deployment complete!
```

---

## 🧪 Step 3: Test Backend Deployment

After deployment completes, test your API:

```bash
# Test health endpoint
curl http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/health

# Expected response:
# {"status":"healthy","timestamp":"2024-03-08T..."}

# Test API endpoint (should return 401 without auth)
curl http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/api/farmer/crops

# Expected response:
# {"error":"No token provided"}
```

---

## 🌐 Step 4: Deploy Frontend to AWS Amplify

### Option A: AWS Console (Recommended)

1. **Go to AWS Amplify Console**
   - Visit: https://console.aws.amazon.com/amplify
   - Region: us-east-1

2. **Create New App**
   - Click "New app" → "Host web app"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)

3. **Connect Repository**
   - Select your repository
   - Branch: `feature/deployment`
   - Click "Next"

4. **Configure Build Settings**
   - App name: `krishi-era`
   - Build command: `npm run build`
   - Base directory: `/`
   - Output directory: `dist`
   - Click "Next"

5. **Add Environment Variables**
   - Click "Advanced settings"
   - Add variable:
     - Key: `VITE_API_BASE_URL`
     - Value: `http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/api`
   - Click "Next"

6. **Review and Deploy**
   - Review settings
   - Click "Save and deploy"
   - Wait ~10-15 minutes for first deployment

7. **Get Your App URL**
   - After deployment, you'll get a URL like:
   - `https://main.d1234567890.amplifyapp.com`

### Option B: AWS CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init
# Follow prompts:
# - Name: krishi-era
# - Environment: production
# - Editor: your choice
# - AWS Profile: default

# Add hosting
amplify add hosting
# Choose: Amazon CloudFront and S3

# Set environment variable
amplify env add production
amplify env checkout production

# Publish
amplify publish
```

---

## 📝 Step 5: Update Frontend Configuration

The `.env.production` file is already configured:

```env
VITE_API_BASE_URL=http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/api
```

If deploying via Amplify Console, make sure to add this as an environment variable in the Amplify settings.

---

## ✅ Step 6: Verify Everything Works

### Backend Verification
```bash
# Health check
curl http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/health

# View logs
aws logs tail /ecs/krishi-era-backend --follow --region us-east-1

# Check service status
aws ecs describe-services \
  --cluster krishi-era-cluster \
  --services krishi-backend-service \
  --region us-east-1 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

### Frontend Verification
1. Open your Amplify URL in browser
2. Try to login with test credentials
3. Check browser console (F12) for any errors
4. Verify API calls are going to the correct backend URL
5. Test key features:
   - Login/Register
   - Dashboard loading
   - Listing produce
   - Viewing listings

---

## 🔍 Monitoring & Debugging

### View Backend Logs
```bash
# Real-time logs
aws logs tail /ecs/krishi-era-backend --follow --region us-east-1

# Last hour
aws logs tail /ecs/krishi-era-backend --since 1h --region us-east-1

# Search for errors
aws logs tail /ecs/krishi-era-backend --since 1h --filter-pattern "ERROR" --region us-east-1
```

### Check ECS Service Health
```bash
# Service status
aws ecs describe-services \
  --cluster krishi-era-cluster \
  --services krishi-backend-service \
  --region us-east-1

# Running tasks
aws ecs list-tasks \
  --cluster krishi-era-cluster \
  --service-name krishi-backend-service \
  --region us-east-1

# Task details
TASK_ARN=$(aws ecs list-tasks \
  --cluster krishi-era-cluster \
  --service-name krishi-backend-service \
  --region us-east-1 \
  --query 'taskArns[0]' \
  --output text)

aws ecs describe-tasks \
  --cluster krishi-era-cluster \
  --tasks $TASK_ARN \
  --region us-east-1
```

### Check Load Balancer Health
```bash
# Target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:120569622669:targetgroup/krishi-backend-tg/8237f1c017c88936 \
  --region us-east-1
```

---

## 🚨 Troubleshooting

### Issue: Docker build fails
**Solution:**
```bash
# Make sure Docker Desktop is running
open -a Docker

# Wait for Docker to start, then retry
cd backend
./deploy-ecs.sh
```

### Issue: ECR authentication fails
**Solution:**
```bash
# Re-authenticate
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 120569622669.dkr.ecr.us-east-1.amazonaws.com
```

### Issue: ECS service won't start
**Solution:**
```bash
# Check logs for errors
aws logs tail /ecs/krishi-era-backend --follow --region us-east-1

# Check service events
aws ecs describe-services \
  --cluster krishi-era-cluster \
  --services krishi-backend-service \
  --region us-east-1 \
  --query 'services[0].events[0:5]'
```

### Issue: Health check failing
**Possible causes:**
- Container not exposing port 3000
- /health endpoint not responding
- Security group blocking traffic
- Environment variables not set correctly

**Solution:**
```bash
# Check task logs
aws logs tail /ecs/krishi-era-backend --follow --region us-east-1

# Verify security groups
aws ec2 describe-security-groups \
  --group-ids sg-0dd255d9e650fe3d9 \
  --region us-east-1
```

### Issue: Frontend can't connect to backend
**Possible causes:**
- CORS configuration
- Wrong API URL in frontend
- ALB not accessible

**Solution:**
1. Verify `VITE_API_BASE_URL` in Amplify environment variables
2. Check browser console for CORS errors
3. Test backend directly: `curl http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/health`
4. Verify ALB security group allows port 80 from 0.0.0.0/0

---

## 💰 Cost Management

### Current Monthly Cost: ~$35-50

**Breakdown:**
- ECS Fargate (1 task, 24/7): $14.78
- Application Load Balancer: $16.20
- Data Transfer: $0.90
- CloudWatch Logs: $2.50
- ECR Storage: $0.20
- DynamoDB: $0-10
- Amplify Hosting: $0-5

### For 1 Week (Hackathon): ~$8-12

### Stop Service to Save Money
```bash
# Stop ECS service (saves ~$15/month)
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 0 \
  --region us-east-1
```

### Start Service Again
```bash
# Start ECS service
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 1 \
  --region us-east-1
```

---

## 🎯 Quick Reference

### Important URLs
- **Backend API**: `http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com`
- **Health Check**: `http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/health`
- **API Base**: `http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/api`
- **AWS Console**: https://console.aws.amazon.com
- **Amplify Console**: https://console.aws.amazon.com/amplify

### Important Commands
```bash
# Deploy backend
cd backend && ./deploy-ecs.sh

# View logs
aws logs tail /ecs/krishi-era-backend --follow --region us-east-1

# Check service
aws ecs describe-services --cluster krishi-era-cluster --services krishi-backend-service --region us-east-1

# Test health
curl http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/health
```

---

## 📚 Additional Documentation

- `INFRASTRUCTURE_COMPLETE.md` - Complete infrastructure details
- `DEPLOYMENT_QUICKSTART.md` - Quick start guide
- `AWS_COST_BREAKDOWN.md` - Detailed cost analysis
- `ECS_FARGATE_DEPLOYMENT.md` - Full ECS deployment guide
- `AWS_DEPLOYMENT_STRATEGY.md` - Deployment strategy overview

---

## ✅ Deployment Checklist

- [x] AWS infrastructure created
- [x] ECR repository ready
- [x] ECS cluster configured
- [x] Load balancer set up
- [x] Security groups configured
- [x] IAM roles created
- [x] Task definition registered
- [x] ECS service created
- [ ] **Docker installed and running** ← YOU ARE HERE
- [ ] Backend Docker image built
- [ ] Image pushed to ECR
- [ ] ECS service deployed
- [ ] Backend health check passing
- [ ] Frontend deployed to Amplify
- [ ] Frontend connected to backend
- [ ] End-to-end testing complete

---

## 🎉 Summary

**Current Status**: Infrastructure is 100% ready. Waiting for Docker to deploy backend.

**Next Action**: 
1. Install/start Docker Desktop
2. Run `cd backend && ./deploy-ecs.sh`
3. Test backend health endpoint
4. Deploy frontend to Amplify

**Estimated Time**: 20-30 minutes total

**Your backend will be live at**: `http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com`

Good luck with your deployment! 🚀

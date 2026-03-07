# 🚀 ECS Fargate Deployment - Quick Start Guide

## Prerequisites Checklist

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Docker installed and running
- [ ] AWS account with appropriate permissions
- [ ] DynamoDB tables already created (krishi-users, krishi-crops, krishi-orders, krishi-storage)
- [ ] S3 buckets already created (krishi-images-*, krishi-documents-*)

## Step-by-Step Deployment

### Part 1: Set Up AWS Infrastructure (One-Time Setup)

This creates all the AWS resources needed for ECS Fargate.

```bash
cd backend
./setup-ecs-infrastructure.sh
```

**What this does:**
- ✅ Creates ECR repository for Docker images
- ✅ Creates ECS cluster
- ✅ Sets up CloudWatch logs
- ✅ Configures secrets (JWT, Groq API key)
- ✅ Creates IAM roles
- ✅ Sets up networking (VPC, security groups)
- ✅ Creates Application Load Balancer
- ✅ Registers ECS task definition
- ✅ Creates ECS service

**Time:** ~5-10 minutes

**You'll be prompted for:**
- JWT_SECRET (your JWT secret key)
- GROQ_API_KEY (your Groq API key)

**Output:** You'll get your ALB DNS URL like:
```
http://krishi-era-alb-1234567890.us-east-1.elb.amazonaws.com
```

**Save this URL!** You'll need it for the frontend.

---

### Part 2: Build and Deploy Backend

```bash
cd backend
./deploy-ecs.sh
```

**What this does:**
- ✅ Builds Docker image
- ✅ Pushes to ECR
- ✅ Updates ECS service
- ✅ Waits for deployment to complete

**Time:** ~5-10 minutes (first time), ~3-5 minutes (subsequent deploys)

**Output:** Your API will be live at the ALB URL

---

### Part 3: Test Backend Deployment

```bash
# Replace with your actual ALB DNS
curl http://YOUR_ALB_DNS/health

# Expected response:
# {"status":"healthy","timestamp":"2024-03-07T..."}
```

---

### Part 4: Deploy Frontend to Amplify

#### Option A: Via AWS Console (Recommended for First Time)

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click "New app" → "Host web app"
3. Connect your Git repository (GitHub/GitLab/Bitbucket)
4. Select branch: `feature/deployment`
5. Configure build settings:
   - Build command: `npm run build`
   - Base directory: `/`
   - Output directory: `dist`
6. Add environment variable:
   - Key: `VITE_API_BASE_URL`
   - Value: `http://YOUR_ALB_DNS/api`
7. Click "Save and deploy"

**Time:** ~10-15 minutes

#### Option B: Via AWS CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init

# Add hosting
amplify add hosting

# Select: Amazon CloudFront and S3

# Publish
amplify publish
```

---

### Part 5: Update Frontend Environment

Create `.env.production`:

```bash
VITE_API_BASE_URL=http://YOUR_ALB_DNS/api
```

Replace `YOUR_ALB_DNS` with your actual ALB DNS from Step 1.

---

## Verification Checklist

### Backend Health Check

```bash
# Test health endpoint
curl http://YOUR_ALB_DNS/health

# Test API endpoint (should return 401 without auth)
curl http://YOUR_ALB_DNS/api/farmer/crops
```

### Frontend Check

1. Open your Amplify URL
2. Try to login
3. Check browser console for API calls
4. Verify no CORS errors

---

## Common Issues & Solutions

### Issue 1: Docker build fails

**Solution:**
```bash
# Make sure you're in the backend directory
cd backend

# Check Docker is running
docker ps

# Try building manually
docker build -t krishi-era-backend:latest .
```

### Issue 2: ECR push fails

**Solution:**
```bash
# Re-authenticate with ECR
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
```

### Issue 3: ECS service won't start

**Solution:**
```bash
# Check logs
aws logs tail /ecs/krishi-era-backend --follow

# Check service status
aws ecs describe-services \
  --cluster krishi-era-cluster \
  --services krishi-backend-service \
  --region us-east-1
```

### Issue 4: Health check failing

**Solution:**
```bash
# Check if container is running
aws ecs list-tasks \
  --cluster krishi-era-cluster \
  --service-name krishi-backend-service \
  --region us-east-1

# Check task logs
aws logs tail /ecs/krishi-era-backend --follow
```

### Issue 5: CORS errors in frontend

**Solution:**
- Verify `VITE_API_BASE_URL` is correct in Amplify environment variables
- Check ALB security group allows traffic from internet (0.0.0.0/0)
- Verify backend CORS configuration in `server.ts`

---

## Monitoring & Logs

### View Backend Logs

```bash
# Real-time logs
aws logs tail /ecs/krishi-era-backend --follow

# Last 100 lines
aws logs tail /ecs/krishi-era-backend --since 1h
```

### View ECS Service Status

```bash
aws ecs describe-services \
  --cluster krishi-era-cluster \
  --services krishi-backend-service \
  --region us-east-1 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

### View Task Status

```bash
aws ecs list-tasks \
  --cluster krishi-era-cluster \
  --service-name krishi-backend-service \
  --region us-east-1
```

---

## Updating Your Application

### Update Backend

```bash
cd backend
./deploy-ecs.sh
```

This will:
1. Build new Docker image
2. Push to ECR
3. Force new deployment
4. Wait for service to stabilize

### Update Frontend

Amplify auto-deploys on git push to connected branch:

```bash
git add .
git commit -m "Update frontend"
git push origin feature/deployment
```

---

## Scaling

### Scale ECS Service

```bash
# Scale to 2 tasks
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 2 \
  --region us-east-1
```

### Set Up Auto-Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/krishi-era-cluster/krishi-backend-service \
  --min-capacity 1 \
  --max-capacity 4

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/krishi-era-cluster/krishi-backend-service \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

---

## Cost Management

### Stop Service (When Not Needed)

```bash
# Stop service (saves ~$15/month)
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 0 \
  --region us-east-1
```

### Start Service

```bash
# Start service
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 1 \
  --region us-east-1
```

### View Current Costs

```bash
# Get current month costs
aws ce get-cost-and-usage \
  --time-period Start=2024-03-01,End=2024-03-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## Cleanup (Delete Everything)

**⚠️ Warning: This will delete all resources!**

```bash
# Delete ECS service
aws ecs delete-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --force \
  --region us-east-1

# Delete ECS cluster
aws ecs delete-cluster \
  --cluster krishi-era-cluster \
  --region us-east-1

# Delete ALB
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names krishi-era-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text \
  --region us-east-1)
aws elbv2 delete-load-balancer \
  --load-balancer-arn ${ALB_ARN} \
  --region us-east-1

# Delete target group
TG_ARN=$(aws elbv2 describe-target-groups \
  --names krishi-backend-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text \
  --region us-east-1)
aws elbv2 delete-target-group \
  --target-group-arn ${TG_ARN} \
  --region us-east-1

# Delete ECR repository
aws ecr delete-repository \
  --repository-name krishi-era-backend \
  --force \
  --region us-east-1

# Delete CloudWatch log group
aws logs delete-log-group \
  --log-group-name /ecs/krishi-era-backend \
  --region us-east-1
```

---

## Support & Troubleshooting

### Get Help

1. Check logs: `aws logs tail /ecs/krishi-era-backend --follow`
2. Check service status: `aws ecs describe-services ...`
3. Review security groups and networking
4. Verify secrets are configured correctly

### Useful Commands

```bash
# Get ALB DNS
aws elbv2 describe-load-balancers \
  --names krishi-era-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text

# Get task definition
aws ecs describe-task-definition \
  --task-definition krishi-era-backend

# List running tasks
aws ecs list-tasks \
  --cluster krishi-era-cluster \
  --service-name krishi-backend-service
```

---

## Summary

**Total Deployment Time:** ~30-45 minutes (first time)

**Monthly Cost:** $35-50

**What You Get:**
- ✅ Always-on backend (no cold starts)
- ✅ Auto-scaling capability
- ✅ Production-ready infrastructure
- ✅ Easy updates and rollbacks
- ✅ Comprehensive logging and monitoring

**Next Steps:**
1. Run `./setup-ecs-infrastructure.sh`
2. Run `./deploy-ecs.sh`
3. Deploy frontend to Amplify
4. Test your application
5. Share your demo URL!

Good luck with your deployment! 🚀

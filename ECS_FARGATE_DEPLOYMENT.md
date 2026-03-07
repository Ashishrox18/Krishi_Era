# ECS Fargate Deployment Guide - Always-On Solution

## Why ECS Fargate?

✅ **No Cold Starts** - Always responsive  
✅ **Predictable Performance** - Consistent response times  
✅ **Cost-Effective** - $31-46/month  
✅ **Production-Ready** - Real-world architecture  
✅ **Easy Scaling** - Add containers as needed  

---

## Architecture

```
Internet
   ↓
CloudFront (Amplify) → React Frontend
   ↓
Application Load Balancer
   ↓
ECS Fargate Service (Backend Container)
   ↓
DynamoDB / S3 / SNS
```

---

## Part 1: Prepare Backend for Containerization

### Step 1: Create Dockerfile

Create `backend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
```

### Step 2: Create .dockerignore

Create `backend/.dockerignore`:

```
node_modules
dist
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
*.md
data/
.DS_Store
coverage/
.vscode/
```

### Step 3: Update server.ts for Container

Update `backend/src/server.ts` to handle graceful shutdown:

```typescript
// ... existing imports ...

const app = express();
const PORT = process.env.PORT || 3000;

// ... existing middleware and routes ...

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
```

### Step 4: Test Locally

```bash
cd backend

# Build image
docker build -t krishi-era-backend:latest .

# Run locally
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e USE_LOCAL_STORAGE=false \
  -e JWT_SECRET=your_jwt_secret \
  -e GROQ_API_KEY=your_groq_key \
  krishi-era-backend:latest

# Test
curl http://localhost:3000/health
```

---

## Part 2: Set Up AWS Infrastructure

### Step 1: Create ECR Repository

```bash
# Create repository
aws ecr create-repository \
  --repository-name krishi-era-backend \
  --region us-east-1

# Get repository URI (save this)
aws ecr describe-repositories \
  --repository-names krishi-era-backend \
  --query 'repositories[0].repositoryUri' \
  --output text
```

### Step 2: Push Image to ECR

```bash
# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1
ECR_URL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/krishi-era-backend"

# Login to ECR
aws ecr get-login-password --region ${REGION} | \
  docker login --username AWS --password-stdin ${ECR_URL}

# Tag image
docker tag krishi-era-backend:latest ${ECR_URL}:latest

# Push image
docker push ${ECR_URL}:latest
```

### Step 3: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name krishi-era-cluster \
  --region us-east-1
```

### Step 4: Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/krishi-era-backend \
  --region us-east-1
```

### Step 5: Store Secrets in AWS Secrets Manager

```bash
# Store JWT secret
aws secretsmanager create-secret \
  --name krishi/jwt-secret \
  --secret-string "your_jwt_secret_here" \
  --region us-east-1

# Store Groq API key
aws secretsmanager create-secret \
  --name krishi/groq-api-key \
  --secret-string "your_groq_api_key_here" \
  --region us-east-1

# Get secret ARNs (save these)
aws secretsmanager describe-secret \
  --secret-id krishi/jwt-secret \
  --query 'ARN' \
  --output text

aws secretsmanager describe-secret \
  --secret-id krishi/groq-api-key \
  --query 'ARN' \
  --output text
```

### Step 6: Create IAM Role for ECS Task

Create `backend/ecs-task-role-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/krishi-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::krishi-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": [
        "arn:aws:sns:us-east-1:*:krishi-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:*:secret:krishi/*"
      ]
    }
  ]
}
```

```bash
# Create IAM role
aws iam create-role \
  --role-name KrishiECSTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policy
aws iam put-role-policy \
  --role-name KrishiECSTaskRole \
  --policy-name KrishiECSTaskPolicy \
  --policy-document file://ecs-task-role-policy.json

# Create execution role (for pulling images and logs)
aws iam create-role \
  --role-name KrishiECSExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name KrishiECSExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add secrets access to execution role
aws iam put-role-policy \
  --role-name KrishiECSExecutionRole \
  --policy-name SecretsAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": ["arn:aws:secretsmanager:us-east-1:*:secret:krishi/*"]
    }]
  }'
```

### Step 7: Create Task Definition

Create `backend/task-definition.json`:

```json
{
  "family": "krishi-era-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/KrishiECSExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/KrishiECSTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/krishi-era-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "AWS_REGION", "value": "us-east-1"},
        {"name": "USE_LOCAL_STORAGE", "value": "false"},
        {"name": "DYNAMODB_USERS_TABLE", "value": "krishi-users"},
        {"name": "DYNAMODB_CROPS_TABLE", "value": "krishi-crops"},
        {"name": "DYNAMODB_ORDERS_TABLE", "value": "krishi-orders"},
        {"name": "DYNAMODB_STORAGE_TABLE", "value": "krishi-storage"},
        {"name": "S3_IMAGES_BUCKET", "value": "krishi-images-1772218008"},
        {"name": "S3_DOCUMENTS_BUCKET", "value": "krishi-documents-1772218008"},
        {"name": "USE_GROQ", "value": "true"}
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:krishi/jwt-secret"
        },
        {
          "name": "GROQ_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:krishi/groq-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/krishi-era-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Replace `ACCOUNT_ID` with your AWS account ID:

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
sed -i '' "s/ACCOUNT_ID/${ACCOUNT_ID}/g" task-definition.json

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region us-east-1
```

### Step 8: Create Application Load Balancer

```bash
# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text)

# Get subnets
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=${VPC_ID}" \
  --query 'Subnets[*].SubnetId' \
  --output text)

# Create security group for ALB
ALB_SG=$(aws ec2 create-security-group \
  --group-name krishi-alb-sg \
  --description "Security group for Krishi ALB" \
  --vpc-id ${VPC_ID} \
  --query 'GroupId' \
  --output text)

# Allow HTTP traffic
aws ec2 authorize-security-group-ingress \
  --group-id ${ALB_SG} \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow HTTPS traffic
aws ec2 authorize-security-group-ingress \
  --group-id ${ALB_SG} \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name krishi-era-alb \
  --subnets ${SUBNET_IDS} \
  --security-groups ${ALB_SG} \
  --scheme internet-facing \
  --type application \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Get ALB DNS name
aws elbv2 describe-load-balancers \
  --load-balancer-arns ${ALB_ARN} \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

### Step 9: Create Target Group

```bash
# Create target group
TG_ARN=$(aws elbv2 create-target-group \
  --name krishi-backend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id ${VPC_ID} \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn ${ALB_ARN} \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=${TG_ARN}
```

### Step 10: Create Security Group for ECS Tasks

```bash
# Create security group for ECS tasks
ECS_SG=$(aws ec2 create-security-group \
  --group-name krishi-ecs-tasks-sg \
  --description "Security group for Krishi ECS tasks" \
  --vpc-id ${VPC_ID} \
  --query 'GroupId' \
  --output text)

# Allow traffic from ALB
aws ec2 authorize-security-group-ingress \
  --group-id ${ECS_SG} \
  --protocol tcp \
  --port 3000 \
  --source-group ${ALB_SG}
```

### Step 11: Create ECS Service

```bash
# Get subnet IDs as comma-separated
SUBNETS=$(echo ${SUBNET_IDS} | tr ' ' ',')

# Create service
aws ecs create-service \
  --cluster krishi-era-cluster \
  --service-name krishi-backend-service \
  --task-definition krishi-era-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${ECS_SG}],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=${TG_ARN},containerName=backend,containerPort=3000" \
  --health-check-grace-period-seconds 60 \
  --region us-east-1
```

---

## Part 3: Deploy Frontend to Amplify

### Step 1: Get ALB URL

```bash
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns ${ALB_ARN} \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "Your API URL: http://${ALB_DNS}"
```

### Step 2: Update Frontend Environment

Update `.env.production`:

```bash
VITE_API_BASE_URL=http://YOUR_ALB_DNS/api
```

### Step 3: Deploy to Amplify

Follow the Amplify deployment steps from the previous guide.

---

## Part 4: Automation Scripts

Create `backend/deploy.sh`:

```bash
#!/bin/bash
set -e

# Configuration
REGION="us-east-1"
CLUSTER="krishi-era-cluster"
SERVICE="krishi-backend-service"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/krishi-era-backend"

echo "🔨 Building Docker image..."
docker build -t krishi-era-backend:latest .

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${REGION} | \
  docker login --username AWS --password-stdin ${ECR_REPO}

echo "🏷️  Tagging image..."
docker tag krishi-era-backend:latest ${ECR_REPO}:latest

echo "📤 Pushing to ECR..."
docker push ${ECR_REPO}:latest

echo "🚀 Updating ECS service..."
aws ecs update-service \
  --cluster ${CLUSTER} \
  --service ${SERVICE} \
  --force-new-deployment \
  --region ${REGION}

echo "✅ Deployment initiated! Checking status..."
aws ecs wait services-stable \
  --cluster ${CLUSTER} \
  --services ${SERVICE} \
  --region ${REGION}

echo "🎉 Deployment complete!"
```

Make it executable:

```bash
chmod +x backend/deploy.sh
```

---

## Monitoring & Scaling

### View Logs

```bash
# View logs
aws logs tail /ecs/krishi-era-backend --follow
```

### Scale Service

```bash
# Scale to 2 tasks
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 2
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
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

---

## Cost Breakdown

| Component | Monthly Cost |
|-----------|--------------|
| ECS Fargate (1 task, 0.5 vCPU, 1GB) | $14.78 |
| Application Load Balancer | $16.20 |
| Data Transfer (10GB) | $0.90 |
| CloudWatch Logs (5GB) | $2.50 |
| ECR Storage (2GB) | $0.20 |
| **Total** | **$34.58/month** |

---

## Next Steps

1. ✅ Review architecture
2. ⬜ Build and test Docker image locally
3. ⬜ Push image to ECR
4. ⬜ Create ECS cluster and service
5. ⬜ Deploy frontend to Amplify
6. ⬜ Test end-to-end
7. ⬜ Set up monitoring and alerts

Ready to deploy?

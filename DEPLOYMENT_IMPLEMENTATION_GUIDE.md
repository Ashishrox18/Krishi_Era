# AWS Deployment Implementation Guide

## Recommended: Amplify + Lambda Architecture

This guide walks through deploying your Krishi Era application using AWS Amplify for the frontend and Lambda for the backend.

---

## Prerequisites

- [x] AWS Account with credentials configured
- [x] AWS CLI installed and configured
- [x] Node.js 18+ installed
- [x] Git repository (GitHub/GitLab/Bitbucket)
- [x] DynamoDB tables already created ✅
- [x] S3 buckets already created ✅

---

## Architecture Overview

```
Internet
   ↓
CloudFront (Amplify) → React Frontend (Static)
   ↓
API Gateway → Lambda Functions → DynamoDB/S3/SNS
```

---

## Part 1: Backend Deployment (Lambda + API Gateway)

### Option A: Using AWS SAM (Recommended)

#### Step 1: Install AWS SAM CLI

```bash
# macOS
brew install aws-sam-cli

# Verify installation
sam --version
```

#### Step 2: Create SAM Template

Create `backend/template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Krishi Era Backend API

Globals:
  Function:
    Timeout: 30
    Runtime: nodejs18.x
    MemorySize: 512
    Environment:
      Variables:
        NODE_ENV: production
        DYNAMODB_USERS_TABLE: !Ref UsersTableName
        DYNAMODB_CROPS_TABLE: !Ref CropsTableName
        DYNAMODB_ORDERS_TABLE: !Ref OrdersTableName
        DYNAMODB_STORAGE_TABLE: !Ref StorageTableName
        S3_IMAGES_BUCKET: !Ref ImagesBucketName
        S3_DOCUMENTS_BUCKET: !Ref DocumentsBucketName
        JWT_SECRET: !Ref JWTSecret
        USE_LOCAL_STORAGE: 'false'
        USE_GROQ: 'true'
        GROQ_API_KEY: !Ref GroqAPIKey

Parameters:
  UsersTableName:
    Type: String
    Default: krishi-users
  CropsTableName:
    Type: String
    Default: krishi-crops
  OrdersTableName:
    Type: String
    Default: krishi-orders
  StorageTableName:
    Type: String
    Default: krishi-storage
  ImagesBucketName:
    Type: String
    Default: krishi-images-1772218008
  DocumentsBucketName:
    Type: String
    Default: krishi-documents-1772218008
  JWTSecret:
    Type: String
    NoEcho: true
  GroqAPIKey:
    Type: String
    NoEcho: true

Resources:
  # API Gateway
  KrishiApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: NONE

  # Main API Lambda Function
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./
      Handler: lambda.handler
      Events:
        ApiProxy:
          Type: Api
          Properties:
            RestApiId: !Ref KrishiApi
            Path: /{proxy+}
            Method: ANY
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref UsersTableName
        - DynamoDBCrudPolicy:
            TableName: !Ref CropsTableName
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTableName
        - DynamoDBCrudPolicy:
            TableName: !Ref StorageTableName
        - S3CrudPolicy:
            BucketName: !Ref ImagesBucketName
        - S3CrudPolicy:
            BucketName: !Ref DocumentsBucketName
        - SNSPublishMessagePolicy:
            TopicName: krishi-notifications

Outputs:
  ApiUrl:
    Description: "API Gateway endpoint URL"
    Value: !Sub "https://${KrishiApi}.execute-api.${AWS::Region}.amazonaws.com/prod"
  ApiId:
    Description: "API Gateway ID"
    Value: !Ref KrishiApi
```

#### Step 3: Create Lambda Handler

Create `backend/lambda.ts`:

```typescript
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import your existing routes
import authRoutes from './src/routes/auth.routes';
import farmerRoutes from './src/routes/farmer.routes';
import buyerRoutes from './src/routes/buyer.routes';
import storageRoutes from './src/routes/storage.routes';
import transporterRoutes from './src/routes/transporter.routes';
import adminRoutes from './src/routes/admin.routes';
import aiRoutes from './src/routes/ai.routes';
import notificationsRoutes from './src/routes/notifications.routes';
import vehiclesRoutes from './src/routes/vehicles.routes';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/transporter', transporterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/vehicles', vehiclesRoutes);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Export handler for Lambda
export const handler = serverless(app);
```

#### Step 4: Update package.json

Add to `backend/package.json`:

```json
{
  "scripts": {
    "build:lambda": "tsc && cp package.json dist/ && cd dist && npm install --production",
    "deploy": "sam build && sam deploy --guided"
  },
  "dependencies": {
    "serverless-http": "^3.2.0"
  }
}
```

#### Step 5: Deploy Backend

```bash
cd backend

# Install dependencies
npm install serverless-http

# Build
npm run build:lambda

# Deploy (first time - interactive)
sam deploy --guided

# Follow prompts:
# Stack Name: krishi-era-backend
# AWS Region: us-east-1
# Confirm changes: Y
# Allow SAM CLI IAM role creation: Y
# Save arguments to configuration file: Y
```

#### Step 6: Get API URL

```bash
# Get the API endpoint
aws cloudformation describe-stacks \
  --stack-name krishi-era-backend \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

---

## Part 2: Frontend Deployment (AWS Amplify)

### Step 1: Prepare Frontend for Deployment

Update `.env.production`:

```bash
VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/api
```

### Step 2: Create amplify.yml

Create `amplify.yml` in project root:

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

### Step 3: Deploy via AWS Console

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your Git repository
4. Select branch: `feature/deployment`
5. Configure build settings:
   - Build command: `npm run build`
   - Base directory: `/`
   - Output directory: `dist`
6. Add environment variables:
   - `VITE_API_BASE_URL`: Your API Gateway URL
7. Click "Save and deploy"

### Step 4: Alternative - Deploy via CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Select: Amazon CloudFront and S3
# Publish
amplify publish
```

---

## Part 3: Configuration & Testing

### Step 1: Update CORS

Update API Gateway CORS if needed:

```bash
aws apigateway update-rest-api \
  --rest-api-id YOUR_API_ID \
  --patch-operations \
    op=replace,path=/cors/allowOrigins,value="'https://YOUR_AMPLIFY_URL.amplifyapp.com'"
```

### Step 2: Test Deployment

```bash
# Test backend health
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/health

# Test frontend
open https://YOUR_APP_ID.amplifyapp.com
```

### Step 3: Set Up Custom Domain (Optional)

In Amplify Console:
1. Go to "Domain management"
2. Add domain
3. Follow DNS configuration steps

---

## Part 4: CI/CD Setup

### Automatic Deployments

Amplify automatically deploys on git push to connected branch.

For backend updates:

```bash
# After code changes
cd backend
npm run build:lambda
sam deploy
```

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [feature/deployment, main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy backend
        run: |
          cd backend
          npm ci
          npm run build:lambda
          sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
```

---

## Monitoring & Logs

### CloudWatch Logs

```bash
# View Lambda logs
sam logs -n ApiFunction --stack-name krishi-era-backend --tail

# View specific log group
aws logs tail /aws/lambda/krishi-era-backend-ApiFunction --follow
```

### CloudWatch Dashboard

Create dashboard in AWS Console:
1. Go to CloudWatch
2. Create dashboard
3. Add widgets for:
   - Lambda invocations
   - API Gateway requests
   - DynamoDB read/write capacity
   - Error rates

---

## Cost Optimization Tips

1. **Enable Lambda Reserved Concurrency**: Prevent runaway costs
2. **Set up CloudWatch Alarms**: Alert on high costs
3. **Use DynamoDB On-Demand**: Pay per request for variable traffic
4. **Enable S3 Lifecycle Policies**: Move old files to cheaper storage
5. **Set API Gateway Throttling**: Prevent abuse

---

## Troubleshooting

### Lambda Cold Starts
- Increase memory (faster cold starts)
- Use provisioned concurrency (costs more)
- Implement warming strategy

### CORS Issues
- Check API Gateway CORS settings
- Verify Amplify environment variables
- Check browser console for errors

### DynamoDB Access
- Verify Lambda IAM permissions
- Check table names in environment variables
- Review CloudWatch logs for errors

---

## Rollback Strategy

### Backend Rollback
```bash
# List previous versions
aws cloudformation list-stacks

# Rollback to previous version
aws cloudformation rollback-stack --stack-name krishi-era-backend
```

### Frontend Rollback
In Amplify Console:
1. Go to app
2. Click on previous deployment
3. Click "Redeploy this version"

---

## Next Steps

1. ✅ Review deployment architecture
2. ⬜ Set up AWS SAM for backend
3. ⬜ Deploy backend to Lambda
4. ⬜ Connect Amplify to Git repo
5. ⬜ Deploy frontend to Amplify
6. ⬜ Test end-to-end
7. ⬜ Set up monitoring
8. ⬜ Configure custom domain (optional)

Ready to start implementation?

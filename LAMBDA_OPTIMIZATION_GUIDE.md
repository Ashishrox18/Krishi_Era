# Lambda Optimization & Always-On Strategy

## Understanding Lambda Cold Starts & Timeouts

### The Problem
- **Cold Start**: First request after inactivity takes 1-5 seconds
- **Timeout**: Lambda has max 15-minute execution limit
- **Idle Shutdown**: Lambda containers shut down after ~15 minutes of inactivity

### The Solution: Multi-Layer Approach

---

## Strategy 1: Provisioned Concurrency (Best for Production)

### What It Does
Keeps Lambda instances "warm" and ready to respond instantly.

### Implementation

Update `backend/template.yaml`:

```yaml
Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./
      Handler: lambda.handler
      Timeout: 30
      MemorySize: 1024  # More memory = faster cold starts
      AutoPublishAlias: live
      ProvisionedConcurrencyConfig:
        ProvisionedConcurrentExecutions: 2  # Keep 2 instances warm

  # Auto-scaling for provisioned concurrency
  ProvisionedConcurrencyScaling:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 10
      MinCapacity: 2
      ResourceId: !Sub function:${ApiFunction}:live
      RoleARN: !Sub arn:aws:iam::${AWS::AccountId}:role/aws-service-role/lambda.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_LambdaConcurrency
      ScalableDimension: lambda:function:ProvisionedConcurrentExecutions
      ServiceNamespace: lambda
```

**Cost Impact:**
- Provisioned Concurrency: $0.0000041667 per GB-second
- For 2 instances with 1GB: ~$6/month
- **Worth it for production to eliminate cold starts**

---

## Strategy 2: Lambda Warming (Cost-Effective)

### CloudWatch Events to Keep Lambda Warm

Create `backend/warmer.yaml`:

```yaml
Resources:
  # Warmer function that pings main API
  WarmerFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./
      Handler: warmer.handler
      Timeout: 10
      Environment:
        Variables:
          API_ENDPOINT: !Sub "https://${KrishiApi}.execute-api.${AWS::Region}.amazonaws.com/prod"
      Events:
        WarmingSchedule:
          Type: Schedule
          Properties:
            Schedule: rate(5 minutes)  # Ping every 5 minutes
            Enabled: true

  # Grant warmer permission to invoke API
  WarmerInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ApiFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
```

Create `backend/warmer.ts`:

```typescript
import axios from 'axios';

export const handler = async (event: any) => {
  const apiEndpoint = process.env.API_ENDPOINT;
  
  try {
    // Ping health endpoint to keep Lambda warm
    await axios.get(`${apiEndpoint}/health`, {
      headers: { 'X-Warmer': 'true' }
    });
    
    console.log('Lambda warmed successfully');
    return { statusCode: 200, body: 'Warmed' };
  } catch (error) {
    console.error('Warming failed:', error);
    return { statusCode: 500, body: 'Failed' };
  }
};
```

**Cost Impact:**
- CloudWatch Events: FREE (first 1M events)
- Lambda invocations: ~8,640/month = FREE (within free tier)
- **Total: $0/month**

---

## Strategy 3: Optimize Lambda Performance

### 1. Increase Memory (Faster Execution)

```yaml
ApiFunction:
  Type: AWS::Serverless::Function
  Properties:
    MemorySize: 1024  # Up from 512MB
    # More memory = more CPU = faster cold starts
```

**Impact:**
- 512MB: ~3-5 second cold start
- 1024MB: ~1-2 second cold start
- 2048MB: ~0.5-1 second cold start

**Cost:**
- 512MB: $0.0000083333 per GB-second
- 1024MB: $0.0000166667 per GB-second
- For typical usage: +$5-10/month

### 2. Optimize Code Bundle Size

Create `backend/webpack.config.js`:

```javascript
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './lambda.ts',
  target: 'node',
  mode: 'production',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: 'lambda.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2'
  },
  optimization: {
    minimize: true
  }
};
```

Update `backend/package.json`:

```json
{
  "scripts": {
    "build:lambda": "webpack && cd dist && npm install --production"
  },
  "devDependencies": {
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.4",
    "webpack-node-externals": "^3.0.0",
    "ts-loader": "^9.4.4"
  }
}
```

### 3. Connection Pooling for DynamoDB

Update `backend/src/services/aws/dynamodb.service.ts`:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Create client OUTSIDE the class (reused across invocations)
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
  requestHandler: {
    connectionTimeout: 3000,
    socketTimeout: 3000,
  }
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  }
});

export class DynamoDBService {
  // Use the shared client
  private client = docClient;
  
  // ... rest of your code
}
```

### 4. Lazy Load Heavy Dependencies

```typescript
// Instead of:
import { bedrockService } from './services/aws/bedrock.service';

// Do:
let bedrockService: any;
const getBedrockService = async () => {
  if (!bedrockService) {
    bedrockService = (await import('./services/aws/bedrock.service')).bedrockService;
  }
  return bedrockService;
};
```

---

## Strategy 4: Hybrid Approach (Recommended)

### Use ECS Fargate for Backend + Amplify for Frontend

This eliminates Lambda cold starts entirely while keeping costs reasonable.

#### Architecture

```
Amplify (Frontend) → ALB → ECS Fargate (Backend) → DynamoDB/S3
```

#### Updated Cost Breakdown

| Component | Cost |
|-----------|------|
| **Amplify Hosting** | $0-$5 |
| **ECS Fargate** (1 task, 0.5 vCPU, 1GB, 24/7) | $14.78 |
| **Application Load Balancer** | $16.20 |
| **DynamoDB** | $0-$10 |
| **S3** | $0.12 |
| **Total** | **$31-$46/month** |

**Benefits:**
- ✅ No cold starts
- ✅ Always responsive
- ✅ Consistent performance
- ✅ Still cost-effective

#### Implementation

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.js"]
```

Create `backend/docker-compose.yml` for local testing:

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - AWS_REGION=us-east-1
    env_file:
      - .env
```

Create `backend/ecs-task-definition.json`:

```json
{
  "family": "krishi-era-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ECR_REPO_URL:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "AWS_REGION", "value": "us-east-1"},
        {"name": "USE_LOCAL_STORAGE", "value": "false"}
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:krishi/jwt-secret"
        },
        {
          "name": "GROQ_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:krishi/groq-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/krishi-era-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Deployment Script

Create `backend/deploy-ecs.sh`:

```bash
#!/bin/bash

# Variables
AWS_REGION="us-east-1"
ECR_REPO="krishi-era-backend"
CLUSTER_NAME="krishi-era-cluster"
SERVICE_NAME="krishi-era-service"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

echo "🔨 Building Docker image..."
docker build -t ${ECR_REPO}:latest .

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${ECR_URL}

echo "🏷️  Tagging image..."
docker tag ${ECR_REPO}:latest ${ECR_URL}:latest

echo "📤 Pushing to ECR..."
docker push ${ECR_URL}:latest

echo "🚀 Updating ECS service..."
aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service ${SERVICE_NAME} \
  --force-new-deployment \
  --region ${AWS_REGION}

echo "✅ Deployment complete!"
```

---

## Strategy 5: API Gateway Caching

Reduce Lambda invocations by caching responses.

```yaml
KrishiApi:
  Type: AWS::Serverless::Api
  Properties:
    StageName: prod
    CacheClusterEnabled: true
    CacheClusterSize: '0.5'  # 0.5GB cache
    MethodSettings:
      - ResourcePath: /api/farmer/crops
        HttpMethod: GET
        CachingEnabled: true
        CacheTtlInSeconds: 300  # 5 minutes
      - ResourcePath: /api/market-prices
        HttpMethod: GET
        CachingEnabled: true
        CacheTtlInSeconds: 600  # 10 minutes
```

**Cost:** $0.020/hour = ~$14.40/month for 0.5GB cache

---

## Recommended Solution: Choose Based on Budget

### Option A: Budget-Conscious ($0-15/month)
**Lambda + Warming Strategy**
- Use Lambda with CloudWatch warming
- Optimize code bundle
- Accept occasional cold starts
- Perfect for demo/hackathon

### Option B: Production-Ready ($30-50/month)
**ECS Fargate + Amplify** ⭐ RECOMMENDED
- No cold starts
- Always responsive
- Predictable performance
- Easy to scale

### Option C: High-Performance ($50-80/month)
**Lambda + Provisioned Concurrency**
- Instant response times
- Serverless benefits
- Auto-scaling
- Best of both worlds

---

## Implementation Checklist

### For Lambda + Warming:
- [ ] Increase Lambda memory to 1024MB
- [ ] Add CloudWatch warming schedule
- [ ] Optimize bundle size with webpack
- [ ] Implement connection pooling
- [ ] Add API Gateway caching for read-heavy endpoints

### For ECS Fargate:
- [ ] Create Dockerfile
- [ ] Set up ECR repository
- [ ] Create ECS cluster and service
- [ ] Configure Application Load Balancer
- [ ] Set up auto-scaling policies
- [ ] Configure CloudWatch logs

---

## Monitoring & Alerts

Create CloudWatch alarms:

```bash
# Alert on high Lambda duration
aws cloudwatch put-metric-alarm \
  --alarm-name krishi-lambda-duration \
  --alarm-description "Alert when Lambda duration is high" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 3000 \
  --comparison-operator GreaterThanThreshold

# Alert on Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name krishi-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## My Recommendation

For your hackathon/demo, I recommend:

**🎯 ECS Fargate + Amplify**

**Why:**
1. No cold starts - always responsive
2. Predictable performance for demos
3. Only $31-46/month (affordable)
4. Easy to showcase
5. Production-ready architecture
6. No Lambda complexity

**Next Steps:**
1. Create Dockerfile for backend
2. Set up ECS cluster
3. Deploy to Fargate
4. Connect Amplify frontend
5. Test end-to-end

Would you like me to implement the ECS Fargate deployment?

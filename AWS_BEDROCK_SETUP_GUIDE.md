# AWS Bedrock Setup Guide for Krishi Era

## Overview
This guide will help you connect your AWS account to the Krishi Era platform to enable AI features powered by Amazon Bedrock (Claude 3.5 Sonnet).

## Prerequisites
- AWS Account (create one at https://aws.amazon.com if you don't have one)
- AWS CLI installed (optional but recommended)
- Access to AWS Console

---

## Step 1: Create AWS Account (If You Don't Have One)

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the registration process:
   - Provide email and password
   - Enter contact information
   - Add payment method (required but you'll use free tier)
   - Verify identity via phone
   - Select support plan (Basic - Free)

---

## Step 2: Enable Amazon Bedrock Model Access

### 2.1 Navigate to Bedrock Console
1. Log in to AWS Console: https://console.aws.amazon.com
2. In the search bar, type "Bedrock"
3. Click on "Amazon Bedrock"
4. Make sure you're in the correct region (us-east-1 recommended)

### 2.2 Request Model Access
1. In the left sidebar, click "Model access"
2. Click "Manage model access" or "Request model access"
3. Find "Anthropic" in the list
4. Check the box for "Claude 3.5 Sonnet v2"
5. Click "Request model access" or "Save changes"
6. Wait for approval (usually instant, but can take a few minutes)

### 2.3 Verify Access
- Status should show "Access granted" with a green checkmark
- If pending, wait a few minutes and refresh

---

## Step 3: Create IAM User for Krishi Era

### 3.1 Navigate to IAM
1. In AWS Console search bar, type "IAM"
2. Click on "IAM" (Identity and Access Management)

### 3.2 Create New User
1. Click "Users" in the left sidebar
2. Click "Create user"
3. Enter username: `krishi-era-app`
4. Click "Next"

### 3.3 Set Permissions
1. Select "Attach policies directly"
2. Search for and select these policies:
   - `AmazonBedrockFullAccess` (for AI features)
   - `AmazonDynamoDBFullAccess` (for database)
   - `AmazonS3FullAccess` (for file storage)
   - `AmazonSNSFullAccess` (for notifications)
   - `AmazonRekognitionFullAccess` (for image analysis)
3. Click "Next"
4. Review and click "Create user"

### 3.4 Create Access Keys
1. Click on the newly created user `krishi-era-app`
2. Go to "Security credentials" tab
3. Scroll down to "Access keys"
4. Click "Create access key"
5. Select "Application running outside AWS"
6. Click "Next"
7. Add description: "Krishi Era Backend"
8. Click "Create access key"
9. **IMPORTANT**: Copy both:
   - Access key ID (starts with AKIA...)
   - Secret access key (shown only once!)
10. Click "Download .csv file" for backup
11. Click "Done"

---

## Step 4: Configure Krishi Era Backend

### 4.1 Update backend/.env File

Open `backend/.env` and update these values:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here

# AI Configuration
USE_BEDROCK=true
```

### 4.2 Verify Configuration

Create a test script `backend/scripts/test-bedrock.ts`:

```typescript
import { bedrockService } from '../src/services/aws/bedrock.service';

async function testBedrock() {
  console.log('🧪 Testing AWS Bedrock Connection\n');

  try {
    // Test if Bedrock is enabled
    const isEnabled = bedrockService.isEnabled();
    console.log(`✅ Bedrock Enabled: ${isEnabled}\n`);

    if (!isEnabled) {
      console.log('❌ Bedrock is not enabled. Check your .env configuration.');
      return;
    }

    // Test crop recommendations
    console.log('Test 1: Crop Recommendations...');
    const cropRec = await bedrockService.getCropRecommendations({
      landSize: 5,
      soilType: 'Loamy',
      location: 'Punjab',
      waterAvailability: 'High',
      budget: 50000,
      season: 'Kharif'
    });
    console.log('✅ Crop Recommendations:', JSON.stringify(cropRec, null, 2));
    console.log('');

    // Test selling strategy
    console.log('Test 2: Selling Strategy...');
    const strategy = await bedrockService.getSellingStrategy({
      cropType: 'Wheat',
      expectedYield: 100,
      yieldUnit: 'quintal',
      harvestMonth: 'April',
      currentMarketPrice: 2200,
      storageAvailable: true,
      location: 'Punjab'
    });
    console.log('✅ Selling Strategy:', JSON.stringify(strategy, null, 2));
    console.log('');

    console.log('✅ All tests passed! AWS Bedrock is working correctly.');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

testBedrock();
```

Run the test:
```bash
cd backend
npx ts-node scripts/test-bedrock.ts
```

Expected output:
```
🧪 Testing AWS Bedrock Connection

✅ Bedrock Enabled: true

Test 1: Crop Recommendations...
✅ Crop Recommendations: { ... }

Test 2: Selling Strategy...
✅ Selling Strategy: { ... }

✅ All tests passed! AWS Bedrock is working correctly.
```

---

## Step 5: Verify All AI Features

### 5.1 AI Features Using Bedrock

All these features now use AWS Bedrock:

1. **Crop Recommendations** (`POST /api/farmer/crop-recommendations`)
   - Input: Land size, soil type, location, water, budget
   - Output: 4-5 crop suggestions with suitability scores

2. **Selling Strategy** (`POST /api/ai/selling-strategy`)
   - Input: Crop type, yield, harvest month, price, storage
   - Output: Strategic recommendations, price predictions

3. **Harvest Timing** (`POST /api/ai/harvest-timing`)
   - Input: Crop type, planting date, conditions
   - Output: Optimal harvest date, readiness score

4. **Route Optimization** (`POST /api/ai/optimize-route`)
   - Input: Origin, destinations, vehicle type
   - Output: Optimized route, time, cost estimates

5. **Price Analysis** (`POST /api/ai/analyze-prices`)
   - Input: Crop type, region, timeframe
   - Output: Price trends, forecasts, recommendations

6. **Quality Assessment** (`POST /api/ai/assess-quality`)
   - Uses: AWS Rekognition (not Bedrock)
   - Input: Crop image
   - Output: Quality score, defects, recommendations

### 5.2 Test from Frontend

1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Login as farmer
4. Test AI features:
   - Go to "AI Selling Strategy"
   - Fill in crop details
   - Click "Get AI Strategy"
   - Verify you get AI-powered recommendations

---

## Cost Estimation

### Bedrock Pricing (Claude 3.5 Sonnet)
- **Input tokens**: ~$3 per million tokens
- **Output tokens**: ~$15 per million tokens

### Typical Request Costs
- Crop recommendation: ~500 input + 1000 output tokens = **~$0.02 per request**
- Selling strategy: ~400 input + 800 output tokens = **~$0.015 per request**
- Harvest timing: ~300 input + 600 output tokens = **~$0.01 per request**

### Monthly Estimate
For a platform with 1000 farmers making 10 AI requests each per month:
- Total requests: 10,000
- Estimated cost: **$150-200/month**

### Free Tier
- AWS Free Tier includes some Bedrock usage
- First 2 months may have promotional credits
- Check AWS Bedrock pricing page for current offers

---

## Troubleshooting

### Issue 1: "Bedrock is not enabled"

**Symptoms:**
- Logs show "Amazon Bedrock AI service disabled"
- Using fallback recommendations

**Solution:**
1. Check `backend/.env` has `USE_BEDROCK=true`
2. Verify AWS credentials are set correctly
3. Restart backend server

### Issue 2: "Access Denied" or "UnauthorizedException"

**Symptoms:**
- Error: "User is not authorized to perform: bedrock:InvokeModel"

**Solution:**
1. Go to IAM → Users → krishi-era-app
2. Check "Permissions" tab
3. Ensure `AmazonBedrockFullAccess` policy is attached
4. If not, click "Add permissions" → "Attach policies directly"
5. Search for and attach `AmazonBedrockFullAccess`

### Issue 3: "Model access not granted"

**Symptoms:**
- Error: "You don't have access to the model"

**Solution:**
1. Go to Bedrock Console
2. Click "Model access" in left sidebar
3. Verify "Claude 3.5 Sonnet v2" shows "Access granted"
4. If not, request access again
5. Wait a few minutes for approval

### Issue 4: "Region not supported"

**Symptoms:**
- Error: "Bedrock is not available in this region"

**Solution:**
1. Change `AWS_REGION` in `backend/.env` to:
   - `us-east-1` (N. Virginia) - Recommended
   - `us-west-2` (Oregon)
   - `eu-west-1` (Ireland)
2. Restart backend server

### Issue 5: High costs

**Solution:**
1. Implement caching for common queries
2. Add rate limiting per user
3. Use fallback mode for non-critical requests
4. Monitor usage in AWS Cost Explorer

---

## Security Best Practices

### 1. Never Commit Credentials
- Add `backend/.env` to `.gitignore`
- Never share access keys publicly
- Use environment variables in production

### 2. Rotate Access Keys Regularly
- Rotate keys every 90 days
- Create new key before deleting old one
- Update `.env` with new credentials

### 3. Use IAM Roles in Production
- For EC2/ECS deployments, use IAM roles instead of access keys
- Attach policies to the role
- No need to store credentials in `.env`

### 4. Monitor Usage
- Set up AWS CloudWatch alarms
- Monitor Bedrock API calls
- Set billing alerts

### 5. Principle of Least Privilege
- Only grant necessary permissions
- Use specific policies instead of `*FullAccess` in production
- Review permissions regularly

---

## Production Deployment

### Option 1: EC2 with IAM Role
```bash
# Create IAM role with Bedrock permissions
# Attach role to EC2 instance
# No need for access keys in .env
```

### Option 2: ECS/Fargate
```bash
# Create task execution role
# Add Bedrock permissions
# Configure task definition
```

### Option 3: Lambda
```bash
# Create Lambda function
# Attach IAM role with Bedrock permissions
# Deploy backend as Lambda
```

---

## Monitoring and Logging

### CloudWatch Logs
1. Go to CloudWatch Console
2. Check "Log groups"
3. Look for Bedrock API calls
4. Monitor errors and latency

### Cost Monitoring
1. Go to AWS Cost Explorer
2. Filter by service: "Bedrock"
3. View daily/monthly costs
4. Set up billing alerts

### Usage Metrics
- Track API calls per day
- Monitor token usage
- Analyze response times
- Identify popular features

---

## Summary Checklist

- [ ] AWS account created
- [ ] Bedrock model access granted (Claude 3.5 Sonnet)
- [ ] IAM user created with proper permissions
- [ ] Access keys generated and saved
- [ ] `backend/.env` updated with credentials
- [ ] `USE_BEDROCK=true` set
- [ ] Test script run successfully
- [ ] Frontend AI features tested
- [ ] Billing alerts configured
- [ ] Security best practices followed

---

## Support Resources

- **AWS Bedrock Documentation**: https://docs.aws.amazon.com/bedrock/
- **AWS Support**: https://console.aws.amazon.com/support/
- **Pricing Calculator**: https://calculator.aws/
- **IAM Best Practices**: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

---

**Status**: Ready for AWS account connection
**Last Updated**: March 8, 2026
**AI Provider**: AWS Bedrock (Claude 3.5 Sonnet v2)

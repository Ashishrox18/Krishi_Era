# AWS Deployment Cost Breakdown

## 💰 All Costs Are MONTHLY (Per Month)

---

## Option 1: Amplify + ECS Fargate (RECOMMENDED) ⭐

### Monthly Cost Breakdown

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **AWS Amplify Hosting** | Frontend hosting, 100 build minutes, 15GB served | $0 - $5 |
| **ECS Fargate** | 1 task, 0.5 vCPU, 1GB RAM, 24/7 | $14.78 |
| **Application Load Balancer** | 1 ALB, basic traffic | $16.20 |
| **DynamoDB** | 25GB storage, moderate reads/writes | $0 - $10 |
| **S3** | 5GB storage, 10K requests | $0.12 |
| **SNS** | 100K notifications | $0 (free tier) |
| **CloudWatch Logs** | 5GB logs | $2.50 |
| **ECR** | 2GB container images | $0.20 |
| **Data Transfer** | 10GB outbound | $0.90 |

### Total Monthly Cost: **$34.70 - $49.70**

**For Demo/Hackathon (1 week):** ~$8-12  
**For 1 Month:** $35-50  
**For 3 Months:** $105-150  
**For 1 Year:** $420-600

---

## Option 2: Amplify + Lambda (Budget Option)

### Monthly Cost Breakdown

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **AWS Amplify Hosting** | Frontend hosting | $0 - $5 |
| **API Gateway** | 1M requests | $3.50 |
| **Lambda** | 1M requests, 512MB, 3s avg | $0 - $5 |
| **DynamoDB** | Same as above | $0 - $10 |
| **S3** | Same as above | $0.12 |
| **SNS** | Same as above | $0 |
| **CloudWatch Logs** | 5GB logs | $2.50 |
| **Data Transfer** | 10GB outbound | $0.90 |

### Total Monthly Cost: **$6.90 - $26.90**

**BUT:** Has cold start issues (1-5 second delays)

**For Demo/Hackathon (1 week):** ~$2-7  
**For 1 Month:** $7-27  
**For 3 Months:** $21-81  
**For 1 Year:** $84-324

---

## Option 3: EC2 (Traditional)

### Monthly Cost Breakdown

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **EC2 Instance** | t3.small (2 vCPU, 2GB RAM) | $15.18 |
| **EBS Volume** | 30GB gp3 | $2.40 |
| **Application Load Balancer** | 1 ALB | $16.20 |
| **Elastic IP** | 1 static IP (attached) | $0 |
| **DynamoDB** | Same as above | $0 - $10 |
| **S3** | Same as above | $0.12 |
| **CloudWatch** | Same as above | $2.50 |
| **Data Transfer** | 10GB outbound | $0.90 |

### Total Monthly Cost: **$37.30 - $47.30**

**For Demo/Hackathon (1 week):** ~$9-12  
**For 1 Month:** $37-47  
**For 3 Months:** $111-141  
**For 1 Year:** $444-564

---

## Cost Comparison by Duration

### For Hackathon/Demo (1 Week)

| Option | 1 Week Cost | Cold Starts? | Always On? |
|--------|-------------|--------------|------------|
| Lambda | **$2-7** | ❌ Yes (1-5s) | No |
| **Fargate** ⭐ | **$8-12** | ✅ No | ✅ Yes |
| EC2 | $9-12 | ✅ No | ✅ Yes |

### For 1 Month

| Option | 1 Month Cost | Cold Starts? | Always On? |
|--------|--------------|--------------|------------|
| Lambda | $7-27 | ❌ Yes | No |
| **Fargate** ⭐ | **$35-50** | ✅ No | ✅ Yes |
| EC2 | $37-47 | ✅ No | ✅ Yes |

### For 3 Months

| Option | 3 Months Cost | Cold Starts? | Always On? |
|--------|---------------|--------------|------------|
| Lambda | $21-81 | ❌ Yes | No |
| **Fargate** ⭐ | **$105-150** | ✅ No | ✅ Yes |
| EC2 | $111-141 | ✅ No | ✅ Yes |

### For 1 Year

| Option | 1 Year Cost | Cold Starts? | Always On? |
|--------|-------------|--------------|------------|
| Lambda | $84-324 | ❌ Yes | No |
| **Fargate** ⭐ | **$420-600** | ✅ No | ✅ Yes |
| EC2 | $444-564 | ✅ No | ✅ Yes |

---

## AWS Free Tier (First 12 Months)

If you're using a NEW AWS account, you get:

### Free Tier Benefits (Monthly)

| Service | Free Tier | Value |
|---------|-----------|-------|
| **Lambda** | 1M requests, 400K GB-seconds | ~$20 |
| **DynamoDB** | 25GB storage, 25 read/write units | ~$25 |
| **S3** | 5GB storage, 20K GET, 2K PUT | ~$1 |
| **EC2** | 750 hours t2.micro/t3.micro | ~$8 |
| **CloudWatch** | 10 custom metrics, 5GB logs | ~$5 |
| **Data Transfer** | 100GB outbound | ~$9 |

**Total Free Tier Value:** ~$68/month

### With Free Tier (First Year)

| Option | Monthly Cost (with Free Tier) |
|--------|-------------------------------|
| Lambda | **$0-5** (almost free!) |
| Fargate | **$31-35** (ALB not free) |
| EC2 | **$18-22** (ALB not free) |

---

## Cost Optimization Tips

### 1. Use Free Tier Wisely
- New AWS accounts get 12 months free tier
- Lambda is almost free with free tier
- DynamoDB free tier covers demo usage

### 2. Stop When Not Needed
```bash
# Stop ECS service when not demoing
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 0

# Start when needed
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 1
```

**Savings:** ~$15/month when stopped

### 3. Use Spot Instances (Advanced)
- 70% cheaper than on-demand
- Good for non-critical workloads
- Requires handling interruptions

### 4. Set Billing Alarms
```bash
# Alert when cost exceeds $50
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alarm \
  --alarm-description "Alert when bill exceeds $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

### 5. Clean Up Unused Resources
- Delete old ECR images
- Remove unused S3 objects
- Delete CloudWatch log groups
- Remove unused DynamoDB tables

---

## Real-World Cost Examples

### Scenario 1: Hackathon Demo (1 Week)
**Usage:** 8 hours/day for 7 days  
**Users:** 10-20 judges/testers  
**Requests:** ~10K total

**Recommended:** Lambda  
**Cost:** **$2-5 for the week**

### Scenario 2: Pilot Program (3 Months)
**Usage:** 24/7 availability  
**Users:** 100 active users  
**Requests:** ~500K/month

**Recommended:** Fargate  
**Cost:** **$105-150 for 3 months** ($35-50/month)

### Scenario 3: Production (1 Year)
**Usage:** 24/7 availability  
**Users:** 1000+ active users  
**Requests:** ~5M/month

**Recommended:** Fargate with auto-scaling  
**Cost:** **$600-1200 for 1 year** ($50-100/month)

---

## Hidden Costs to Watch

### Data Transfer
- First 100GB/month: FREE (with free tier)
- Next 10TB/month: $0.09/GB
- **Tip:** Use CloudFront CDN to reduce costs

### DynamoDB
- On-Demand: $1.25 per million writes, $0.25 per million reads
- Provisioned: Cheaper for predictable traffic
- **Tip:** Use on-demand for demo, provisioned for production

### CloudWatch Logs
- $0.50/GB ingested
- $0.03/GB stored
- **Tip:** Set log retention to 7 days for demo

### NAT Gateway (if using private subnets)
- $0.045/hour = $32.40/month
- $0.045/GB processed
- **Tip:** Use public subnets for demo to avoid this cost

---

## Budget Recommendations

### For Hackathon/Demo
**Budget:** $50-100 for the event  
**Recommended:** Lambda (cheapest) or Fargate (best performance)  
**Duration:** 1-2 weeks

### For Pilot/Testing
**Budget:** $100-200 for 3 months  
**Recommended:** Fargate  
**Duration:** 3 months

### For Production
**Budget:** $500-1000 for first year  
**Recommended:** Fargate with auto-scaling  
**Duration:** 1 year

---

## Cost Monitoring

### Set Up Budget Alerts

```bash
# Create budget
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget '{
    "BudgetName": "Krishi-Era-Monthly",
    "BudgetLimit": {
      "Amount": "50",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "your-email@example.com"
    }]
  }]'
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

## Summary

### Best Value for Money

| Use Case | Recommended | Monthly Cost | Why |
|----------|-------------|--------------|-----|
| **Hackathon (1 week)** | Lambda | $2-7 | Cheapest, free tier |
| **Demo (1 month)** | Fargate | $35-50 | Always on, no cold starts |
| **Pilot (3 months)** | Fargate | $35-50 | Reliable, scalable |
| **Production (1 year)** | Fargate | $50-100 | Production-ready |

### My Recommendation: **ECS Fargate**

**Why:**
- ✅ Only $35-50/month (affordable)
- ✅ No cold starts (always responsive)
- ✅ Perfect for demos and production
- ✅ Easy to scale
- ✅ Predictable costs

**Total Cost for Hackathon:**
- 1 week: ~$8-12
- 1 month: ~$35-50
- 3 months: ~$105-150

---

## Questions?

**Q: Can I reduce costs further?**  
A: Yes! Use Lambda for hackathon ($2-7/week), stop services when not needed, use free tier.

**Q: What if I exceed budget?**  
A: Set up billing alarms, use AWS Budgets, stop services immediately.

**Q: Is there a free option?**  
A: Lambda with free tier is almost free for demos (~$0-5/month).

**Q: Can I get AWS credits?**  
A: Yes! Apply for AWS Activate credits (up to $1000 for startups).

---

Ready to deploy? The costs are clear and manageable! 🚀

# HTTPS Setup for Backend API

## Problem
Frontend is served over HTTPS (Amplify), but backend API uses HTTP. Browsers block mixed content (HTTPS → HTTP).

## Solutions

### Option 1: Use Amplify Rewrites (Recommended - Quick Fix)

Configure Amplify to proxy API requests through HTTPS.

#### Step 1: Add Rewrite Rules in Amplify Console

1. Go to Amplify Console: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d3o65ri2eglx5a
2. Click on your app → **App settings** → **Rewrites and redirects**
3. Click **Add rule** and add:

```
Source: /api/<*>
Target: http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/api/<*>
Type: 200 (Rewrite - proxy)
```

4. Click **Save**

#### Step 2: Update Frontend API URL

Update `.env.production`:
```bash
VITE_API_BASE_URL=/api
```

This makes the frontend use relative URLs, which Amplify will proxy to the backend.

#### Step 3: Redeploy Frontend

```bash
git add .env.production amplify.yml
git commit -m "Configure Amplify proxy for API requests"
git push origin feature/deployment
```

---

### Option 2: Enable HTTPS on Load Balancer (Proper Solution)

This requires a custom domain with SSL certificate.

#### Prerequisites
- Custom domain (e.g., api.krishiera.com)
- Domain registered in Route 53 or external registrar

#### Step 1: Request SSL Certificate

```bash
# Request certificate for your domain
aws acm request-certificate \
  --domain-name api.krishiera.com \
  --validation-method DNS \
  --region us-east-1
```

#### Step 2: Validate Certificate

1. Go to ACM Console
2. Click on the certificate
3. Add the CNAME records to your DNS

#### Step 3: Add HTTPS Listener to ALB

```bash
# Get certificate ARN
CERT_ARN=$(aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[0].CertificateArn' --output text)

# Add HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:120569622669:loadbalancer/app/krishi-era-alb/d53e5e4b83f0c5f3 \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:120569622669:targetgroup/krishi-backend-tg/8237f1c017c88936 \
  --region us-east-1
```

#### Step 4: Update Route 53

```bash
# Create A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.krishiera.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "krishi-era-alb-536422943.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

#### Step 5: Update Frontend

```bash
# Update .env.production
VITE_API_BASE_URL=https://api.krishiera.com/api
```

---

### Option 3: Temporary Workaround (Development Only)

For testing purposes only, you can temporarily allow mixed content in your browser:

**Chrome:**
1. Click the shield icon in the address bar
2. Click "Load unsafe scripts"

**NOT RECOMMENDED FOR PRODUCTION**

---

## Recommended Approach

**For now: Use Option 1 (Amplify Rewrites)**
- Quick to set up (5 minutes)
- No custom domain needed
- Works immediately
- Free

**For production: Use Option 2 (Custom Domain + HTTPS)**
- Professional setup
- Better performance
- Custom branding
- Requires domain (~$12/year)

---

## Implementation: Option 1 (Quick Fix)

Let me implement Option 1 for you right now:

### 1. Update Environment Variable in Amplify

```bash
aws amplify update-app \
  --app-id d3o65ri2eglx5a \
  --environment-variables VITE_API_BASE_URL=/api \
  --region us-east-1
```

### 2. Add Rewrite Rule

Go to Amplify Console and add the rewrite rule manually (AWS CLI doesn't support this yet).

Or use the Amplify Console UI:
1. https://console.aws.amazon.com/amplify/home?region=us-east-1#/d3o65ri2eglx5a
2. App settings → Rewrites and redirects
3. Add rule:
   - Source: `/api/<*>`
   - Target: `http://krishi-era-alb-536422943.us-east-1.elb.amazonaws.com/api/<*>`
   - Type: `200 (Rewrite - proxy)`

### 3. Redeploy

The app will automatically redeploy when you add the rewrite rule.

---

## Testing

After setup, test the API:

```bash
# Should work over HTTPS
curl https://feature-deployment.d3o65ri2eglx5a.amplifyapp.com/api/health
```

---

## Cost Impact

- **Option 1 (Amplify Proxy):** No additional cost
- **Option 2 (Custom Domain + HTTPS):** 
  - Domain: ~$12/year
  - SSL Certificate (ACM): Free
  - Route 53: ~$0.50/month

---

## Next Steps

1. Implement Option 1 (Amplify rewrites) for immediate fix
2. Plan for Option 2 (custom domain) for production
3. Test the application thoroughly
4. Monitor for any CORS or proxy issues

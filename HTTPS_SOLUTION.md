# HTTPS Solution for Mixed Content Error

## Problem
- Frontend: HTTPS (Amplify)
- Backend: HTTP (ALB)
- Browser blocks mixed content (HTTPS → HTTP)
- Amplify proxy requires HTTPS backend

## Solutions

### Solution 1: Enable HTTPS on Load Balancer (Recommended)

We need to add an HTTPS listener to your ALB. Since we don't have a custom domain, we'll use AWS Certificate Manager's default certificate.

#### Step 1: Create Self-Signed Certificate for Testing

```bash
# This won't work for production but allows testing
# We'll need a proper domain for production
```

#### Step 2: Add HTTPS Listener to ALB

Since we can't get a valid certificate for `*.elb.amazonaws.com`, we have two options:

**Option A: Get a custom domain (Recommended for production)**
- Register a domain (e.g., api.krishiera.com) - $12/year
- Request ACM certificate
- Add HTTPS listener
- Update frontend to use https://api.krishiera.com

**Option B: Use CloudFront in front of ALB (Free)**
- CloudFront provides free SSL
- Acts as HTTPS proxy to HTTP backend
- No custom domain needed

### Solution 2: Use CloudFront (Quick & Free)

This is the fastest solution without needing a custom domain.

#### Create CloudFront Distribution

```bash
# Create distribution
aws cloudfront create-distribution \
  --origin-domain-name krishi-era-alb-536422943.us-east-1.elb.amazonaws.com \
  --default-root-object "" \
  --query 'Distribution.{Id:Id,DomainName:DomainName}' \
  --output json \
  --distribution-config '{
    "CallerReference": "krishi-backend-'$(date +%s)'",
    "Comment": "Krishi Era Backend HTTPS",
    "Enabled": true,
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "krishi-alb",
        "DomainName": "krishi-era-alb-536422943.us-east-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
          }
        }
      }]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "krishi-alb",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": {
        "Quantity": 7,
        "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        "CachedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"]
        }
      },
      "ForwardedValues": {
        "QueryString": true,
        "Cookies": {"Forward": "all"},
        "Headers": {
          "Quantity": 3,
          "Items": ["Authorization", "Content-Type", "Accept"]
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 0,
      "MaxTTL": 0,
      "Compress": true
    }
  }'
```

This will give you a CloudFront URL like: `https://d1234567890.cloudfront.net`

#### Update Frontend

```bash
# Update Amplify environment variable
aws amplify update-app \
  --app-id d3o65ri2eglx5a \
  --environment-variables VITE_API_BASE_URL=https://YOUR_CLOUDFRONT_URL/api \
  --region us-east-1
```

#### Update Backend CORS

Add CloudFront domain to CORS:
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://feature-deployment.d3o65ri2eglx5a.amplifyapp.com',
    'https://d3o65ri2eglx5a.amplifyapp.com'
  ],
  credentials: true
}));
```

### Solution 3: Temporary Browser Workaround (Testing Only)

For immediate testing, you can temporarily allow mixed content:

**Chrome:**
1. Click the shield icon in address bar
2. Click "Load unsafe scripts"

**Firefox:**
1. Click the lock icon
2. Click "Disable protection for now"

**NOT RECOMMENDED FOR PRODUCTION**

---

## Recommended Implementation

For your case, I recommend **Solution 2 (CloudFront)** because:
- ✅ Free (no additional cost)
- ✅ No custom domain needed
- ✅ Provides HTTPS immediately
- ✅ Improves performance (CDN caching)
- ✅ Works with existing setup

Let me implement this for you.

---

## Cost Comparison

| Solution | Setup Time | Monthly Cost | Custom Domain |
|----------|-----------|--------------|---------------|
| CloudFront | 10 min | $0-1 | No |
| Custom Domain + HTTPS | 30 min | $1-2 | Yes ($12/year) |
| Browser Workaround | 1 min | $0 | No |

---

## Implementation Steps (CloudFront)

I'll create a script to set this up automatically.

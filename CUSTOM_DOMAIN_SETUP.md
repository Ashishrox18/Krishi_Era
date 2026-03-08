# Custom Domain Setup Guide

## Overview

Setting up custom domains for your application:
- **Frontend:** `krishiera.com` or `www.krishiera.com`
- **Backend API:** `api.krishiera.com`

## Prerequisites

You need to purchase a domain. Options:
1. **Route 53** (AWS) - $12-15/year
2. **Namecheap** - $8-12/year
3. **GoDaddy** - $10-15/year
4. **Google Domains** - $12/year

---

## Option 1: Buy Domain via Route 53 (Easiest with AWS)

### Step 1: Register Domain

```bash
# Check if domain is available
aws route53domains check-domain-availability \
  --domain-name krishiera.com \
  --region us-east-1

# Register domain (example)
aws route53domains register-domain \
  --domain-name krishiera.com \
  --duration-in-years 1 \
  --admin-contact FirstName=John,LastName=Doe,ContactType=PERSON,AddressLine1="123 Main St",City=Seattle,State=WA,CountryCode=US,ZipCode=98101,PhoneNumber=+1.2065551234,Email=john@example.com \
  --registrant-contact FirstName=John,LastName=Doe,ContactType=PERSON,AddressLine1="123 Main St",City=Seattle,State=WA,CountryCode=US,ZipCode=98101,PhoneNumber=+1.2065551234,Email=john@example.com \
  --tech-contact FirstName=John,LastName=Doe,ContactType=PERSON,AddressLine1="123 Main St",City=Seattle,State=WA,CountryCode=US,ZipCode=98101,PhoneNumber=+1.2065551234,Email=john@example.com \
  --region us-east-1
```

Or use the AWS Console:
1. Go to Route 53: https://console.aws.amazon.com/route53/
2. Click "Register Domain"
3. Search for your domain
4. Complete registration (~$12/year)

### Step 2: Create Hosted Zone (Automatic with Route 53)

If you registered via Route 53, a hosted zone is created automatically.

---

## Option 2: Use External Domain (Namecheap, GoDaddy, etc.)

### Step 1: Buy Domain from Registrar

Go to Namecheap, GoDaddy, or your preferred registrar and purchase a domain.

### Step 2: Create Hosted Zone in Route 53

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name krishiera.com \
  --caller-reference $(date +%s) \
  --region us-east-1
```

This will give you 4 nameservers like:
- ns-1234.awsdns-12.org
- ns-5678.awsdns-34.com
- ns-9012.awsdns-56.net
- ns-3456.awsdns-78.co.uk

### Step 3: Update Nameservers at Registrar

1. Log into your domain registrar (Namecheap, GoDaddy, etc.)
2. Find DNS settings for your domain
3. Change nameservers to the 4 AWS nameservers from Step 2
4. Wait 24-48 hours for propagation (usually faster)

---

## Setup Backend API Domain (api.krishiera.com)

### Step 1: Request SSL Certificate

```bash
# Request certificate for API subdomain
aws acm request-certificate \
  --domain-name api.krishiera.com \
  --validation-method DNS \
  --region us-east-1 \
  --query 'CertificateArn' \
  --output text
```

Save the Certificate ARN output.

### Step 2: Validate Certificate

```bash
# Get validation records
aws acm describe-certificate \
  --certificate-arn YOUR_CERT_ARN \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
  --output json
```

This will give you a CNAME record to add to Route 53.

### Step 3: Add Validation Record to Route 53

```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='krishiera.com.'].Id" \
  --output text | cut -d'/' -f3)

# Add validation CNAME record (replace with your values)
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_abc123.api.krishiera.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_xyz789.acm-validations.aws."}]
      }
    }]
  }'
```

Wait 5-10 minutes for validation to complete.

### Step 4: Add HTTPS Listener to Load Balancer

```bash
# Get certificate ARN
CERT_ARN=$(aws acm list-certificates \
  --region us-east-1 \
  --query 'CertificateSummaryList[?DomainName==`api.krishiera.com`].CertificateArn' \
  --output text)

# Add HTTPS listener to ALB
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:120569622669:loadbalancer/app/krishi-era-alb/d53e5e4b83f0c5f3 \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:120569622669:targetgroup/krishi-backend-tg/8237f1c017c88936 \
  --region us-east-1
```

### Step 5: Create DNS Record for API

```bash
# Get ALB hosted zone ID (this is always the same for us-east-1)
ALB_ZONE_ID="Z35SXDOTRQ7X7K"

# Create A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.krishiera.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "'$ALB_ZONE_ID'",
          "DNSName": "krishi-era-alb-536422943.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

### Step 6: Update Backend CORS

```typescript
// backend/src/server.ts
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://krishiera.com',
    'https://www.krishiera.com',
    'https://feature-deployment.d3o65ri2eglx5a.amplifyapp.com',
    'https://d3o65ri2eglx5a.amplifyapp.com'
  ],
  credentials: true
}));
```

Redeploy backend.

### Step 7: Update Frontend API URL

```bash
# Update Amplify environment variable
aws amplify update-app \
  --app-id d3o65ri2eglx5a \
  --environment-variables VITE_API_BASE_URL=https://api.krishiera.com/api \
  --region us-east-1
```

---

## Setup Frontend Domain (krishiera.com)

### Step 1: Add Domain in Amplify Console

1. Go to Amplify Console: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d3o65ri2eglx5a
2. Click **App settings** → **Domain management**
3. Click **Add domain**
4. Enter your domain: `krishiera.com`
5. Amplify will automatically:
   - Request SSL certificate
   - Configure subdomains (www, etc.)
   - Provide DNS records

### Step 2: Add DNS Records

Amplify will show you the records to add. Typically:

```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='krishiera.com.'].Id" \
  --output text | cut -d'/' -f3)

# Add A record for root domain (replace with Amplify's values)
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "krishiera.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d3o65ri2eglx5a.amplifyapp.com",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'

# Add CNAME for www
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.krishiera.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d3o65ri2eglx5a.amplifyapp.com"}]
      }
    }]
  }'
```

---

## Complete Setup Script

I'll create an automated script for you:

```bash
#!/bin/bash

DOMAIN="krishiera.com"
API_SUBDOMAIN="api.$DOMAIN"

echo "🌐 Custom Domain Setup for Krishi Era"
echo "======================================"
echo ""
echo "Domain: $DOMAIN"
echo "API: $API_SUBDOMAIN"
echo ""

# Step 1: Check if hosted zone exists
echo "📋 Checking hosted zone..."
ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='$DOMAIN.'].Id" \
  --output text | cut -d'/' -f3)

if [ -z "$ZONE_ID" ]; then
  echo "❌ Hosted zone not found. Please create it first."
  echo "Run: aws route53 create-hosted-zone --name $DOMAIN --caller-reference $(date +%s)"
  exit 1
fi

echo "✅ Found hosted zone: $ZONE_ID"

# Step 2: Request certificate
echo ""
echo "🔒 Requesting SSL certificate..."
CERT_ARN=$(aws acm request-certificate \
  --domain-name $API_SUBDOMAIN \
  --validation-method DNS \
  --region us-east-1 \
  --query 'CertificateArn' \
  --output text)

echo "✅ Certificate requested: $CERT_ARN"
echo ""
echo "⏳ Waiting for validation records..."
sleep 10

# Step 3: Get validation record
VALIDATION=$(aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
  --output json)

VALIDATION_NAME=$(echo $VALIDATION | jq -r '.Name')
VALIDATION_VALUE=$(echo $VALIDATION | jq -r '.Value')

echo "📝 Validation record:"
echo "  Name: $VALIDATION_NAME"
echo "  Value: $VALIDATION_VALUE"

# Step 4: Add validation record
echo ""
echo "➕ Adding validation record to Route 53..."
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "'$VALIDATION_NAME'",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$VALIDATION_VALUE'"}]
      }
    }]
  }' > /dev/null

echo "✅ Validation record added"
echo ""
echo "⏳ Waiting for certificate validation (this may take 5-10 minutes)..."
echo "You can check status with:"
echo "aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1"
echo ""
echo "Once validated, run the next steps to:"
echo "1. Add HTTPS listener to ALB"
echo "2. Create DNS record for API"
echo "3. Update frontend configuration"
```

---

## Cost Summary

| Item | Cost |
|------|------|
| Domain Registration | $12/year |
| Route 53 Hosted Zone | $0.50/month |
| SSL Certificate (ACM) | Free |
| DNS Queries | ~$0.40/month |
| **Total** | **~$13/year + $1/month** |

---

## Testing

After setup, test your domains:

```bash
# Test API
curl https://api.krishiera.com/health

# Test frontend
open https://krishiera.com
```

---

## Troubleshooting

### Certificate validation stuck
- Check DNS records are correct
- Wait up to 30 minutes
- Verify nameservers are propagated

### Domain not resolving
- Check DNS propagation: https://dnschecker.org
- Verify Route 53 records
- Wait 24-48 hours for full propagation

### HTTPS not working
- Verify certificate is validated
- Check ALB listener is configured
- Ensure security groups allow port 443

---

## Next Steps

1. Purchase domain
2. Run setup script
3. Wait for DNS propagation
4. Update application URLs
5. Test thoroughly

Would you like me to help you set this up?

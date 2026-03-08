# krishiai.in Domain Setup Status

## ✅ Completed Steps

1. **Hosted Zone Found:** Z00113231Y82SSVG01924
2. **SSL Certificate Requested:** arn:aws:acm:us-east-1:120569622669:certificate/3cacc7aa-aabf-4204-9207-5cf8852da907
3. **DNS Validation Record Added:** `_a495289ba8664e3f919ec37fdbacec18.api.krishiai.in` ✅ Verified in Route 53
4. **DNS A Record Created:** `api.krishiai.in` → Load Balancer
5. **Backend CORS Updated:** Added https://krishiai.in and https://www.krishiai.in

## ⏳ Pending

### Certificate Validation (Currently: PENDING_VALIDATION)
The SSL certificate is waiting for DNS validation to complete. The DNS record is properly configured, just waiting for propagation.

**Quick Check:**
```bash
./check-cert-and-deploy.sh
```

**Or manually:**
```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:120569622669:certificate/3cacc7aa-aabf-4204-9207-5cf8852da907 \
  --region us-east-1 \
  --query 'Certificate.Status' \
  --output text
```

When it shows `ISSUED`, the script will automatically create the HTTPS listener.

---

## 📋 Automated Next Steps

Once the certificate is validated (status = ISSUED), run:

```bash
./check-cert-and-deploy.sh
```

This script will:
1. Check certificate status
2. Create HTTPS listener on ALB (port 443)
3. Provide next steps

Then deploy the updated backend:

```bash
./update-backend-cors.sh
```

This will:
1. Build Docker image with updated CORS
2. Push to ECR
3. Force new ECS deployment
4. Wait for service to stabilize

---

## 📋 Manual Steps (If Needed)

### Step 1: Add HTTPS Listener to Load Balancer

Once the certificate is validated (status = ISSUED), run:

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:120569622669:loadbalancer/app/krishi-era-alb/d53e5e4b83f0c5f3 \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:120569622669:certificate/3cacc7aa-aabf-4204-9207-5cf8852da907 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:120569622669:targetgroup/krishi-backend-tg/8237f1c017c88936 \
  --region us-east-1
```

### Step 2: Update Backend CORS

Edit `backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://krishiai.in',
    'https://www.krishiai.in',
    'https://feature-deployment.d3o65ri2eglx5a.amplifyapp.com',
    'https://d3o65ri2eglx5a.amplifyapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Then redeploy:
```bash
# Build Docker image
docker build --platform linux/amd64 -t krishi-era-backend:latest backend/

# Tag and push
docker tag krishi-era-backend:latest 120569622669.dkr.ecr.us-east-1.amazonaws.com/krishi-era-backend:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 120569622669.dkr.ecr.us-east-1.amazonaws.com
docker push 120569622669.dkr.ecr.us-east-1.amazonaws.com/krishi-era-backend:latest

# Force new deployment
aws ecs update-service --cluster krishi-era-cluster --service krishi-backend-service --force-new-deployment --region us-east-1
```

### Step 3: Update Frontend API URL

```bash
aws amplify update-app \
  --app-id d3o65ri2eglx5a \
  --environment-variables VITE_API_BASE_URL=https://api.krishiai.in/api \
  --region us-east-1
```

### Step 4: Add Custom Domain to Amplify (Frontend)

1. Go to Amplify Console: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d3o65ri2eglx5a
2. Click **App settings** → **Domain management**
3. Click **Add domain**
4. Enter: `krishiai.in`
5. Amplify will provide DNS records to add
6. Add those records to Route 53 (or Amplify can do it automatically if using Route 53)

---

## 🧪 Testing

### Test Backend API (after HTTPS listener is added)
```bash
curl https://api.krishiai.in/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-08T..."
}
```

### Test Frontend (after Amplify domain is configured)
```bash
open https://krishiai.in
```

---

## 📊 Timeline

| Step | Status | Time |
|------|--------|------|
| Hosted Zone | ✅ Complete | Done |
| SSL Certificate Request | ✅ Complete | Done |
| DNS Validation Record | ✅ Complete | Done |
| Certificate Validation | ⏳ Pending | 5-30 min |
| HTTPS Listener | ⏳ Waiting | After cert |
| Backend Update | ⏳ Waiting | 5 min |
| Frontend Config | ⏳ Waiting | 5 min |
| DNS Propagation | ⏳ Waiting | 5-30 min |

**Total Time:** ~30-60 minutes

---

## 🔍 Monitoring Certificate Validation

Run this command every few minutes to check:

```bash
watch -n 30 'aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:120569622669:certificate/3cacc7aa-aabf-4204-9207-5cf8852da907 --region us-east-1 --query "Certificate.Status" --output text'
```

Or check manually:
```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:120569622669:certificate/3cacc7aa-aabf-4204-9207-5cf8852da907 \
  --region us-east-1
```

---

## 💰 Cost

- Domain (already owned): $0
- Route 53 Hosted Zone: $0.50/month
- SSL Certificate: Free
- DNS Queries: ~$0.40/month

**Total Additional Cost:** ~$1/month

---

## 🆘 Troubleshooting

### Certificate stuck in PENDING_VALIDATION
- Wait up to 30 minutes
- Check DNS propagation: https://dnschecker.org
- Verify validation record exists in Route 53

### HTTPS not working after setup
- Verify certificate status is ISSUED
- Check HTTPS listener is created
- Ensure security groups allow port 443
- Wait for DNS propagation

---

## 📝 Current Configuration

**Domain:** krishiai.in  
**API Subdomain:** api.krishiai.in  
**Hosted Zone ID:** Z00113231Y82SSVG01924  
**Certificate ARN:** arn:aws:acm:us-east-1:120569622669:certificate/3cacc7aa-aabf-4204-9207-5cf8852da907  
**Load Balancer:** krishi-era-alb-536422943.us-east-1.elb.amazonaws.com  

---

I'll help you complete the remaining steps once the certificate is validated. Check back in 10-15 minutes!

# 🚀 Krishi Era - Final Deployment Steps

## Current Status

✅ Backend deployed to ECS Fargate  
✅ Frontend deployed to Amplify  
✅ SSL certificate requested for api.krishiai.in  
✅ DNS validation record configured  
✅ Backend CORS updated with krishiai.in domains  
⏳ Waiting for certificate validation (5-30 minutes)

---

## What's Happening Now?

The SSL certificate for `api.krishiai.in` is in **PENDING_VALIDATION** status. AWS is verifying domain ownership through the DNS record we added. This is automatic and typically takes 5-30 minutes.

---

## Next Steps (Automated)

### Step 1: Monitor Certificate Validation

Run this to watch the certificate status in real-time:

```bash
./monitor-cert.sh
```

Or check manually:

```bash
./check-cert-and-deploy.sh
```

### Step 2: Once Certificate is ISSUED

The `check-cert-and-deploy.sh` script will automatically:
- Create HTTPS listener on port 443
- Configure SSL certificate on load balancer

### Step 3: Deploy Updated Backend

```bash
./update-backend-cors.sh
```

This will:
- Build Docker image with updated CORS (includes krishiai.in domains)
- Push to ECR
- Force new ECS deployment
- Wait for service to stabilize (~2-3 minutes)

### Step 4: Update Amplify Environment Variable

```bash
aws amplify update-app \
  --app-id d3o65ri2eglx5a \
  --environment-variables VITE_API_BASE_URL=https://api.krishiai.in/api \
  --region us-east-1
```

Then trigger a new build:

```bash
aws amplify start-job \
  --app-id d3o65ri2eglx5a \
  --branch-name feature/deployment \
  --job-type RELEASE \
  --region us-east-1
```

### Step 5: Add Custom Domain to Amplify (Manual)

1. Go to Amplify Console: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d3o65ri2eglx5a
2. Click **App settings** → **Domain management**
3. Click **Add domain**
4. Enter: `krishiai.in`
5. Amplify will automatically configure DNS records in Route 53
6. Wait for domain activation (~15 minutes)

---

## Testing

### Test Backend API (after HTTPS listener is added)

```bash
# Health check
curl https://api.krishiai.in/health

# Expected response:
# {"status":"healthy","timestamp":"2026-03-08T..."}
```

### Test Frontend (after Amplify domain is configured)

```bash
# Open in browser
open https://krishiai.in

# Or test with curl
curl -I https://krishiai.in
```

---

## Timeline

| Step | Status | Estimated Time |
|------|--------|----------------|
| SSL Certificate Request | ✅ Complete | Done |
| DNS Validation Record | ✅ Complete | Done |
| Backend CORS Update | ✅ Complete | Done |
| Certificate Validation | ⏳ In Progress | 5-30 min |
| HTTPS Listener Setup | ⏳ Waiting | 1 min |
| Backend Redeployment | ⏳ Waiting | 3-5 min |
| Amplify Config Update | ⏳ Waiting | 2 min |
| Amplify Domain Setup | ⏳ Waiting | 15-30 min |
| DNS Propagation | ⏳ Waiting | 5-30 min |

**Total Time Remaining:** ~30-60 minutes

---

## Quick Reference

### Infrastructure Details

- **Domain:** krishiai.in
- **API Subdomain:** api.krishiai.in
- **Hosted Zone ID:** Z00113231Y82SSVG01924
- **Certificate ARN:** arn:aws:acm:us-east-1:120569622669:certificate/3cacc7aa-aabf-4204-9207-5cf8852da907
- **Load Balancer:** krishi-era-alb-536422943.us-east-1.elb.amazonaws.com
- **Amplify App ID:** d3o65ri2eglx5a
- **ECS Cluster:** krishi-era-cluster
- **ECS Service:** krishi-backend-service

### Useful Commands

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:120569622669:certificate/3cacc7aa-aabf-4204-9207-5cf8852da907 \
  --region us-east-1 \
  --query 'Certificate.Status' \
  --output text

# Check ECS service status
aws ecs describe-services \
  --cluster krishi-era-cluster \
  --services krishi-backend-service \
  --region us-east-1 \
  --query 'services[0].deployments' \
  --output table

# Check ALB listeners
aws elbv2 describe-listeners \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:120569622669:loadbalancer/app/krishi-era-alb/d53e5e4b83f0c5f3 \
  --region us-east-1 \
  --query 'Listeners[*].[Protocol,Port]' \
  --output table

# Check Amplify deployment status
aws amplify list-jobs \
  --app-id d3o65ri2eglx5a \
  --branch-name feature/deployment \
  --region us-east-1 \
  --max-results 5
```

---

## Cost Summary

### Current Monthly Costs

- **ECS Fargate:** ~$15/month (0.25 vCPU, 0.5 GB RAM, 24/7)
- **Application Load Balancer:** ~$16/month
- **Amplify Hosting:** ~$0.15/GB served + $0.01/build minute
- **Route 53 Hosted Zone:** $0.50/month
- **Route 53 DNS Queries:** ~$0.40/month
- **SSL Certificate:** Free (AWS Certificate Manager)

**Total:** ~$32-42/month (depending on traffic)

### Cost Optimization

To save costs when not in use:

```bash
# Stop ECS service (saves ~$15/month)
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 0 \
  --region us-east-1

# Start ECS service
aws ecs update-service \
  --cluster krishi-era-cluster \
  --service krishi-backend-service \
  --desired-count 1 \
  --region us-east-1
```

---

## Troubleshooting

### Certificate Stuck in PENDING_VALIDATION

- Wait up to 30 minutes
- Check DNS propagation: https://dnschecker.org
- Verify validation record exists:
  ```bash
  aws route53 list-resource-record-sets \
    --hosted-zone-id Z00113231Y82SSVG01924 \
    --query "ResourceRecordSets[?contains(Name, '_a495289ba8664e3f919ec37fdbacec18')]"
  ```

### HTTPS Not Working After Setup

- Verify certificate status is ISSUED
- Check HTTPS listener exists on ALB
- Ensure security groups allow port 443
- Wait for DNS propagation (5-30 minutes)
- Test with: `curl -v https://api.krishiai.in/health`

### Mixed Content Errors

- Ensure frontend uses `https://api.krishiai.in/api` (not http://)
- Check browser console for specific errors
- Verify CORS includes your frontend domain

### Amplify Build Fails

- Check build logs in Amplify console
- Verify environment variables are set correctly
- Ensure `VITE_API_BASE_URL` uses HTTPS

---

## What Happens After Domain Setup?

1. **Frontend:** https://krishiai.in
   - Served by Amplify with automatic HTTPS
   - Auto-deploys on git push to feature/deployment branch
   
2. **Backend API:** https://api.krishiai.in/api
   - Served by ECS Fargate through ALB
   - HTTPS with AWS Certificate Manager SSL
   - CORS configured for krishiai.in domains

3. **No More Mixed Content Errors!**
   - Both frontend and backend use HTTPS
   - Secure communication between services

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review AWS CloudWatch logs:
   - ECS: `/ecs/krishi-backend`
   - Amplify: In Amplify console under build logs
3. Verify all DNS records in Route 53
4. Check security groups allow required ports

---

## Ready to Deploy Main Branch?

Once everything is working on `feature/deployment`:

1. Update Amplify to deploy from `main` branch
2. Update environment variables for production
3. Consider setting up separate staging/production environments
4. Set up monitoring and alerts

---

**Current Action:** Run `./monitor-cert.sh` to watch certificate validation in real-time!

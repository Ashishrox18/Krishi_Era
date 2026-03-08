# 🔒 HTTPS Setup - Alternative Approaches

You have **3 options** to get HTTPS working immediately or soon:

---

## Option 1: Wait for Current Certificate ⏳ (RECOMMENDED)

**Status:** Certificate validation in progress (1+ hour elapsed)

**What's happening:**
- SSL certificate for `api.krishiai.in` is pending DNS validation
- DNS record is correctly configured
- AWS validation system checks periodically (not continuously)

**Timeline:**
- Most likely: 10-30 more minutes
- Worst case: Up to 24 hours (rare)

**Action:**
```bash
./monitor-cert.sh
```

**Pros:**
- Already in progress
- Clean, simple setup
- No additional costs
- Uses your custom domain

**Cons:**
- Waiting time (unpredictable)

---

## Option 2: Wildcard Certificate 🌟 (FAST ALTERNATIVE)

**What it does:**
- Requests a wildcard certificate for `*.krishiai.in`
- Covers all subdomains (api.krishiai.in, www.krishiai.in, etc.)
- Sometimes validates faster than single-domain certificates

**Timeline:**
- Setup: 2 minutes
- Validation: 5-30 minutes (sometimes faster than single domain)

**Action:**
```bash
./setup-wildcard-cert.sh
```

**Pros:**
- Covers all subdomains with one certificate
- Sometimes validates faster
- More flexible for future subdomains
- Same cost (free)

**Cons:**
- Still requires DNS validation wait
- Might take same time as Option 1

**Cost:** Free (AWS Certificate Manager)

---

## Option 3: CloudFront HTTPS Proxy ⚡ (IMMEDIATE)

**What it does:**
- Creates CloudFront distribution in front of your ALB
- Uses CloudFront's default HTTPS certificate (immediate)
- No waiting for DNS validation
- Bonus: CDN caching for better performance

**Timeline:**
- Setup: 5-10 minutes
- HTTPS available: Immediately after deployment

**Action:**
```bash
./setup-cloudfront-https.sh
```

**Pros:**
- ✅ Immediate HTTPS (no waiting for certificate validation)
- ✅ CDN caching improves performance
- ✅ Can add custom domain later
- ✅ DDoS protection included
- ✅ Works right away

**Cons:**
- Uses CloudFront domain initially (e.g., d111111abcdef8.cloudfront.net)
- Small additional cost (~$1-2/month with low traffic)
- Extra hop in request path (minimal latency)

**Cost:** ~$1-2/month (with low traffic)

**CloudFront URL format:**
```
https://d111111abcdef8.cloudfront.net/api/auth/login
```

You can add your custom domain (api.krishiai.in) to CloudFront later once the SSL certificate validates.

---

## Comparison Table

| Feature | Option 1: Wait | Option 2: Wildcard | Option 3: CloudFront |
|---------|----------------|-------------------|---------------------|
| **Time to HTTPS** | 10min - 24hrs | 5-30 min | 5-10 min (immediate) |
| **Custom Domain** | ✅ api.krishiai.in | ✅ *.krishiai.in | ⏳ Later (or use CF domain) |
| **Additional Cost** | $0 | $0 | ~$1-2/month |
| **Setup Complexity** | Simple | Simple | Moderate |
| **Performance** | Good | Good | Better (CDN) |
| **Flexibility** | Single domain | All subdomains | Can add domain later |
| **Reliability** | High | High | Very High (CDN) |

---

## My Recommendation

### For Testing/Development NOW:
**Choose Option 3 (CloudFront)** - Get HTTPS working in 10 minutes, test your app, then add custom domain later.

### For Production with Custom Domain:
**Choose Option 2 (Wildcard)** - More flexible, covers all subdomains, and might validate faster.

### If You're Patient:
**Stick with Option 1** - Already in progress, clean setup, just wait a bit longer.

---

## Quick Decision Guide

**Need to test the app RIGHT NOW?**
→ Option 3 (CloudFront) - 10 minutes to working HTTPS

**Want custom domain ASAP?**
→ Option 2 (Wildcard) - Might validate faster, covers more

**Can wait 30-60 more minutes?**
→ Option 1 (Current) - Already in progress

---

## Detailed Instructions

### Option 1: Continue Waiting

```bash
# Monitor certificate status
./monitor-cert.sh

# Or check manually
./check-cert-and-deploy.sh
```

Once validated:
```bash
./update-backend-cors.sh
```

---

### Option 2: Wildcard Certificate

```bash
# Run the setup script
./setup-wildcard-cert.sh
```

The script will:
1. Request wildcard certificate for *.krishiai.in
2. Add DNS validation records
3. Wait for validation (with progress indicator)
4. Create HTTPS listener on ALB
5. Provide next steps

Once complete:
```bash
./update-backend-cors.sh
```

---

### Option 3: CloudFront HTTPS

```bash
# Run the setup script
./setup-cloudfront-https.sh
```

The script will:
1. Create CloudFront distribution
2. Configure origin (your ALB)
3. Wait for deployment (~5-10 min)
4. Provide CloudFront HTTPS URL

Then update Amplify:
```bash
# Use the CloudFront domain provided by the script
aws amplify update-app \
  --app-id d3o65ri2eglx5a \
  --environment-variables VITE_API_BASE_URL=https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net/api \
  --region us-east-1

# Trigger new build
aws amplify start-job \
  --app-id d3o65ri2eglx5a \
  --branch-name feature/deployment \
  --job-type RELEASE \
  --region us-east-1
```

Update backend CORS to include CloudFront domain:
```bash
# Edit backend/src/server.ts to add CloudFront domain
# Then run:
./update-backend-cors.sh
```

---

## Can I Switch Later?

**Yes!** All options are compatible:

- **CloudFront → Custom Domain:** Add custom domain to CloudFront once certificate validates
- **Single Domain → Wildcard:** Just use the wildcard cert when it's ready
- **Any → Any:** You can change the certificate on the ALB listener anytime

---

## Testing After Setup

### Test Backend HTTPS

```bash
# For Option 1 or 2 (custom domain)
curl https://api.krishiai.in/health

# For Option 3 (CloudFront)
curl https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-08T..."
}
```

### Test Frontend

1. Update Amplify environment variable (see above)
2. Trigger new build
3. Open your Amplify URL
4. Try logging in - no more mixed content errors!

---

## Cost Summary

| Option | Monthly Cost | One-time Cost |
|--------|-------------|---------------|
| Option 1 | $0 | $0 |
| Option 2 | $0 | $0 |
| Option 3 | ~$1-2 | $0 |

All options use free SSL certificates from AWS.

---

## Need Help?

If you encounter issues:

1. Check the script output for errors
2. Verify AWS credentials are configured
3. Check CloudWatch logs for backend errors
4. Review browser console for frontend errors

---

## What Would I Do?

If I were you, I'd:

1. **Run Option 3 (CloudFront)** right now to get HTTPS working in 10 minutes
2. Test the entire application with HTTPS
3. Keep Option 1 or 2 running in the background
4. Once custom domain certificate validates, switch CloudFront to use it
5. Best of both worlds: immediate testing + custom domain later

**Command:**
```bash
./setup-cloudfront-https.sh
```

This gets you unblocked immediately while the custom domain certificate validates in the background.

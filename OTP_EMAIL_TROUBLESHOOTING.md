# OTP Email Troubleshooting Guide

## Issue: "Failed to send OTP to email"

This guide will help you diagnose and fix OTP email delivery issues.

---

## Quick Diagnosis

### Step 1: Check Backend Logs

When you click "Send OTP" on the registration page, check your backend terminal for logs:

**If you see this:**
```
📧 EMAIL OTP (Development Mode - SES Not Configured)
====================================================================
📬 To: user@example.com
🔢 OTP: 123456
⏰ Expires in: 10 minutes
====================================================================
```

**This means:** AWS SES is NOT configured. The system is in development mode and showing OTPs in console logs only.

**Solution:** Follow the AWS SES Setup steps below.

---

**If you see this:**
```
✅ OTP email sent successfully to user@example.com
```

**This means:** Email was sent successfully via AWS SES.

**Solution:** Check your email inbox (and spam folder). If still not received, see "Email Not Arriving" section below.

---

**If you see this:**
```
❌ Failed to send OTP email via SES: MessageRejected: Email address is not verified
```

**This means:** Your email address is not verified in AWS SES.

**Solution:** Verify your email in AWS SES Console (see below).

---

## AWS SES Setup (Required for Email Delivery)

### Current Status
- ✅ SES service code is implemented
- ✅ AWS credentials are configured
- ⏳ SES is disabled (USE_SES=false in backend/.env)
- ⏳ Email address needs verification in AWS

### Option 1: Quick Test (Development Mode)

For testing, you can use console logs instead of real emails:

1. Keep `USE_SES=false` in `backend/.env`
2. When registering, check backend terminal for OTP
3. Copy the OTP from console and paste in registration form

**Pros:** No AWS setup needed, works immediately
**Cons:** Only for development, not suitable for production

---

### Option 2: Enable AWS SES (Production Ready)

Follow these steps to enable real email delivery:

#### Step 1: Verify Your Email in AWS SES

1. **Open AWS SES Console:**
   - Go to: https://console.aws.amazon.com/ses/
   - Make sure region is set to "US East (N. Virginia) us-east-1"

2. **Verify an Email Address:**
   - Click "Verified identities" in left sidebar
   - Click "Create identity" button
   - Select "Email address"
   - Enter your email (e.g., `noreply@yourdomain.com` or your Gmail)
   - Click "Create identity"

3. **Check Your Email:**
   - AWS will send a verification email
   - Click the verification link
   - Return to AWS console and refresh
   - Status should show "Verified" ✅

#### Step 2: Update Backend Configuration

Edit `backend/.env`:

```env
# Change this from false to true
USE_SES=true

# Add your verified email
SES_FROM_EMAIL=your-verified-email@example.com
```

#### Step 3: Restart Backend Server

```bash
cd backend
# Stop the server (Ctrl+C)
npm run dev
```

#### Step 4: Test Email Delivery

**Option A: Use Test Script**
```bash
cd backend
npm run test:ses
```

**Option B: Test Registration Flow**
1. Go to http://localhost:5173/login
2. Click "Register"
3. Fill in details with a real email
4. Click "Send OTP"
5. Check your email inbox (and spam folder)

---

## Common Issues and Solutions

### Issue: "Email address is not verified"

**Error Message:**
```
MessageRejected: Email address is not verified
```

**Cause:** AWS SES is in sandbox mode and can only send to verified emails.

**Solution:**

**Option A: Verify the recipient email** (Quick fix for testing)
1. Go to AWS SES Console
2. Verify the email address you're trying to send to
3. Try registration again

**Option B: Request Production Access** (Recommended for production)
1. Go to AWS SES Console → Account Dashboard
2. Click "Request production access"
3. Fill out the form (see AWS_SES_SETUP_GUIDE.md for template)
4. Wait for approval (usually 24 hours)

---

### Issue: Email Not Arriving

**Symptoms:** No error in logs, but email doesn't arrive

**Solutions:**

1. **Check Spam Folder**
   - OTP emails might be filtered as spam
   - Mark as "Not Spam" to improve future delivery

2. **Verify FROM Email**
   - Make sure `SES_FROM_EMAIL` in backend/.env is verified in AWS SES
   - Check for typos in the email address

3. **Check AWS SES Sending Statistics**
   - Go to AWS SES Console → Account Dashboard
   - Look for bounce or complaint rates
   - Check if sending is paused

4. **Test with Different Email Provider**
   - Try Gmail, Outlook, Yahoo
   - Some providers have stricter spam filters

---

### Issue: "AccessDenied" or "UnauthorizedOperation"

**Error Message:**
```
AccessDeniedException: User is not authorized to perform: ses:SendEmail
```

**Cause:** AWS IAM user doesn't have SES permissions

**Solution:**

1. **Go to AWS IAM Console:**
   - https://console.aws.amazon.com/iam/

2. **Find Your IAM User:**
   - Click "Users" in left sidebar
   - Find user with access key: AKIARY***********XOUP

3. **Add SES Permissions:**
   - Click on the user
   - Click "Add permissions" → "Attach policies directly"
   - Search for "AmazonSESFullAccess"
   - Select and attach the policy

4. **Or Create Custom Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail",
           "ses:GetSendQuota"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

---

### Issue: Rate Limiting

**Error Message:**
```
Throttling: Maximum sending rate exceeded
```

**Cause:** Sending too many emails too quickly

**Solution:**

1. **Check Your Limits:**
   ```bash
   aws ses get-send-quota --region us-east-1
   ```

2. **Sandbox Limits:**
   - 1 email per second
   - 200 emails per day

3. **Request Production Access:**
   - Increases limits significantly
   - Follow AWS_SES_SETUP_GUIDE.md

---

## Testing Checklist

Use this checklist to verify your setup:

- [ ] AWS credentials are set in backend/.env
- [ ] USE_SES is set to true (or false for console logs)
- [ ] SES_FROM_EMAIL is set and verified in AWS SES
- [ ] Backend server is running (npm run dev)
- [ ] Frontend is running (npm run dev)
- [ ] Test script runs successfully (npm run test:ses)
- [ ] Registration sends OTP (check backend logs)
- [ ] Email arrives in inbox (or spam folder)
- [ ] OTP verification works

---

## Development vs Production

### Development Mode (USE_SES=false)
- ✅ No AWS setup required
- ✅ Works immediately
- ✅ OTPs shown in console logs
- ❌ Not suitable for real users
- ❌ Requires access to backend terminal

### Production Mode (USE_SES=true)
- ✅ Real email delivery
- ✅ Professional appearance
- ✅ Works for all users
- ⏳ Requires AWS SES setup
- ⏳ Email verification needed
- ⏳ May need production access request

---

## Quick Commands Reference

```bash
# Test SES configuration
cd backend
npm run test:ses

# Check AWS SES sending quota
aws ses get-send-quota --region us-east-1

# Verify an email address via CLI
aws ses verify-email-identity --email-address your@email.com --region us-east-1

# Check verification status
aws ses get-identity-verification-attributes --identities your@email.com --region us-east-1

# Start backend server
cd backend
npm run dev

# Start frontend
npm run dev
```

---

## Cost Information

### AWS SES Pricing
- **Free Tier:** 3,000 emails/month (forever)
- **After Free Tier:** $0.10 per 1,000 emails
- **Your Expected Cost:** $0-2/month

### Example Costs
- 500 registrations/month: $0 (within free tier)
- 5,000 registrations/month: $0.20/month
- 20,000 registrations/month: $1.70/month

---

## Next Steps

### For Development/Testing
1. Keep USE_SES=false
2. Use console logs for OTPs
3. Test registration flow
4. Verify OTP verification works

### For Production Launch
1. Follow AWS_SES_SETUP_GUIDE.md
2. Verify your email in AWS SES
3. Request production access
4. Set USE_SES=true
5. Test with real emails
6. Monitor delivery rates

---

## Support Resources

- **AWS SES Setup Guide:** See AWS_SES_SETUP_GUIDE.md
- **AWS SES Console:** https://console.aws.amazon.com/ses/
- **AWS SES Documentation:** https://docs.aws.amazon.com/ses/
- **AWS Support:** https://console.aws.amazon.com/support/

---

## Summary

**Current State:**
- Email OTP system is fully implemented
- AWS credentials are configured
- SES is disabled (development mode)
- OTPs are shown in backend console logs

**To Enable Email Delivery:**
1. Verify email in AWS SES Console
2. Set USE_SES=true in backend/.env
3. Set SES_FROM_EMAIL in backend/.env
4. Restart backend server
5. Test registration flow

**Estimated Setup Time:** 15-30 minutes

---

**Last Updated:** March 8, 2026

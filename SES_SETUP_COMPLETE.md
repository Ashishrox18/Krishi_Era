# AWS SES Setup - Automated Configuration Complete

## ✅ What's Been Done

I've automatically configured AWS SES for your Krishi Era application:

### 1. IAM Permissions ✅
- Attached `AmazonSESFullAccess` policy to your IAM user
- Your user `krishi-era-admin` now has full SES permissions

### 2. SES Status Verified ✅
- Region: us-east-1
- Current mode: SANDBOX (200 emails/day)
- Can send to verified email addresses
- Ready for email verification

### 3. Scripts Created ✅
- `npm run auto-setup-ses` - Check SES status automatically
- `npm run verify-email <email>` - Verify an email address
- `npm run test:ses` - Test email sending
- `npm run setup-ses` - Interactive setup wizard

---

## 🎯 Next Step: Verify Your Email

You need to verify ONE email address to start sending OTPs.

### Option 1: Use Your Personal Email (Recommended for Testing)

```bash
cd backend
npm run verify-email yourname@gmail.com
```

This will:
1. Send verification email to your Gmail
2. You click the link in the email
3. Run the command again to confirm
4. Automatically update backend/.env

### Option 2: Use a Domain Email (For Production)

```bash
cd backend
npm run verify-email noreply@yourdomain.com
```

Requirements:
- You must have access to that email inbox
- Or control the domain's email settings

---

## 📧 What Happens When You Verify

1. **Run the command:**
   ```bash
   npm run verify-email your@email.com
   ```

2. **Check your email:**
   - From: no-reply-aws@amazon.com
   - Subject: "Amazon SES Email Address Verification Request"
   - Check spam folder if not in inbox

3. **Click the verification link**
   - Opens AWS confirmation page
   - Email is now verified

4. **Run command again to confirm:**
   ```bash
   npm run verify-email your@email.com
   ```

5. **Automatic configuration:**
   - Updates `backend/.env` with:
     - `USE_SES=true`
     - `SES_FROM_EMAIL=your@email.com`

---

## 🚀 After Email Verification

### Test Email Sending

```bash
cd backend
npm run test:ses
```

This will send a test OTP email to verify everything works.

### Start Your Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### Test Registration

1. Go to http://localhost:5173/login
2. Click "Register"
3. Fill in the form
4. Click "Send OTP"
5. Check your email for the OTP
6. Complete registration

---

## 📊 Current SES Limits

### Sandbox Mode (Current)
- **Daily limit:** 200 emails
- **Rate limit:** 1 email per second
- **Restriction:** Can only send to verified emails

### How to Remove Restrictions

To send to ANY email address (not just verified ones):

1. **Request Production Access:**
   - Go to: https://console.aws.amazon.com/ses/
   - Click "Account Dashboard" in left sidebar
   - Click "Request production access"

2. **Fill out the form:**
   ```
   Mail Type: Transactional
   
   Website URL: http://localhost:5173 (or your domain)
   
   Use Case: 
   "We are building Krishi Era, an agricultural platform that 
   connects farmers and buyers. We need to send OTP verification 
   emails for user registration. Expected volume: 1,000-10,000 
   emails per month."
   
   Compliance:
   "We only send to users who register on our platform. We do not 
   purchase email lists. We honor all unsubscribe requests."
   ```

3. **Wait for approval:**
   - Usually approved within 24 hours
   - You'll receive an email notification

4. **After approval:**
   - Daily limit increases to 50,000+
   - Can send to any email address
   - No more verification required for recipients

---

## 💰 Cost Information

### Current Usage (Sandbox)
- **Cost:** $0 (free tier)
- **Limit:** 200 emails/day

### After Production Access
- **Free tier:** 3,000 emails/month (forever)
- **After free tier:** $0.10 per 1,000 emails

### Your Expected Costs

| Users/Month | Emails | Cost |
|-------------|--------|------|
| 500 | 500 | $0.00 (free tier) |
| 3,000 | 3,000 | $0.00 (free tier) |
| 5,000 | 5,000 | $0.20 |
| 10,000 | 10,000 | $0.70 |
| 20,000 | 20,000 | $1.70 |

**Compared to SMS:** Saving $127.30/month for 20,000 users!

---

## 🔍 Troubleshooting

### Issue: "Email not verified"

**Solution:**
```bash
npm run verify-email your@email.com
```
Check your inbox and click the verification link.

### Issue: "AccessDenied"

**Solution:**
The IAM policy has been attached. Wait 1-2 minutes for AWS to propagate the permissions, then try again.

### Issue: "Verification email not received"

**Solutions:**
1. Check spam/junk folder
2. Look for sender: no-reply-aws@amazon.com
3. Wait a few minutes and check again
4. Try verifying manually in AWS Console:
   https://console.aws.amazon.com/ses/

### Issue: "MessageRejected: Email address is not verified"

**Cause:** In sandbox mode, both sender AND recipient must be verified.

**Solutions:**
1. Verify the recipient's email too (for testing)
2. OR request production access (recommended)

---

## 📚 Quick Command Reference

```bash
# Check SES status and permissions
npm run auto-setup-ses

# Verify an email address
npm run verify-email your@email.com

# Test email sending
npm run test:ses

# Interactive setup wizard
npm run setup-ses

# Start backend server
npm run dev
```

---

## 🎯 Recommended Next Steps

### For Immediate Testing (5 minutes)

1. **Verify your personal email:**
   ```bash
   cd backend
   npm run verify-email yourname@gmail.com
   ```

2. **Check your inbox and click verification link**

3. **Confirm verification:**
   ```bash
   npm run verify-email yourname@gmail.com
   ```

4. **Test email sending:**
   ```bash
   npm run test:ses
   ```

5. **Start application and test registration**

### For Production Launch (24 hours)

1. **Verify your domain email:**
   ```bash
   npm run verify-email noreply@yourdomain.com
   ```

2. **Request production access:**
   - Go to AWS SES Console
   - Request production access
   - Wait for approval (~24 hours)

3. **Test with real users**

---

## ✅ Setup Checklist

- [x] AWS credentials configured
- [x] IAM permissions attached (AmazonSESFullAccess)
- [x] SES service initialized
- [x] Setup scripts created
- [ ] Email address verified (YOU NEED TO DO THIS)
- [ ] backend/.env updated with USE_SES=true
- [ ] Test email sent successfully
- [ ] Registration flow tested

---

## 🎉 Summary

**Current Status:**
- ✅ AWS SES configured and ready
- ✅ IAM permissions granted
- ✅ Scripts created for easy setup
- ⏳ Waiting for email verification

**To Complete Setup:**
```bash
cd backend
npm run verify-email your@email.com
# Check email and click verification link
# Run command again to confirm
npm run test:ses
```

**Estimated Time:** 5 minutes

---

## 📞 Support

**Need help?**
- Check `OTP_EMAIL_TROUBLESHOOTING.md` for common issues
- Run `npm run auto-setup-ses` to check status
- Review `AWS_SES_SETUP_GUIDE.md` for detailed instructions

**AWS Console:**
- SES Dashboard: https://console.aws.amazon.com/ses/
- IAM Dashboard: https://console.aws.amazon.com/iam/

---

**You're almost done! Just verify one email address and you're ready to go!** 🚀

```bash
cd backend
npm run verify-email your@email.com
```

---

**Last Updated:** March 8, 2026
**Status:** Ready for email verification

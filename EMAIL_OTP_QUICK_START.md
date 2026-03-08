# Email OTP Quick Start Guide

## Current Status ✅

Your email OTP system is fully implemented and ready to use!

- ✅ Email OTP service implemented
- ✅ AWS SDK installed
- ✅ Frontend updated to use email verification
- ✅ Backend configured for email OTP
- ✅ Password strength validation active
- ✅ Phone number auto-formatting (adds +91)

---

## How It Works Right Now

### Development Mode (Current)

**Configuration:** `USE_SES=false` in `backend/.env`

When a user registers:
1. User fills registration form with email
2. Clicks "Send OTP"
3. Backend generates 6-digit OTP
4. **OTP is printed in backend console logs** (not sent via email)
5. User enters OTP from console
6. Registration completes

**To see the OTP:**
- Look at your backend terminal where `npm run dev` is running
- You'll see a box like this:

```
====================================================================
📧 EMAIL OTP (Development Mode - SES Not Configured)
====================================================================
📬 To: user@example.com
🔢 OTP: 123456
⏰ Expires in: 10 minutes
====================================================================
```

---

## Testing Right Now (No AWS Setup Needed)

### Step 1: Start the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

### Step 2: Test Registration

1. Go to http://localhost:5173/login
2. Click "Register" tab
3. Fill in the form:
   - Name: Test User
   - Role: Farmer
   - Phone: 9876543210 (no need for +91)
   - Email: test@example.com
   - Password: Test@123 (must be strong)
4. Click "Send OTP"

### Step 3: Get OTP from Console

1. Look at your backend terminal
2. Find the OTP in the console output
3. Copy the 6-digit code

### Step 4: Complete Registration

1. Enter the OTP in the registration form
2. Click "Verify & Register"
3. You should be logged in and redirected to the farmer dashboard

---

## Enable Real Email Delivery (Optional)

If you want to send real emails instead of console logs:

### Quick Setup (15 minutes)

1. **Verify Your Email in AWS SES:**
   - Go to: https://console.aws.amazon.com/ses/
   - Click "Verified identities" → "Create identity"
   - Select "Email address"
   - Enter your email (e.g., your Gmail)
   - Click verification link in email

2. **Update Configuration:**
   
   Edit `backend/.env`:
   ```env
   USE_SES=true
   SES_FROM_EMAIL=your-verified-email@gmail.com
   ```

3. **Restart Backend:**
   ```bash
   cd backend
   # Stop server (Ctrl+C)
   npm run dev
   ```

4. **Test:**
   ```bash
   cd backend
   npm run test:ses
   ```

### Important Notes

**Sandbox Mode Limitations:**
- Can only send to verified email addresses
- 200 emails per day limit
- 1 email per second

**To send to any email:**
- Request production access in AWS SES Console
- Takes ~24 hours for approval
- See `AWS_SES_SETUP_GUIDE.md` for details

---

## Troubleshooting

### Issue: "Failed to send OTP"

**Check backend logs for:**

1. **If you see:** "Development Mode - SES Not Configured"
   - **This is normal!** Copy OTP from console logs
   - Or enable SES (see above)

2. **If you see:** "Email address is not verified"
   - Verify your email in AWS SES Console
   - Or verify the recipient's email (sandbox mode)

3. **If you see:** "AccessDenied"
   - Check AWS credentials in backend/.env
   - Ensure IAM user has SES permissions

**For detailed troubleshooting:** See `OTP_EMAIL_TROUBLESHOOTING.md`

---

## What Changed from SMS to Email

### Before (SMS via AWS SNS)
- OTP sent to phone number via SMS
- Required AWS SNS setup
- Cost: $0.00645 per SMS

### After (Email via AWS SES)
- OTP sent to email address
- Uses AWS SES
- Cost: Free for first 3,000 emails/month
- More reliable and cheaper

### User Experience
- Phone number still required (for contact)
- Email is now required (for verification)
- OTP sent to email instead of SMS
- Phone number auto-formatted (adds +91)

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads registration page
- [ ] Can fill registration form
- [ ] "Send OTP" button works
- [ ] OTP appears in backend console (development mode)
- [ ] Can enter OTP and verify
- [ ] Registration completes successfully
- [ ] User is redirected to dashboard

---

## Production Readiness

### For Development/Testing
✅ Ready to use now with console logs

### For Production Launch
⏳ Need to:
1. Verify email in AWS SES
2. Request production access
3. Set USE_SES=true
4. Test email delivery
5. Monitor bounce rates

**Estimated setup time:** 30 minutes + 24 hours for AWS approval

---

## Quick Commands

```bash
# Test SES configuration
cd backend && npm run test:ses

# Start backend (development mode)
cd backend && npm run dev

# Start frontend
npm run dev

# Check AWS SES quota
aws ses get-send-quota --region us-east-1
```

---

## Documentation

- **Setup Guide:** `AWS_SES_SETUP_GUIDE.md` - Complete AWS SES setup
- **Troubleshooting:** `OTP_EMAIL_TROUBLESHOOTING.md` - Fix common issues
- **This Guide:** Quick start for testing

---

## Summary

**Current State:**
- ✅ Email OTP fully implemented
- ✅ Works in development mode (console logs)
- ✅ Ready for testing
- ⏳ AWS SES optional (for real emails)

**To Test Now:**
1. Start backend and frontend
2. Register a new user
3. Get OTP from backend console
4. Complete registration

**To Enable Real Emails:**
1. Verify email in AWS SES
2. Set USE_SES=true
3. Restart backend
4. Test registration

---

**Last Updated:** March 8, 2026

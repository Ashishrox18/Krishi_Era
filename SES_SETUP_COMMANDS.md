# AWS SES Setup - Command Reference

## 🚀 Complete Setup in 3 Commands

```bash
# 1. Verify your email
cd backend
npm run verify-email yourname@gmail.com

# 2. Click verification link in your email

# 3. Confirm verification (run same command again)
npm run verify-email yourname@gmail.com
```

**Done!** ✅

---

## 📋 All Available Commands

### Setup Commands

```bash
# Check SES status and permissions
npm run auto-setup-ses

# Verify an email address (interactive)
npm run verify-email your@email.com

# Interactive setup wizard
npm run setup-ses

# Test email sending
npm run test:ses
```

### Application Commands

```bash
# Start backend server
npm run dev

# Build backend
npm run build

# Start frontend (from root directory)
npm run dev
```

---

## 💡 Common Use Cases

### First Time Setup

```bash
cd backend
npm run auto-setup-ses          # Check status
npm run verify-email your@email.com  # Verify email
# Click link in email
npm run verify-email your@email.com  # Confirm
npm run test:ses                # Test sending
```

### Check if Email is Verified

```bash
cd backend
npm run auto-setup-ses
```

Look for:
```
✅ your@email.com
```

### Test Email Delivery

```bash
cd backend
npm run test:ses
```

Check your inbox for test OTP email.

### Start Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

Then go to: http://localhost:5173/login

---

## 🔍 Quick Troubleshooting

### Email Not Verified?

```bash
npm run verify-email your@email.com
```

### Check SES Status

```bash
npm run auto-setup-ses
```

### Test Email Sending

```bash
npm run test:ses
```

### View Current Configuration

```bash
cat backend/.env | grep SES
```

Should show:
```
USE_SES=true
SES_FROM_EMAIL=your@email.com
```

---

## 📧 Email Verification Process

```bash
# Step 1: Send verification request
npm run verify-email your@email.com

# Step 2: Check your email
# - From: no-reply-aws@amazon.com
# - Subject: Amazon SES Email Address Verification Request
# - Click the verification link

# Step 3: Confirm verification
npm run verify-email your@email.com

# Output should show:
# ✅ Email is already verified!
# ✅ Updated backend/.env
```

---

## 🎯 What Each Command Does

### `npm run auto-setup-ses`
- Checks AWS credentials
- Verifies IAM permissions
- Shows SES quota and limits
- Lists verified email addresses
- Provides next steps

### `npm run verify-email <email>`
- Sends verification email to specified address
- Checks verification status
- Updates backend/.env automatically
- Provides confirmation

### `npm run setup-ses`
- Interactive wizard
- Asks for email to verify
- Guides through verification process
- Updates configuration

### `npm run test:ses`
- Checks environment configuration
- Sends test OTP email
- Verifies email delivery
- Shows success/failure

---

## 📊 Expected Output Examples

### Successful Verification

```bash
$ npm run verify-email test@gmail.com

======================================================================
📧 AWS SES Email Verification
======================================================================

✅ Email is already verified!
   test@gmail.com is ready to send emails.

✅ Updated backend/.env:
   USE_SES=true
   SES_FROM_EMAIL=test@gmail.com

======================================================================
🎉 Setup Complete!
======================================================================

Next steps:
1. Restart backend: npm run dev
2. Test SES: npm run test:ses
3. Try registration: http://localhost:5173/login
```

### Successful Test

```bash
$ npm run test:ses

======================================================================
🧪 AWS SES Configuration Test
======================================================================

📋 Environment Configuration:
   AWS_REGION: us-east-1
   AWS_ACCESS_KEY_ID: ✅ SET
   AWS_SECRET_ACCESS_KEY: ✅ SET
   USE_SES: true
   SES_FROM_EMAIL: test@gmail.com

📧 Sending Test OTP Email:
   To: test@gmail.com
   OTP: 123456

✅ Test completed successfully!

📝 Next Steps:
   1. Check your email inbox (and spam folder) for the OTP
   2. If email received, SES is working perfectly!
```

---

## 🎉 Quick Start

**Just run these:**

```bash
cd backend
npm run verify-email yourname@gmail.com
```

**Check email, click link, then:**

```bash
npm run verify-email yourname@gmail.com
npm run test:ses
npm run dev
```

**Done!** 🚀

---

**Last Updated:** March 8, 2026

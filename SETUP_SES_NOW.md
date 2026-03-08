# Set Up AWS SES in 2 Minutes

## ✅ Already Done For You

- AWS credentials configured
- IAM permissions attached
- SES service ready
- Scripts created

---

## 🚀 Complete Setup (2 Commands)

### Step 1: Verify Your Email

```bash
cd backend
npm run verify-email your@email.com
```

**Replace `your@email.com` with:**
- Your Gmail: `yourname@gmail.com`
- Your work email: `you@company.com`
- Domain email: `noreply@yourdomain.com`

### Step 2: Click Verification Link

1. Check your email inbox (and spam folder)
2. Look for email from: `no-reply-aws@amazon.com`
3. Subject: "Amazon SES Email Address Verification Request"
4. Click the verification link

### Step 3: Confirm Verification

```bash
npm run verify-email your@email.com
```

**That's it!** Your `.env` file will be updated automatically.

---

## 🧪 Test It

```bash
npm run test:ses
```

You should receive a test OTP email!

---

## 🎯 Try Registration

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend (in root directory)
npm run dev

# Browser: http://localhost:5173/login
# Register and check your email for OTP
```

---

## 💡 Quick Tips

**Use Gmail for testing:**
```bash
npm run verify-email yourname@gmail.com
```
- Fast verification
- Reliable delivery
- Easy to test

**Check SES status anytime:**
```bash
npm run auto-setup-ses
```

**Having issues?**
- Check `SES_SETUP_COMPLETE.md` for troubleshooting
- Or `OTP_EMAIL_TROUBLESHOOTING.md` for detailed help

---

## 📊 What You Get

- ✅ Real email OTPs (no more console logs)
- ✅ Professional email templates
- ✅ 3,000 free emails/month
- ✅ $0.10 per 1,000 after that
- ✅ 95% cost savings vs SMS

---

## 🎉 Ready to Go!

Just run these two commands:

```bash
cd backend
npm run verify-email your@email.com
# Click link in email
npm run verify-email your@email.com
```

**Done!** 🚀

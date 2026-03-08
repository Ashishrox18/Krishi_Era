# Registration System - Quick Reference Card

## 🚀 Quick Start (5 Minutes)

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend  
npm run dev

# Browser: Open registration
http://localhost:5173/login → Click "Register"

# Fill form and click "Send OTP"
# Check Terminal 1 for OTP in console logs
# Copy OTP and complete registration
```

---

## 📋 Registration Requirements

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Name | ✅ Yes | Any text | Test User |
| Role | ✅ Yes | Dropdown | Farmer/Buyer/Transporter/Storage |
| Phone | ✅ Yes | 10 digits, starts 6-9 | 9876543210 |
| Email | ✅ Yes | Valid email | test@example.com |
| Password | ✅ Yes | 8+ chars, 3 types | Test@123 |

---

## 🔐 Password Rules

**Minimum Requirements:**
- 8+ characters
- 3 of 4 types: uppercase, lowercase, numbers, special chars

**Strength Levels:**
- 🔴 Very Weak (score 0-1): Cannot submit
- 🟠 Weak (score 2): Cannot submit  
- 🟡 Fair (score 3): Can submit ✓
- 🔵 Good (score 4): Can submit ✓
- 🟢 Strong (score 5): Can submit ✓

**Examples:**
- ❌ `password` - too weak
- ❌ `Password` - too weak
- ✅ `Password1` - fair (can submit)
- ✅ `Test@123` - good
- ✅ `MyP@ssw0rd` - strong

---

## 📱 Phone Number Format

**User Input:** Just 10 digits
```
9876543210
```

**System Adds:** +91 automatically
```
+919876543210
```

**Validation:**
- Must be exactly 10 digits
- Must start with 6, 7, 8, or 9
- Leading zeros removed automatically

---

## 📧 Email OTP System

### Development Mode (Current)
```env
USE_SES=false
```
- OTP printed in backend console
- No email actually sent
- Perfect for testing

### Production Mode (Optional)
```env
USE_SES=true
SES_FROM_EMAIL=your-verified-email@example.com
```
- Real emails sent via AWS SES
- Requires email verification
- See AWS_SES_SETUP_GUIDE.md

---

## 🧪 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Can access registration form
- [ ] All fields validate correctly
- [ ] Password strength indicator works
- [ ] Phone auto-formats with +91
- [ ] "Send OTP" generates code
- [ ] OTP appears in backend console
- [ ] Can enter OTP and verify
- [ ] Registration completes
- [ ] Redirects to correct dashboard

---

## 🔍 Finding the OTP

**Look for this in backend terminal:**

```
====================================================================
📧 EMAIL OTP (Development Mode - SES Not Configured)
====================================================================
📬 To: test@example.com
🔢 OTP: 123456  ← Copy this!
⏰ Expires in: 10 minutes
====================================================================
```

---

## ⚙️ Configuration Files

### backend/.env
```env
# AWS SES Configuration
USE_SES=false  # Set to true for real emails
# SES_FROM_EMAIL=noreply@yourdomain.com
```

### Key Files Modified
- `src/pages/Login.tsx` - Registration form
- `backend/src/controllers/auth.controller.ts` - OTP logic
- `backend/src/services/aws/ses.service.ts` - Email service

---

## 🐛 Common Issues

### Issue: "Failed to send OTP"
**Solution:** Check backend console for OTP (development mode)

### Issue: Password too weak
**Solution:** Use 8+ chars with uppercase, lowercase, numbers

### Issue: Invalid phone number  
**Solution:** Enter 10 digits starting with 6-9

### Issue: Email already exists
**Solution:** Use different email or login instead

### Issue: OTP expired
**Solution:** Click "Resend OTP" to get new code

### Issue: Wrong OTP
**Solution:** Check backend console for correct code

---

## 📊 Cost Comparison

| Method | Cost per 1,000 | Cost per 10,000 | Cost per 20,000 |
|--------|----------------|-----------------|-----------------|
| SMS (old) | $6.45 | $64.50 | $129.00 |
| Email (new) | $0.00 | $0.70 | $1.70 |
| **Savings** | **$6.45** | **$63.80** | **$127.30** |

---

## 🎯 Role-Based Redirects

After successful registration:

| Role | Dashboard URL |
|------|---------------|
| Farmer | /farmer |
| Buyer | /buyer |
| Transporter | /transporter |
| Storage Provider | /storage |

---

## 🔧 Useful Commands

```bash
# Test SES configuration
cd backend && npm run test:ses

# Start backend (watch for OTPs)
cd backend && npm run dev

# Start frontend
npm run dev

# Build backend
cd backend && npm run build

# Check AWS SES quota
aws ses get-send-quota --region us-east-1

# Verify email in AWS SES
aws ses verify-email-identity \
  --email-address your@email.com \
  --region us-east-1
```

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `EMAIL_OTP_QUICK_START.md` | Get started quickly |
| `OTP_EMAIL_TROUBLESHOOTING.md` | Fix issues |
| `AWS_SES_SETUP_GUIDE.md` | Production setup |
| `OTP_EMAIL_STATUS.md` | Current status |
| `REGISTRATION_SYSTEM_COMPLETE.md` | Full summary |
| `REGISTRATION_FLOW_DIAGRAM.md` | Visual flow |
| `QUICK_REFERENCE.md` | This file |

---

## ✅ What's Working

- ✅ Registration form with all validations
- ✅ Strong password enforcement
- ✅ Phone auto-formatting (+91)
- ✅ Email validation
- ✅ OTP generation
- ✅ OTP verification
- ✅ User creation in DynamoDB
- ✅ JWT token generation
- ✅ Auto-login after registration
- ✅ Role-based dashboard redirect
- ✅ Development mode (console OTPs)

---

## ⏳ Optional (Production)

- ⏳ AWS SES email verification
- ⏳ Production access request
- ⏳ Real email delivery
- ⏳ Domain verification
- ⏳ Email deliverability monitoring

---

## 🎉 Quick Test Script

```bash
# 1. Start servers
cd backend && npm run dev &
npm run dev &

# 2. Wait for servers to start (10 seconds)
sleep 10

# 3. Open browser
open http://localhost:5173/login

# 4. Register with:
#    Name: Test User
#    Role: Farmer
#    Phone: 9876543210
#    Email: test@example.com
#    Password: Test@123

# 5. Check backend terminal for OTP
# 6. Enter OTP and complete registration
```

---

## 🔐 Security Features

- ✅ Password hashing (bcrypt)
- ✅ OTP expiration (10 minutes)
- ✅ Email verification required
- ✅ JWT authentication
- ✅ No admin public registration
- ✅ Input validation (frontend + backend)
- ✅ Rate limiting on OTP requests

---

## 💡 Pro Tips

1. **Development:** Keep USE_SES=false for faster testing
2. **Console OTP:** Look for 📧 emoji in backend logs
3. **Password:** Use Test@123 for quick testing
4. **Phone:** No need to type +91, just 10 digits
5. **Email:** Any format works in development mode
6. **OTP Resend:** Wait 60 seconds between requests
7. **Production:** Set up AWS SES before launch

---

## 📞 Support

**Issue with registration?**
1. Check backend console for errors
2. Review `OTP_EMAIL_TROUBLESHOOTING.md`
3. Verify all fields meet requirements
4. Try with different email/phone

**Need AWS SES help?**
1. Read `AWS_SES_SETUP_GUIDE.md`
2. Verify email in AWS Console
3. Check IAM permissions
4. Request production access

---

## 🎯 Next Steps

### For Testing (Now)
1. Start backend and frontend
2. Test registration flow
3. Verify OTP system works
4. Check dashboard redirect

### For Production (Later)
1. Verify email in AWS SES
2. Request production access
3. Update USE_SES=true
4. Test real email delivery
5. Monitor bounce rates

---

**Everything is ready to test!** 🚀

Just start the servers and register a user. The OTP will appear in your backend console.

---

**Last Updated:** March 8, 2026

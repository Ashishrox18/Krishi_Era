# Registration OTP Error - Fixed

## 🐛 Issue

When trying to register at http://localhost:5173/login, you received:
```
Failed to send OTP
```

## 🔍 Root Cause

The controller methods in the auth routes were not properly bound to the controller instance. This caused the `this` context to be lost when the methods were called, leading to errors.

## ✅ Fix Applied

Updated `backend/src/routes/auth.routes.ts` to properly bind controller methods:

**Before:**
```typescript
router.post('/send-otp', controller.sendOTP);
```

**After:**
```typescript
router.post('/send-otp', (req, res) => controller.sendOTP(req, res));
```

This ensures the controller methods have the correct `this` context.

## 🧪 Testing the Fix

### Step 1: Restart Backend Server

```bash
cd backend
# Stop the server (Ctrl+C if running)
npm run dev
```

### Step 2: Test the Endpoint

**Option A: Use Test Script**
```bash
cd backend
npm run test:registration
```

This will:
- Send a test registration request
- Show the response or error
- Tell you to check backend console for OTP

**Option B: Test in Browser**
1. Go to http://localhost:5173/login
2. Click "Register"
3. Fill in the form:
   - Name: Test User
   - Role: Farmer
   - Phone: 9876543210
   - Email: test@example.com
   - Password: Test@123
4. Click "Send OTP"
5. Check backend console for OTP

### Step 3: Verify OTP in Console

Look for this in your backend terminal:

```
====================================================================
📧 EMAIL OTP (Development Mode - SES Not Configured)
====================================================================
📬 To: test@example.com
🔢 OTP: 123456
⏰ Expires in: 10 minutes
====================================================================
```

### Step 4: Complete Registration

1. Copy the OTP from backend console
2. Paste it in the registration form
3. Click "Verify & Register"
4. You should be logged in and redirected to the farmer dashboard

## 🔧 What Changed

### Files Modified

1. **backend/src/routes/auth.routes.ts**
   - Fixed controller method binding
   - All routes now properly pass req/res to controller

2. **backend/scripts/test-registration.ts** (new)
   - Test script to verify registration endpoint
   - Helps diagnose issues quickly

## 📊 Expected Behavior

### Successful Registration Flow

1. **User fills form and clicks "Send OTP"**
   - Frontend validates all fields
   - Sends POST request to `/api/auth/send-otp`

2. **Backend processes request**
   - Validates password strength
   - Checks if email/phone already exists
   - Generates 6-digit OTP
   - Stores OTP with email key
   - Attempts to send email (or logs to console)

3. **Backend responds**
   ```json
   {
     "message": "OTP sent successfully to your email",
     "expiresIn": 600
   }
   ```

4. **Frontend shows OTP input**
   - User enters OTP
   - Clicks "Verify & Register"

5. **Backend verifies OTP**
   - Checks OTP matches
   - Checks not expired
   - Creates user account
   - Returns JWT token

6. **User is logged in**
   - Redirected to dashboard based on role

## 🐛 Troubleshooting

### Issue: Still getting "Failed to send OTP"

**Check backend console for specific error:**

1. **"Password must contain..."**
   - Password is too weak
   - Use at least 8 chars with 3 of: uppercase, lowercase, numbers, symbols
   - Example: Test@123

2. **"User with this email already exists"**
   - Email is already registered
   - Try a different email
   - Or login instead

3. **"Invalid phone number"**
   - Phone must be 10 digits starting with 6-9
   - Example: 9876543210
   - Don't include +91 (added automatically)

4. **"Email is required"**
   - Email field is empty
   - Fill in a valid email address

### Issue: Backend not running

**Symptoms:**
- "Failed to send OTP" immediately
- No logs in backend console
- Test script shows "No response received"

**Solution:**
```bash
cd backend
npm run dev
```

Wait for:
```
✅ AWS SES service initialized successfully!
Server running on port 3000
```

### Issue: CORS error

**Symptoms:**
- Browser console shows CORS error
- Network tab shows request blocked

**Solution:**
Backend should already have CORS enabled. If not, check `backend/src/server.ts` has:
```typescript
import cors from 'cors';
app.use(cors());
```

## 📋 Quick Checklist

- [ ] Backend server is running (npm run dev)
- [ ] Frontend is running (npm run dev in root)
- [ ] No errors in backend console on startup
- [ ] Browser can access http://localhost:5173
- [ ] Registration form loads correctly
- [ ] All fields can be filled
- [ ] Password strength indicator works
- [ ] "Send OTP" button is clickable
- [ ] Backend console shows OTP after clicking button
- [ ] Can enter OTP and verify
- [ ] Registration completes successfully

## 🎯 Next Steps

### For Development (Current)

1. ✅ Restart backend server
2. ✅ Test registration flow
3. ✅ Use console OTPs
4. ✅ Verify everything works

### For Production (Optional)

1. ⏳ Verify email in AWS SES
   ```bash
   cd backend
   npm run verify-email your@email.com
   ```

2. ⏳ Test real email delivery
   ```bash
   npm run test:ses
   ```

3. ⏳ Test registration with real emails

## 💡 Pro Tips

**Quick Test:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Test registration
cd backend && npm run test:registration

# Check Terminal 1 for OTP
```

**Debug Mode:**
Add console.log in `backend/src/controllers/auth.controller.ts`:
```typescript
async sendOTP(req: Request, res: Response) {
  console.log('📥 Received sendOTP request:', req.body);
  try {
    // ... rest of code
  }
}
```

**Check Request:**
Open browser DevTools → Network tab → Click "Send OTP" → Check request details

## 🎉 Summary

**Issue:** Controller method binding error
**Fix:** Updated route handlers to properly bind methods
**Status:** ✅ Fixed
**Action:** Restart backend server and test

---

**The registration flow should now work correctly!** 🚀

Just restart your backend server and try registering again. The OTP will appear in your backend console.

---

**Last Updated:** March 8, 2026

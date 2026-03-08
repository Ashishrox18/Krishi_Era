# Registration Flow Diagram

## Current Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Browser    │
│ /login page  │
└──────┬───────┘
       │
       │ 1. User clicks "Register"
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    Registration Form                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Name:     [Test User                    ]             │  │
│  │  Role:     [Farmer ▼]                                  │  │
│  │  Phone:    [9876543210] ← Auto adds +91               │  │
│  │  Email:    [test@example.com] ← Required              │  │
│  │  Password: [••••••••] ← Must be strong                │  │
│  │            [████████░░] Good ✓                         │  │
│  │                                                         │  │
│  │            [Send OTP]                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ 2. Click "Send OTP"
                       ▼
              ┌────────────────┐
              │  Frontend      │
              │  Validation    │
              └────────┬───────┘
                       │
                       │ 3. POST /api/auth/send-otp
                       │    { name, email, password, role, phone }
                       ▼
              ┌────────────────────────────────────────┐
              │         Backend Server                  │
              │  /api/auth/send-otp                    │
              └────────┬───────────────────────────────┘
                       │
                       │ 4. Validate password strength
                       │ 5. Check if user exists
                       │ 6. Generate 6-digit OTP
                       │ 7. Store OTP with email key
                       │
                       ▼
              ┌────────────────────────────────────────┐
              │      AWS SES Service                    │
              │  sesService.sendOTP()                  │
              └────────┬───────────────────────────────┘
                       │
                       │ 8. Check USE_SES flag
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ Development     │         │  Production     │
│ Mode            │         │  Mode           │
│ USE_SES=false   │         │  USE_SES=true   │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ 9a. Print to console      │ 9b. Send via AWS SES
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ Backend Console │         │  User's Email   │
│                 │         │                 │
│ ═══════════════ │         │ ┌─────────────┐ │
│ 📧 EMAIL OTP    │         │ │ From: Krishi│ │
│ ═══════════════ │         │ │ Subject: OTP│ │
│ To: test@...    │         │ │             │ │
│ OTP: 123456     │         │ │ Your OTP:   │ │
│ Expires: 10 min │         │ │   123456    │ │
│ ═══════════════ │         │ └─────────────┘ │
└─────────────────┘         └─────────────────┘
         │                           │
         │ 10. Developer copies OTP  │ 10. User checks email
         │                           │
         └─────────────┬─────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    OTP Verification Screen                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  📧 Verify Your Email                                  │  │
│  │  We've sent a 6-digit OTP to test@example.com         │  │
│  │                                                         │  │
│  │  Enter OTP: [1] [2] [3] [4] [5] [6]                   │  │
│  │                                                         │  │
│  │  [Resend OTP]              [Change Email]              │  │
│  │                                                         │  │
│  │  [Verify & Register]                                   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ 11. User enters OTP
                       │ 12. Click "Verify & Register"
                       ▼
              ┌────────────────┐
              │  Frontend      │
              │  Validation    │
              └────────┬───────┘
                       │
                       │ 13. POST /api/auth/verify-otp
                       │     { email, otp }
                       ▼
              ┌────────────────────────────────────────┐
              │         Backend Server                  │
              │  /api/auth/verify-otp                  │
              └────────┬───────────────────────────────┘
                       │
                       │ 14. Verify OTP matches
                       │ 15. Check not expired
                       │ 16. Hash password
                       │ 17. Create user in DynamoDB
                       │ 18. Generate JWT token
                       │ 19. Clear OTP from store
                       │
                       ▼
              ┌────────────────────────────────────────┐
              │         DynamoDB                        │
              │  krishi-users table                    │
              │  ┌──────────────────────────────────┐  │
              │  │ id: uuid                         │  │
              │  │ email: test@example.com          │  │
              │  │ name: Test User                  │  │
              │  │ role: farmer                     │  │
              │  │ phone: +919876543210             │  │
              │  │ emailVerified: true              │  │
              │  │ password: hashed                 │  │
              │  └──────────────────────────────────┘  │
              └────────────────────────────────────────┘
                       │
                       │ 20. Return user + token
                       ▼
              ┌────────────────┐
              │  Frontend      │
              │  Store token   │
              └────────┬───────┘
                       │
                       │ 21. Redirect based on role
                       │
         ┌─────────────┼─────────────┬─────────────┐
         │             │             │             │
         ▼             ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │ Farmer │   │ Buyer  │   │Transport│   │Storage │
    │Dashboard│   │Dashboard│   │Dashboard│   │Dashboard│
    └────────┘   └────────┘   └────────┘   └────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ✅ REGISTRATION COMPLETE                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Password Strength Validation

```
┌──────────────────────────────────────────────────────────────┐
│                  Password Strength Meter                      │
└──────────────────────────────────────────────────────────────┘

Input: "pass"
├─ Length: 4 chars ❌ (need 8+)
├─ Uppercase: No ❌
├─ Lowercase: Yes ✓
├─ Numbers: No ❌
├─ Special: No ❌
└─ Score: 1/5 → Very Weak 🔴
   [██░░░░░░░░] Cannot submit

Input: "Password"
├─ Length: 8 chars ✓
├─ Uppercase: Yes ✓
├─ Lowercase: Yes ✓
├─ Numbers: No ❌
├─ Special: No ❌
└─ Score: 3/5 → Fair 🟡
   [██████░░░░] Can submit

Input: "Password1"
├─ Length: 9 chars ✓
├─ Uppercase: Yes ✓
├─ Lowercase: Yes ✓
├─ Numbers: Yes ✓
├─ Special: No ❌
└─ Score: 4/5 → Good 🔵
   [████████░░] Can submit

Input: "P@ssw0rd!"
├─ Length: 9 chars ✓
├─ Uppercase: Yes ✓
├─ Lowercase: Yes ✓
├─ Numbers: Yes ✓
├─ Special: Yes ✓
└─ Score: 5/5 → Strong 🟢
   [██████████] Can submit
```

---

## Phone Number Auto-Formatting

```
┌──────────────────────────────────────────────────────────────┐
│                Phone Number Processing                        │
└──────────────────────────────────────────────────────────────┘

User Input          Frontend Processing      Backend Storage
───────────────────────────────────────────────────────────────
9876543210    →     +919876543210      →    +919876543210
8765432109    →     +918765432109      →    +918765432109
09876543210   →     +919876543210      →    +919876543210
+919876543210 →     +919876543210      →    +919876543210

Validation Rules:
✓ Must be 10 digits
✓ Must start with 6, 7, 8, or 9
✓ Auto-adds +91 prefix
✓ Removes leading zeros
```

---

## OTP Storage and Expiration

```
┌──────────────────────────────────────────────────────────────┐
│                  OTP Store (In-Memory)                        │
└──────────────────────────────────────────────────────────────┘

Key: email address
Value: {
  otp: "123456",
  expiresAt: timestamp + 10 minutes,
  userData: {
    name: "Test User",
    email: "test@example.com",
    phone: "+919876543210",
    role: "farmer",
    password: "plaintext (not hashed yet)"
  }
}

Timeline:
─────────────────────────────────────────────────────────────
0:00  │ OTP generated and stored
      │ Email sent (or console logged)
      │
5:00  │ User enters OTP
      │ ✓ Valid (within 10 minutes)
      │ ✓ Registration proceeds
      │
10:00 │ OTP expires
      │ ❌ "OTP has expired"
      │ User must request new OTP
      │
10:01 │ OTP deleted from store
─────────────────────────────────────────────────────────────
```

---

## Development vs Production Mode

```
┌──────────────────────────────────────────────────────────────┐
│              Development Mode (USE_SES=false)                 │
└──────────────────────────────────────────────────────────────┘

Pros:
✓ No AWS setup required
✓ Works immediately
✓ Perfect for testing
✓ No cost
✓ Fast iteration

Cons:
✗ OTPs only in console
✗ Requires terminal access
✗ Not suitable for real users
✗ Can't test email delivery

Use When:
• Local development
• Testing registration flow
• Debugging OTP logic
• Quick prototyping

┌──────────────────────────────────────────────────────────────┐
│              Production Mode (USE_SES=true)                   │
└──────────────────────────────────────────────────────────────┘

Pros:
✓ Real email delivery
✓ Professional appearance
✓ Works for all users
✓ No terminal access needed
✓ Scalable

Cons:
✗ Requires AWS SES setup
✗ Email verification needed
✗ May need production access
✗ Small cost (after free tier)

Use When:
• Production deployment
• User acceptance testing
• Demo to stakeholders
• Real user registration
```

---

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Error Scenarios                            │
└──────────────────────────────────────────────────────────────┘

Scenario 1: Weak Password
─────────────────────────────────────────────────────────────
User enters: "pass123"
Frontend: ❌ Shows "Weak" indicator
Backend: ❌ Returns 400 "Password must contain..."
Result: User must strengthen password

Scenario 2: Email Already Exists
─────────────────────────────────────────────────────────────
User enters: existing@example.com
Frontend: ✓ Passes validation
Backend: ❌ Checks DynamoDB, finds existing user
Backend: ❌ Returns 400 "User already exists"
Result: User must use different email or login

Scenario 3: Invalid Phone Number
─────────────────────────────────────────────────────────────
User enters: "1234567890"
Frontend: ❌ Pattern validation fails
Backend: ❌ Returns 400 "Invalid phone number"
Result: User must enter valid number (6-9 start)

Scenario 4: OTP Expired
─────────────────────────────────────────────────────────────
User waits 11 minutes
User enters OTP
Backend: ❌ Checks timestamp, expired
Backend: ❌ Returns 400 "OTP has expired"
Result: User must request new OTP

Scenario 5: Wrong OTP
─────────────────────────────────────────────────────────────
User enters: "999999"
Actual OTP: "123456"
Backend: ❌ Compares, doesn't match
Backend: ❌ Returns 400 "Invalid OTP"
Result: User can retry (OTP still valid)

Scenario 6: SES Not Configured
─────────────────────────────────────────────────────────────
USE_SES=false
User clicks "Send OTP"
Backend: ⚠️  Falls back to console logs
Backend: ✓ Returns 200 "OTP sent successfully"
Console: 📧 Displays OTP
Result: Developer copies OTP from console
```

---

## Security Features

```
┌──────────────────────────────────────────────────────────────┐
│                    Security Measures                          │
└──────────────────────────────────────────────────────────────┘

1. Password Security
   ├─ Minimum 8 characters
   ├─ Complexity requirements (3 of 4 types)
   ├─ Bcrypt hashing (10 rounds)
   └─ Never stored in plain text

2. OTP Security
   ├─ 6-digit random code
   ├─ 10-minute expiration
   ├─ Single use (deleted after verification)
   ├─ Stored with email key
   └─ Rate limiting (60s between requests)

3. Email Verification
   ├─ Required for registration
   ├─ Format validation
   ├─ Uniqueness check
   └─ Marked as verified after OTP

4. Phone Validation
   ├─ Indian mobile format
   ├─ Starts with 6-9
   ├─ Exactly 10 digits
   └─ Auto-formatted with +91

5. JWT Tokens
   ├─ Signed with secret key
   ├─ 7-day expiration
   ├─ Contains user ID, email, role
   └─ Required for authenticated routes

6. No Admin Registration
   ├─ Admin role removed from form
   ├─ Prevents privilege escalation
   └─ Admin accounts created separately
```

---

## Data Flow Summary

```
┌──────────────────────────────────────────────────────────────┐
│                    Data Transformations                       │
└──────────────────────────────────────────────────────────────┘

User Input → Frontend → Backend → Database
──────────────────────────────────────────────────────────────

Name:
"Test User" → "Test User" → "Test User" → "Test User"

Email:
"test@example.com" → "test@example.com" → "test@example.com" → "test@example.com"

Phone:
"9876543210" → "+919876543210" → "+919876543210" → "+919876543210"

Password:
"Test@123" → "Test@123" → bcrypt.hash() → "$2a$10$..."

Role:
"farmer" → "farmer" → "farmer" → "farmer"

OTP:
(generated) → (not sent) → "123456" → (not stored)

Email Verified:
(not set) → (not set) → (after OTP) → true

Created At:
(not set) → (not set) → new Date() → "2026-03-08T..."
```

---

**This diagram shows the complete registration flow from user input to database storage!**

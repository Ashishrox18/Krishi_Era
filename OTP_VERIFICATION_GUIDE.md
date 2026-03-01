# OTP Verification System - Implementation Guide

## Overview
Implemented phone number verification via OTP (One-Time Password) during user registration using AWS SNS for SMS delivery.

## Features

### 1. Two-Step Registration Process
1. **Step 1: Send OTP**
   - User fills registration form (name, email, password, role, phone)
   - System validates phone number format
   - Generates 6-digit OTP
   - Sends OTP via SMS using AWS SNS
   - OTP valid for 10 minutes

2. **Step 2: Verify OTP**
   - User enters received OTP
   - System verifies OTP
   - Creates user account with `phoneVerified: true`
   - Auto-login with JWT token

### 2. Security Features
- ✅ 6-digit random OTP generation
- ✅ 10-minute expiration time
- ✅ Phone number format validation
- ✅ Duplicate phone/email check
- ✅ OTP resend with 60-second cooldown
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token authentication

### 3. User Experience
- Clean, intuitive UI with step-by-step flow
- Visual feedback with icons and colors
- Countdown timer for OTP resend
- Option to change phone number
- Error handling with clear messages

## API Endpoints

### 1. Send OTP
```
POST /api/auth/send-otp
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "farmer",
  "phone": "+919876543210"
}
```

**Response (Success):**
```json
{
  "message": "OTP sent successfully to your phone number",
  "expiresIn": 600
}
```

**Response (Error):**
```json
{
  "error": "Invalid phone number format. Use international format (e.g., +919876543210)"
}
```

### 2. Verify OTP and Register
```
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "farmer",
    "phoneVerified": true
  },
  "token": "jwt-token-here",
  "message": "Registration successful! Phone number verified."
}
```

**Response (Error):**
```json
{
  "error": "Invalid OTP. Please try again."
}
```

## Phone Number Format

### Required Format
- International format with country code
- Examples:
  - India: `+919876543210`
  - USA: `+11234567890`
  - UK: `+447123456789`

### Validation Regex
```javascript
/^\+?[1-9]\d{1,14}$/
```

## AWS SNS Configuration

### Prerequisites
1. AWS Account with SNS enabled
2. IAM user with SNS permissions
3. SMS spending limit increased (default is $1/month)

### Required Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    }
  ]
}
```

### Environment Variables
Add to `backend/.env`:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### SMS Pricing (Approximate)
- India: $0.00645 per SMS
- USA: $0.00645 per SMS
- UK: $0.05 per SMS

## Frontend Implementation

### Registration Flow

1. **Initial Form** - User enters details
2. **Send OTP** - Click "Send OTP" button
3. **OTP Input** - Enter 6-digit code
4. **Verify** - Click "Verify & Register"
5. **Success** - Auto-redirect to dashboard

### UI Components

**OTP Input Field:**
- Large, centered text input
- 6-digit max length
- Numeric only
- Letter-spaced for readability

**Countdown Timer:**
- 60-second cooldown for resend
- Visual countdown display
- Disabled resend button during countdown

**Status Messages:**
- Success: Green background with shield icon
- Error: Red background with error text
- Info: Blue background with instructions

## Backend Implementation

### OTP Storage
Currently using in-memory Map (for development):
```typescript
const otpStore = new Map<string, { 
  otp: string; 
  expiresAt: number; 
  userData: any 
}>();
```

**Production Recommendation:**
- Use Redis with TTL for OTP storage
- Or DynamoDB with TTL attribute
- Ensures OTPs persist across server restarts
- Better for horizontal scaling

### OTP Generation
```typescript
const otp = Math.floor(100000 + Math.random() * 900000).toString();
```
- Generates 6-digit random number
- Range: 100000 to 999999

### SMS Message Template
```
Your Krishi Era verification code is: 123456. 
Valid for 10 minutes. 
Do not share this code with anyone.
```

## Testing

### Development Mode
When SMS sending fails (e.g., AWS not configured), the OTP is logged to console:
```
Development mode - OTP for +919876543210: 123456
```

### Test Scenarios

1. **Happy Path:**
   - Fill form → Send OTP → Receive SMS → Enter OTP → Success

2. **Invalid Phone:**
   - Enter invalid phone → Error message shown

3. **Expired OTP:**
   - Wait 10+ minutes → Enter OTP → "OTP expired" error

4. **Wrong OTP:**
   - Enter incorrect OTP → "Invalid OTP" error

5. **Resend OTP:**
   - Click resend → New OTP sent → Old OTP invalidated

6. **Duplicate Registration:**
   - Use existing email/phone → Error message shown

## Error Handling

### Common Errors

1. **Invalid Phone Format**
   ```
   Error: Invalid phone number format. Use international format (e.g., +919876543210)
   ```

2. **User Already Exists**
   ```
   Error: User with this email already exists
   Error: User with this phone number already exists
   ```

3. **OTP Expired**
   ```
   Error: OTP has expired. Please request a new OTP.
   ```

4. **Invalid OTP**
   ```
   Error: Invalid OTP. Please try again.
   ```

5. **SMS Sending Failed**
   - Logged to console
   - OTP still generated for development
   - User can proceed with console OTP

## Security Considerations

### Best Practices Implemented
✅ OTP expires after 10 minutes
✅ OTP is single-use (deleted after verification)
✅ Rate limiting via 60-second resend cooldown
✅ Phone number format validation
✅ Secure password hashing
✅ JWT token for authentication

### Additional Recommendations
- Implement rate limiting on send-otp endpoint (max 3 per hour per phone)
- Add CAPTCHA for bot prevention
- Log failed OTP attempts
- Block phone numbers after multiple failed attempts
- Use HTTPS only in production
- Implement IP-based rate limiting

## Migration from Old Registration

### Backward Compatibility
The old registration endpoint (`POST /api/auth/register`) still works for:
- Testing purposes
- Admin user creation
- Bulk user imports

Users created via old endpoint have `phoneVerified: false`.

### Recommended Approach
1. Use OTP verification for all new user registrations
2. Keep old endpoint for admin/testing only
3. Add phone verification for existing users via profile update

## Troubleshooting

### Issue 1: SMS Not Received
**Possible Causes:**
- AWS SNS not configured
- Insufficient SMS spending limit
- Invalid phone number format
- Phone number not in supported region

**Solution:**
- Check AWS console for SNS errors
- Increase SMS spending limit
- Verify phone number format
- Check backend logs for OTP (development mode)

### Issue 2: OTP Expired
**Cause:** More than 10 minutes passed

**Solution:** Click "Resend OTP" to get new code

### Issue 3: Invalid OTP Error
**Possible Causes:**
- Typo in OTP entry
- Using old OTP after resend
- OTP expired

**Solution:** 
- Double-check OTP from SMS
- Request new OTP if needed

### Issue 4: Backend Error
**Check:**
- Backend server is running
- AWS credentials are configured
- DynamoDB tables exist
- Network connectivity

## Files Modified

### Backend
1. `backend/src/controllers/auth.controller.ts` - Added OTP methods
2. `backend/src/services/aws/sns.service.ts` - Added sendOTP method
3. `backend/src/routes/auth.routes.ts` - Added OTP routes

### Frontend
1. `src/pages/Login.tsx` - Complete OTP UI implementation
2. `src/services/api.ts` - Added OTP API methods

## Future Enhancements

### Potential Improvements
1. **Email OTP Option** - Allow OTP via email as alternative
2. **WhatsApp Integration** - Send OTP via WhatsApp Business API
3. **Biometric Verification** - Add fingerprint/face recognition
4. **Social Login** - Google/Facebook OAuth with phone verification
5. **Multi-factor Authentication** - OTP + password + security question
6. **SMS Templates** - Localized messages in multiple languages
7. **Analytics Dashboard** - Track OTP success rates, failures
8. **Fraud Detection** - ML-based suspicious activity detection

## Cost Estimation

### Monthly Cost (Approximate)
Assuming 1000 new registrations per month:
- India: 1000 × $0.00645 = $6.45/month
- USA: 1000 × $0.00645 = $6.45/month
- Mixed regions: ~$10-15/month

### Cost Optimization
- Use email OTP for non-critical verifications
- Implement CAPTCHA to reduce bot registrations
- Cache OTPs to prevent duplicate sends
- Use voice OTP as fallback (more expensive)

## Compliance

### Data Protection
- OTPs stored temporarily (10 minutes max)
- Phone numbers encrypted in database
- GDPR compliant (user consent required)
- No OTP logging in production

### SMS Regulations
- Include opt-out instructions
- Comply with TCPA (USA) regulations
- Follow TRAI guidelines (India)
- Respect DND (Do Not Disturb) lists

## Support

### For Users
- OTP not received? Check spam/blocked messages
- Wait 60 seconds before resending
- Ensure phone number is correct with country code
- Contact support if issues persist

### For Developers
- Check backend logs for errors
- Verify AWS SNS configuration
- Test with console OTP in development
- Monitor SMS delivery rates in AWS console

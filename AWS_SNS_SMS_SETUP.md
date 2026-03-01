# AWS SNS SMS Setup Guide

## Overview
To send SMS via AWS SNS, you need to configure your AWS account and increase SMS spending limits.

## Prerequisites
- AWS Account
- AWS CLI installed and configured
- IAM user with SNS permissions

## Step-by-Step Setup

### Step 1: Verify AWS Credentials

Check if your AWS credentials are configured:

```bash
aws configure list
```

If not configured, run:

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format: `json`

### Step 2: Check Current SMS Spending Limit

```bash
aws sns get-sms-attributes
```

Look for `MonthlySpendLimit` - default is usually $1.00 USD.

### Step 3: Request SMS Spending Limit Increase

**Important:** AWS has a default SMS spending limit of $1.00/month. You need to increase this.

1. Go to AWS Console: https://console.aws.amazon.com/support/home
2. Click "Create case"
3. Select "Service limit increase"
4. For "Limit type", select "SNS Text Messaging"
5. Fill in the form:
   - **Region:** Your region (e.g., us-east-1)
   - **Resource Type:** General Limits
   - **Limit:** Account spending limit
   - **New limit value:** $10 or higher (based on your needs)
   - **Use case description:** 
     ```
     We are building an agricultural platform (Krishi Era) that requires 
     SMS OTP verification for user registration. We expect approximately 
     1000 registrations per month. Please increase our SMS spending limit 
     to $10/month.
     ```

6. Submit the request
7. AWS typically responds within 24 hours

### Step 4: Enable SMS in Your Region

Some regions require SMS to be enabled. Run:

```bash
aws sns set-sms-attributes \
  --attributes DefaultSMSType=Transactional
```

### Step 5: Set SMS Preferences (Optional but Recommended)

```bash
# Set default sender ID (not supported in all countries)
aws sns set-sms-attributes \
  --attributes DefaultSenderID=KrishiEra

# Set SMS type to Transactional (higher priority, more expensive)
aws sns set-sms-attributes \
  --attributes DefaultSMSType=Transactional
```

### Step 6: Test SMS Sending

Test if SMS works:

```bash
aws sns publish \
  --phone-number "+919876543210" \
  --message "Test message from Krishi Era"
```

Replace `+919876543210` with your actual phone number.

### Step 7: Verify IAM Permissions

Your IAM user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:GetSMSAttributes",
        "sns:SetSMSAttributes"
      ],
      "Resource": "*"
    }
  ]
}
```

To add these permissions:
1. Go to IAM Console
2. Select your user
3. Click "Add permissions" → "Attach policies directly"
4. Search for "SNS" and attach "AmazonSNSFullAccess" (or create custom policy above)

### Step 8: Update Backend Environment Variables

Ensure your `backend/.env` has:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
```

### Step 9: Restart Backend Server

After configuration:
```bash
cd backend
npm run dev
```

## Country-Specific Requirements

### India
- Requires DLT (Distributed Ledger Technology) registration
- Need to register sender ID and message templates
- Process can take 2-3 weeks
- Alternative: Use international SMS (more expensive)

### USA
- Requires 10DLC registration for application-to-person (A2P) messaging
- Can use long codes for testing
- Production requires proper registration

### Other Countries
- Check AWS SNS documentation for country-specific requirements
- Some countries don't support sender ID
- Some require pre-registration

## Development Workaround

For development/testing without AWS SNS:

### Option 1: Use Console OTP
The backend logs OTP to console. Check backend terminal:
```
OTP sent to +919876543210: 123456
```

Use this OTP in the frontend.

### Option 2: Mock SMS Service
Update `backend/src/services/aws/sns.service.ts`:

```typescript
async sendOTP(phoneNumber: string, otp: string) {
  // Development mode - just log
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
    return { MessageId: 'dev-mode-' + Date.now() };
  }
  
  // Production - send actual SMS
  const message = `Your Krishi Era verification code is: ${otp}. Valid for 10 minutes.`;
  const command = new PublishCommand({
    Message: message,
    PhoneNumber: phoneNumber,
  });
  return await client.send(command);
}
```

### Option 3: Use Email Instead
Temporarily use email for OTP instead of SMS:
- Use AWS SES (Simple Email Service)
- Or use services like SendGrid, Mailgun
- Much easier to set up for development

## Troubleshooting

### Error: "Invalid parameter: PhoneNumber"
- Check phone number format (must include country code)
- Example: `+919876543210` (not `9876543210`)

### Error: "User is not authorized to perform: SNS:Publish"
- IAM user lacks SNS permissions
- Add SNS permissions to IAM user

### Error: "Monthly SMS spending limit exceeded"
- Default limit is $1/month
- Request limit increase (see Step 3)

### SMS Not Received
- Check if phone number is correct
- Verify country supports SMS
- Check AWS CloudWatch logs for delivery status
- Some carriers block promotional SMS

### Error: "Endpoint not found"
- Wrong AWS region
- Update AWS_REGION in .env file

## Cost Estimation

### SMS Pricing (Approximate)
- **India:** $0.00645 per SMS
- **USA:** $0.00645 per SMS  
- **UK:** $0.05 per SMS
- **Other countries:** Varies

### Monthly Cost Examples
- 100 registrations: ~$0.65 (India/USA)
- 500 registrations: ~$3.25 (India/USA)
- 1000 registrations: ~$6.50 (India/USA)

## Alternative Solutions

### 1. Twilio
- Easier setup than AWS SNS
- Better documentation
- Slightly more expensive
- Free trial credits available

```bash
npm install twilio
```

### 2. Firebase Phone Auth
- Google's phone authentication
- Easy integration
- Free tier available
- Good for mobile apps

### 3. MSG91 (India-specific)
- Popular in India
- Competitive pricing
- Good delivery rates
- Easy API

### 4. Email OTP
- Use AWS SES or SendGrid
- Much easier to set up
- Free tier available
- Good for development

## Quick Start for Development

**Recommended approach for immediate testing:**

1. **Use Console OTP** (Easiest)
   - Check backend logs for OTP
   - Enter OTP manually in frontend
   - No AWS configuration needed

2. **Set up Email OTP** (Better for development)
   - Use Gmail SMTP or SendGrid
   - Easier than SMS
   - Free tier available

3. **Configure AWS SNS** (For production)
   - Follow steps above
   - Request spending limit increase
   - Takes 24-48 hours

## Current Status

Based on your backend logs, the system is working correctly:
- ✅ OTP generation working
- ✅ OTP storage working
- ✅ OTP logged to console
- ⚠️ SMS sending needs AWS SNS configuration

**For now, use the OTP from backend console logs to test the system.**

## Next Steps

1. **Immediate:** Use console OTP for testing
2. **Short-term:** Set up email OTP for development
3. **Long-term:** Configure AWS SNS for production SMS

## Support Resources

- AWS SNS Documentation: https://docs.aws.amazon.com/sns/
- AWS SNS SMS Pricing: https://aws.amazon.com/sns/sms-pricing/
- AWS Support: https://console.aws.amazon.com/support/
- Twilio Documentation: https://www.twilio.com/docs/sms

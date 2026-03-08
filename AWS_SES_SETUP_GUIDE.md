# AWS SES Setup Guide for Krishi Era

## Step 1: Verify Your Email Address in AWS SES

### Option A: Using AWS Console (Recommended for Quick Setup)

1. **Go to AWS SES Console**
   - Open: https://console.aws.amazon.com/ses/
   - Make sure you're in the correct region (us-east-1)

2. **Verify an Email Address**
   - Click "Verified identities" in the left sidebar
   - Click "Create identity"
   - Select "Email address"
   - Enter your email (e.g., `noreply@yourdomain.com` or your personal email)
   - Click "Create identity"

3. **Check Your Email**
   - AWS will send a verification email
   - Click the verification link in the email
   - Return to AWS console and refresh - status should be "Verified"

### Option B: Using AWS CLI

```bash
# Verify an email address
aws ses verify-email-identity --email-address noreply@yourdomain.com --region us-east-1

# Check verification status
aws ses get-identity-verification-attributes --identities noreply@yourdomain.com --region us-east-1
```

## Step 2: Request Production Access (Move Out of Sandbox)

### Why This is Important
- **Sandbox Mode**: Can only send to verified emails, 200 emails/day limit
- **Production Mode**: Can send to any email, no daily limit

### How to Request

1. **Go to SES Console**
   - https://console.aws.amazon.com/ses/

2. **Request Production Access**
   - Click "Account dashboard" in left sidebar
   - Look for "Sending statistics" section
   - Click "Request production access" button

3. **Fill Out the Form**
   ```
   Mail Type: Transactional
   
   Website URL: https://yourdomain.com (or http://localhost:5173 for testing)
   
   Use Case Description:
   "We are building Krishi Era, an agricultural intelligence platform that 
   connects farmers, buyers, transporters, and storage providers. We need 
   to send transactional emails for:
   - User registration OTP verification
   - Password reset codes
   - Order confirmations
   - Notification alerts
   
   Expected volume: 1,000-10,000 emails per month
   We have implemented proper opt-in mechanisms and will honor unsubscribe requests."
   
   Compliance: 
   "We only send emails to users who have explicitly registered on our platform.
   We do not purchase email lists. We include unsubscribe links in all marketing 
   emails (though OTP emails are transactional and exempt)."
   
   Process for Bounces/Complaints:
   "We monitor SES bounce and complaint notifications. We automatically remove 
   bounced emails from our system and honor all unsubscribe requests immediately."
   ```

4. **Submit and Wait**
   - Usually approved within 24 hours
   - You'll receive an email notification

## Step 3: Configure Your Application

### Update backend/.env

```env
# AWS Configuration (already set)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIARY***********XOUP
AWS_SECRET_ACCESS_KEY=***********************************

# Enable SES
USE_SES=true

# SES Configuration
SES_FROM_EMAIL=noreply@yourdomain.com
# Or use your verified email:
# SES_FROM_EMAIL=your-verified-email@gmail.com
```

### Update ses.service.ts (if needed)

The service is already configured, but you can customize the from email:

```typescript
// In backend/src/services/aws/ses.service.ts
private fromEmail: string = process.env.SES_FROM_EMAIL || 'noreply@krishiera.com';
```

## Step 4: Test SES Configuration

### Run the Test Script

```bash
cd backend
npm run test:ses
```

Or manually:

```bash
cd backend
npx ts-node scripts/test-ses.ts
```

### What the Test Does
1. Checks if AWS credentials are configured
2. Verifies SES service initialization
3. Sends a test OTP email
4. Reports success or errors

## Step 5: Verify Email Delivery

### Test Registration Flow

1. **Start the application**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd .. && npm run dev
   ```

2. **Register a new user**
   - Go to http://localhost:5173/login
   - Click "Register"
   - Fill in details with a real email address
   - Click "Send OTP"

3. **Check for OTP**
   - **If SES is configured**: Check your email inbox (and spam folder)
   - **If SES is not configured**: Check backend console logs for OTP

## Troubleshooting

### Issue: "Email address is not verified"

**Solution**: 
- In sandbox mode, you can only send to verified email addresses
- Verify the recipient email in SES console
- OR request production access (recommended)

### Issue: "MessageRejected: Email address is not verified"

**Solution**:
```bash
# Verify your FROM email address
aws ses verify-email-identity --email-address noreply@yourdomain.com --region us-east-1
```

### Issue: "AccessDenied" or "UnauthorizedOperation"

**Solution**:
- Check AWS credentials in backend/.env
- Ensure IAM user has SES permissions:
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

### Issue: Emails going to spam

**Solutions**:
1. **Verify your domain** (instead of just email)
   - Add SPF, DKIM, and DMARC records
   - This significantly improves deliverability

2. **Use a custom domain**
   - Gmail/Yahoo addresses may have lower deliverability
   - Use your own domain (e.g., noreply@krishiera.com)

3. **Request dedicated IP** (optional, $24.95/month)
   - Better for high-volume senders
   - Improves reputation over time

## Advanced: Domain Verification (Recommended for Production)

### Benefits
- Better email deliverability
- Can send from any email @yourdomain.com
- Professional appearance
- Required for some email clients

### Steps

1. **Add Domain in SES**
   - Go to SES Console → Verified identities
   - Click "Create identity"
   - Select "Domain"
   - Enter your domain (e.g., krishiera.com)

2. **Add DNS Records**
   - AWS will provide DNS records (TXT, CNAME, MX)
   - Add these to your domain's DNS settings
   - Wait for verification (can take up to 72 hours)

3. **Configure DKIM**
   - Automatically provided by AWS
   - Improves email authentication

## Monitoring and Limits

### Check Your Sending Limits

```bash
aws ses get-send-quota --region us-east-1
```

Output:
```json
{
  "Max24HourSend": 200.0,      // Daily limit
  "MaxSendRate": 1.0,          // Emails per second
  "SentLast24Hours": 0.0       // Sent today
}
```

### Monitor Bounces and Complaints

1. **Set up SNS notifications** (optional)
   - Get notified of bounces and complaints
   - Automatically handle bad email addresses

2. **Check SES Dashboard**
   - Monitor sending statistics
   - Track bounce and complaint rates
   - Keep bounce rate < 5% and complaint rate < 0.1%

## Cost Estimation

### Your Expected Usage

**Development/Testing**: 
- ~50 emails/month
- Cost: $0 (within free tier)

**Launch (First 3 months)**:
- ~500 registrations/month
- Cost: $0 (within 3,000 free tier)

**Growth (6-12 months)**:
- ~5,000 registrations/month
- 3,000 free + 2,000 paid = $0.20/month

**Mature (1+ year)**:
- ~20,000 registrations/month
- Cost: ~$2/month

## Security Best Practices

1. **Rotate AWS Credentials Regularly**
   - Change access keys every 90 days
   - Use IAM roles when possible

2. **Monitor for Abuse**
   - Set up CloudWatch alarms for unusual sending patterns
   - Implement rate limiting in your application

3. **Validate Email Addresses**
   - Check email format before sending
   - Remove bounced emails from your database

4. **Use Environment Variables**
   - Never commit AWS credentials to git
   - Keep backend/.env in .gitignore

## Next Steps

1. ✅ Verify your email address in SES
2. ✅ Request production access
3. ✅ Update backend/.env with USE_SES=true
4. ✅ Run test script to verify setup
5. ✅ Test registration flow
6. 🎉 Launch to production!

## Support

- **AWS SES Documentation**: https://docs.aws.amazon.com/ses/
- **AWS Support**: https://console.aws.amazon.com/support/
- **SES Forum**: https://forums.aws.amazon.com/forum.jspa?forumID=90

---

**Current Status**: 
- ✅ SES service code implemented
- ✅ AWS SDK installed
- ⏳ Waiting for email verification
- ⏳ Waiting for production access request

**Estimated Setup Time**: 30 minutes + 24 hours for AWS approval

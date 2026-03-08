# How to Send OTP to ANY Email Address

## The Issue

Right now, AWS SES is in **SANDBOX MODE**, which means:
- ❌ Can only send to verified email addresses
- ❌ Each recipient must be verified individually
- ❌ Not practical for real users

## The Solution: Production Access

Request **Production Access** from AWS to remove all restrictions:
- ✅ Send to ANY email address
- ✅ No verification needed for recipients
- ✅ 50,000+ emails per day
- ✅ Takes ~24 hours to approve

---

## Quick Instructions

### Step 1: View Instructions

```bash
cd backend
npm run request-production
```

This shows you exactly what to do.

### Step 2: Open AWS Console

Go to: https://console.aws.amazon.com/ses/

### Step 3: Request Production Access

1. Click **"Account Dashboard"** in left sidebar
2. Find **"Production access"** section
3. Click **"Request production access"** button
4. Fill out the form (see template below)
5. Submit

### Step 4: Wait for Approval

- Usually approved within **24 hours**
- You'll receive an email notification
- After approval, you can send to ANY email!

---

## Form Template

Copy and paste this into the AWS form:

**Mail Type:**
```
Transactional
```

**Website URL:**
```
http://localhost:5173
```
(or your production domain)

**Use Case Description:**
```
We are building Krishi Era, an agricultural intelligence platform that connects farmers, buyers, transporters, and storage providers in India.

We need to send transactional emails for:
- User registration OTP verification
- Password reset codes
- Order confirmations
- Transaction notifications

Expected volume: 1,000-10,000 emails per month

We have implemented proper opt-in mechanisms and will honor all unsubscribe requests immediately.
```

**Compliance:**
```
We only send emails to users who have explicitly registered on our platform. We do not purchase or rent email lists. All emails are transactional and related to user-initiated actions.

We include unsubscribe links in all marketing emails (OTP emails are transactional and exempt).
```

**Bounce/Complaint Process:**
```
We monitor AWS SES bounce and complaint notifications. We automatically remove bounced email addresses from our system. We honor all unsubscribe requests immediately and maintain a suppression list.
```

---

## After Approval

Once approved (usually 24 hours):

### 1. Verify Your Sender Email

```bash
cd backend
npm run verify-email noreply@yourdomain.com
```

This is the "FROM" address. You only need to verify this ONE email.

### 2. Restart Backend

```bash
npm run dev
```

### 3. Test Registration

Go to http://localhost:5173/login and register with ANY email address. The OTP will be sent!

---

## Alternative: Test Now Without Waiting

If you need to test immediately:

### Option 1: Use Console Logs (Current Setup)

**No changes needed!** Just use the system as-is:

1. Register at http://localhost:5173/login
2. Check backend console for OTP
3. Enter OTP and complete registration

**Pros:**
- Works immediately
- No AWS setup needed
- Perfect for development

**Cons:**
- Not suitable for real users
- Requires terminal access

### Option 2: Verify Test Emails

For testing with a few specific emails:

```bash
cd backend
npm run verify-email test1@example.com
npm run verify-email test2@example.com
```

Each email needs verification, but then you can send OTPs to them.

---

## Comparison

| Feature | Sandbox (Current) | Production (After Request) |
|---------|-------------------|----------------------------|
| Send to any email | ❌ No | ✅ Yes |
| Recipient verification | ✅ Required | ❌ Not required |
| Daily limit | 200 emails | 50,000+ emails |
| Setup time | Immediate | ~24 hours |
| Cost | Free | Free (3,000/month) |

---

## Recommended Approach

### For Development (Now)
1. ✅ Keep using console logs
2. ✅ Test registration flow
3. ✅ Verify everything works

### For Production (Before Launch)
1. ⏳ Request production access (24 hours)
2. ⏳ Verify sender email (2 minutes)
3. ⏳ Update USE_SES=true
4. ⏳ Test with real emails
5. ⏳ Launch!

---

## Quick Commands

```bash
# View production access instructions
npm run request-production

# Check current SES status
npm run auto-setup-ses

# Verify sender email (after production access)
npm run verify-email noreply@yourdomain.com

# Test email sending
npm run test:ses

# Start backend
npm run dev
```

---

## Summary

**To send OTP to ANY email:**
1. Request production access in AWS Console
2. Wait ~24 hours for approval
3. Verify your sender email
4. Done! Can send to any email address

**For testing now:**
- Use console logs (current setup)
- Or verify specific test emails

---

**AWS Console:** https://console.aws.amazon.com/ses/

**Detailed Guide:** See `AWS_SES_SETUP_GUIDE.md`

---

**Last Updated:** March 8, 2026

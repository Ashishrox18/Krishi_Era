# Switch to AWS DynamoDB

## What Changed

Your application now uses AWS DynamoDB instead of local JSON files for data storage.

## Setup Steps

### 1. Verify AWS Credentials

Your `.env` file should have AWS credentials:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
USE_LOCAL_STORAGE=false
```

### 2. Create DynamoDB Tables

Run this command from the backend directory:

```bash
cd backend
npm run setup-dynamodb
```

This will create 6 tables:
- `krishi-users` - User accounts
- `krishi-crops` - Crop planning data
- `krishi-orders` - Orders and listings
- `krishi-shipments` - Transport bookings
- `krishi-storage` - Storage bookings
- `krishi-transactions` - Payment records

### 3. Restart Backend Server

```bash
npm run dev
```

## What to Expect

### First Time Setup
- Tables will be created in AWS DynamoDB
- No existing data (fresh start)
- You'll need to register new users

### Data Migration (Optional)

If you want to migrate data from local storage to DynamoDB:

1. Your local data is in: `backend/data/*.json`
2. You can manually import this data or:
   - Keep `USE_LOCAL_STORAGE=true` temporarily
   - Export data to a backup
   - Switch to `USE_LOCAL_STORAGE=false`
   - Import data via API calls

## Costs

DynamoDB pricing (as of 2024):
- **Free Tier**: 25 GB storage, 25 read/write capacity units
- **Your setup**: Uses 5 read + 5 write units per table
- **Estimated cost**: $0-5/month for development (within free tier)

## Verify Setup

1. **Check AWS Console**:
   - Go to: https://console.aws.amazon.com/dynamodb/
   - Region: us-east-1
   - You should see 6 tables

2. **Test the App**:
   - Register a new user
   - Plan a crop
   - Check if data persists after server restart

## Troubleshooting

### Error: "ResourceNotFoundException"
- Tables don't exist yet
- Run: `npm run setup-dynamodb`

### Error: "AccessDeniedException"
- AWS credentials are invalid
- Check your `.env` file
- Verify IAM permissions in AWS Console

### Error: "ResourceInUseException"
- Tables already exist (this is OK)
- You can continue using the app

### Want to Switch Back to Local Storage?

Change in `.env`:
```env
USE_LOCAL_STORAGE=true
```

Then restart the backend server.

## Benefits of DynamoDB

✅ **Production-ready**: Scalable and reliable
✅ **No data loss**: Data persists even if server crashes
✅ **Multi-user**: Handles concurrent access properly
✅ **Backup**: AWS handles backups automatically
✅ **Fast**: Low latency queries

## Next Steps

1. Run `npm run setup-dynamodb` to create tables
2. Restart your backend server
3. Test by creating a new user and planning crops
4. Verify data persists after server restart

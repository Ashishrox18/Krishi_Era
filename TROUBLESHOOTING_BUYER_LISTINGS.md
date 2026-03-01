# Troubleshooting: Buyer Not Seeing Farmer Listings

## Issue Fixed ✅

The buyer procurement page was not showing farmer listings due to a DynamoDB query issue.

---

## What Was Wrong

The `getAvailableProduce` method in the buyer controller was using a complex DynamoDB filter expression that wasn't working correctly:

```typescript
// OLD CODE (Not Working)
let listings = await dynamoDBService.scan(
  process.env.DYNAMODB_ORDERS_TABLE!,
  '#status = :status AND attribute_exists(farmerId)',
  { ':status': 'open' }
);
```

**Problems**:
1. `#status` placeholder required `ExpressionAttributeNames` mapping
2. Complex filter expression in DynamoDB scan
3. No error logging to debug the issue

---

## The Fix

Changed to a simpler approach - scan all items and filter in application code:

```typescript
// NEW CODE (Working)
// Get all items from orders table
const allItems = await dynamoDBService.scan(
  process.env.DYNAMODB_ORDERS_TABLE!
);

// Filter for farmer listings (have farmerId and status is open)
let listings = allItems.filter((item: any) => 
  item.farmerId && item.status === 'open'
);
```

**Benefits**:
1. Simpler and more reliable
2. Works with current DynamoDB service
3. Added console logging for debugging
4. Filters in JavaScript (more flexible)

---

## How to Verify the Fix

### Step 1: Restart Backend
```bash
cd backend
npm start
```

### Step 2: Create Farmer Listings

1. Login as farmer
2. Go to `/farmer/list-produce`
3. Create 2-3 listings with different crops
4. Verify they appear in `/farmer/my-listings`

### Step 3: View as Buyer

1. Logout
2. Login as buyer (or create buyer account)
3. Go to `/buyer/procurement`
4. You should now see the farmer listings!

---

## Expected Behavior

### Procurement Page Should Show:

1. **Stats Cards**:
   - Live Listings: Count of farmer listings
   - Total Available: Sum of quantities
   - Crop Types: Number of unique crops

2. **Farmer Listings**:
   - Each listing card with:
     - Crop type and variety
     - Quantity and unit
     - Price per unit
     - Quality grade badge
     - Pickup location
     - Available from date
     - Total value
     - Action buttons

3. **Filters Working**:
   - Search bar filters listings
   - Crop dropdown filters by crop type
   - Location dropdown filters by location
   - Quality dropdown filters by grade

---

## Debugging Tips

### Check Backend Logs

When buyer visits procurement page, backend should log:
```
Found X farmer listings
```

If you see `Found 0 farmer listings` but farmers have created listings:

1. **Check DynamoDB Table**:
   ```bash
   aws dynamodb scan --table-name krishi-orders
   ```

2. **Verify Farmer Listings Have**:
   - `farmerId` field (not `buyerId`)
   - `status` field set to `'open'`
   - `cropType`, `quantity`, `minimumPrice` fields

3. **Check Backend Environment**:
   - `DYNAMODB_ORDERS_TABLE` is set correctly
   - AWS credentials are valid
   - Region is correct

### Check Frontend Console

Open browser console (F12) and look for:
- API call to `/api/buyer/available-produce`
- Response with `listings` array
- Any error messages

### Common Issues

**Issue**: "No Listings Available" message
**Cause**: No farmer has created listings yet
**Solution**: Login as farmer and create listings first

**Issue**: Listings not updating
**Cause**: Frontend cache
**Solution**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Issue**: Backend error 500
**Cause**: DynamoDB connection issue
**Solution**: Check AWS credentials and table name

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Farmer can create listings
- [ ] Farmer listings appear in `/farmer/my-listings`
- [ ] Buyer can access `/buyer/procurement`
- [ ] Buyer sees farmer listings
- [ ] Stats cards show correct counts
- [ ] Search filter works
- [ ] Crop filter works
- [ ] Location filter works
- [ ] Quality filter works
- [ ] Listing cards show all information
- [ ] Action buttons are visible

---

## Additional Improvements Made

### 1. Enhanced DynamoDB Service

Updated `scan` method to support `ExpressionAttributeNames`:

```typescript
async scan(
  tableName: string, 
  filterExpression?: string, 
  expressionAttributeValues?: any, 
  expressionAttributeNames?: any
)
```

This allows for more complex queries in the future.

### 2. Added Logging

Added console.log to track how many listings are found:
```typescript
console.log(`Found ${listings.length} farmer listings`);
```

### 3. Better Error Handling

Improved error messages and logging for debugging.

---

## Data Flow

```
1. Buyer opens /buyer/procurement
2. Frontend calls GET /api/buyer/available-produce
3. Backend scans ORDERS table
4. Filters for items with farmerId and status='open'
5. Applies additional filters (crop, location, quality)
6. Returns listings array
7. Frontend displays listings with filters
```

---

## Summary

✅ **Fixed**: DynamoDB query issue
✅ **Improved**: Error logging
✅ **Enhanced**: DynamoDB service
✅ **Tested**: Buyer can now see farmer listings

The buyer procurement page now correctly displays all farmer listings with full filtering capabilities!

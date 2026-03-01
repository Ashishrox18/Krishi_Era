# Troubleshooting: Browse Farmer Listings Not Showing

## Quick Checklist

### 1. Restart Backend Server ⚠️ CRITICAL
```bash
# Stop current backend (Ctrl+C)
cd backend
npm run dev
```

**Why?** The code changes won't take effect until you restart the server.

### 2. Check Backend Logs

When you visit `/buyer/procurement`, check your backend terminal for these logs:
```
Total items in database: X
Items with farmerId: X
Status distribution for farmer items: { released: X, ... }
Filtered farmer listings: X
Found X farmer listings
```

If you see `Filtered farmer listings: 0`, that means:
- Either no farmer has created listings yet
- Or the listings have a different status

### 3. Create a Test Listing

**As Farmer:**
1. Login as farmer
2. Go to "List Produce" (`/farmer/list-produce`)
3. Fill the form:
   - Crop Type: Rice
   - Quantity: 100
   - Unit: quintals
   - Quality Grade: A
   - Price: 2000
   - Location: Mumbai, Maharashtra
   - Available From: Today's date
4. Click "List Produce"
5. Check backend logs - should see: `Created listing with status: released`

**As Buyer:**
1. Login as buyer
2. Go to "Browse Farmer Listings" (`/buyer/procurement`)
3. Check backend logs for the debug output
4. You should see the listing!

### 4. Check Browser Console

Open browser DevTools (F12) and check Console tab:
- Look for any API errors
- Check Network tab for `/api/buyer/available-produce` request
- Response should show `{ listings: [...] }`

### 5. Verify Database Connection

Check backend logs on startup:
```
✓ Connected to DynamoDB
✓ Table: ORDERS exists
```

If you see connection errors, check your `.env` file.

## Common Issues

### Issue 1: Backend Not Restarted
**Symptom:** Still seeing 0 listings
**Solution:** Stop backend (Ctrl+C) and restart with `npm run dev`

### Issue 2: No Listings Created
**Symptom:** Backend logs show `Items with farmerId: 0`
**Solution:** Create a test listing as farmer first

### Issue 3: Wrong Status
**Symptom:** Backend logs show listings but with status "awarded" or "closed"
**Solution:** These are filtered out (correct behavior). Create new listings.

### Issue 4: API Error
**Symptom:** Browser console shows 500 error
**Solution:** Check backend logs for error details

### Issue 5: DynamoDB Connection
**Symptom:** Backend shows connection errors
**Solution:** 
- Check AWS credentials in `backend/.env`
- Verify DynamoDB table exists
- Check AWS region is correct

## Debug Commands

### Check if backend is running:
```bash
curl http://localhost:3000/api/buyer/available-produce
```

Should return JSON with listings array.

### Check backend logs:
Look for these lines when you visit the procurement page:
```
Total items in database: X
Items with farmerId: X
Status distribution for farmer items: {...}
Filtered farmer listings: X
```

## Expected Flow

1. **Farmer creates listing:**
   - POST `/api/farmer/purchase-requests`
   - Status set to `'released'`
   - Stored in DynamoDB ORDERS table with `farmerId`

2. **Buyer views listings:**
   - GET `/api/buyer/available-produce`
   - Backend scans ORDERS table
   - Filters for items with `farmerId` AND status in ['open', 'released', 'in_progress', 'negotiating']
   - Returns filtered listings

3. **Frontend displays:**
   - Procurement page receives listings array
   - Maps over listings and displays cards
   - Shows "No Listings Available" if array is empty

## Still Not Working?

If you've tried all the above and still see no listings:

1. **Check the exact error:**
   - Backend terminal output
   - Browser console errors
   - Network tab response

2. **Verify data exists:**
   - Login as farmer
   - Go to "My Listings" (`/farmer/my-listings`)
   - Do you see your listings there?
   - If yes, note the status value

3. **Share the logs:**
   - Backend console output when visiting `/buyer/procurement`
   - Browser console errors
   - Network tab response for `/api/buyer/available-produce`

## Quick Test Script

Run this in your backend directory to test the API directly:

```bash
# Test the endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/buyer/available-produce
```

Replace `YOUR_TOKEN` with your actual JWT token from localStorage.

## Success Indicators

✅ Backend logs show: `Filtered farmer listings: 1` (or more)
✅ Browser Network tab shows listings in response
✅ Procurement page displays listing cards
✅ Can click "View Details & Make Offer"

## Next Steps After Fix

Once listings are showing:
1. Test filtering by crop type
2. Test filtering by location
3. Test filtering by quality grade
4. Click "View Details" to see detail page
5. Test submitting an offer

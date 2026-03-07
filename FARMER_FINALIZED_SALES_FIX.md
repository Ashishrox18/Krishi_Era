# Farmer Finalized Sales Fix

## Issue
Farmer's sold items were not appearing in the "Finalized" tab on the My Listings page (`/farmer/my-listings`). The page was only showing active listings, and sold items were missing even though offers had been accepted.

## Root Cause
1. When farmers cleared their listings earlier, the actual listing records were deleted from the database
2. However, the accepted offers that referenced those listings remained in the database
3. The `getPurchaseRequests` endpoint only returned items with `type='farmer_listing'`, missing the accepted offers
4. Accepted offers represent finalized sales but weren't being included in the farmer's listings view

## Solution

### Backend Changes

#### 1. Updated `farmer.controller.ts` - `getPurchaseRequests` method
- Now fetches both active listings AND accepted/awarded offers for the farmer
- Converts accepted offers into listing format for display
- Combines active listings with finalized sales (from accepted offers)
- Tries to find original listing data if available, otherwise uses offer data

```typescript
// Get active listings
const listings = allItems.filter((item: any) => 
  item.farmerId === userId && item.type === 'farmer_listing'
);

// Get accepted/finalized offers (these represent sold items)
const acceptedOffers = allItems.filter((item: any) => 
  item.farmerId === userId && 
  item.type === 'offer' && 
  (item.status === 'accepted' || item.status === 'awarded')
);

// Convert offers to listing format and combine
const finalizedListings = acceptedOffers.map(offer => ({...}));
const allRequests = [...listings, ...finalizedListings];
```

#### 2. Updated `offers.controller.ts` - `submitOffer` method
- Now stores crop details (cropType, variety, qualityGrade, pickupLocation) in the offer
- Stores farmerId in the offer for easy filtering
- Calculates and stores totalAmount
- This ensures future offers have all necessary information even if the listing is deleted

#### 3. Updated `buyer.controller.ts` - `submitOffer` method
- Same changes as offers controller
- Stores complete crop and listing details in the offer

### Frontend
No changes needed - the `MyListings.tsx` page already had the correct filtering logic:
```typescript
if (filter === 'finalized') 
  return listing.status === 'accepted' || listing.status === 'completed' || listing.status === 'awarded';
```

## Benefits
1. Finalized sales now appear correctly in the "Finalized" tab
2. Sold items show complete information (crop type, buyer name, final price, sale date)
3. Only "Cancel Sale" button is shown for finalized items (not Edit/Delete)
4. Future offers will always have complete crop information
5. System is resilient to listing deletions - sold items remain visible

## Testing
1. Login as farmer who has accepted offers
2. Navigate to `/farmer/my-listings`
3. Click on "Finalized" tab
4. Verify sold items appear with:
   - Crop type and variety
   - Final sale price
   - Buyer name
   - Sale date
   - "Cancel Sale" button only

## Files Modified
- `backend/src/controllers/farmer.controller.ts` - Updated getPurchaseRequests method
- `backend/src/controllers/offers.controller.ts` - Updated submitOffer method, added deleteOffer method
- `backend/src/routes/offers.routes.ts` - Added DELETE route for offers
- `backend/src/controllers/buyer.controller.ts` - Updated submitOffer method
- `src/pages/farmer/MyListings.tsx` - Updated handleDelete to handle finalized sales
- `src/services/api.ts` - Added deleteOffer method

## Additional Fix: Delete Finalized Sales

### Issue
When trying to delete/cancel a finalized sale, the system was returning 404 error because it was trying to delete the listing record, which no longer exists. The actual record is the accepted offer.

### Solution
1. Updated `MyListings.tsx` to check if the item is a finalized sale (has `offerId`)
2. For finalized sales, call `deleteOffer(offerId)` instead of `deletePurchaseRequest(id)`
3. Added `deleteOffer` method to API service
4. Added `deleteOffer` controller method that:
   - Verifies user authorization (farmer or buyer)
   - Deletes the offer record
   - Updates listing status back to 'open' if listing exists
   - Sends notification to the other party
5. Added DELETE route: `DELETE /api/offers/:offerId`

### Benefits
- Farmers can now successfully cancel finalized sales
- Listing status is restored to 'open' if the listing still exists
- Both parties are notified when a sale is cancelled
- Proper authorization checks ensure only involved parties can cancel

## Database Impact
- Existing accepted offers will show as "Sold Item" if crop type is missing
- New offers will include complete crop details
- No migration needed - system handles both old and new offer formats

## Status
✅ Complete - Backend updated and tested
✅ Finalized sales now visible to farmers
✅ Future offers will include complete information

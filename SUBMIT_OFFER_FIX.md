# Submit Offer Fix

## Issue
When buyers tried to submit offers on farmer listings, they received a "Failed to submit offer" error.

## Root Cause
The `submitOffer` method in the buyer controller was checking if the listing status was `'open'` or `'released'`, but the actual listings in the database had statuses like `'in_progress'` or `'negotiating'`.

```typescript
// OLD CODE (Too Restrictive)
if (listing.status !== 'open' && listing.status !== 'released') {
  return res.status(400).json({ error: 'This listing is no longer accepting offers' });
}
```

This caused a 400 Bad Request error when buyers tried to submit offers on listings with other valid statuses.

## Solution
Updated the status check to accept offers on listings with any of these statuses:
- `open` - Newly created listing
- `released` - Published listing
- `in_progress` - Listing being actively managed
- `negotiating` - Listing with ongoing negotiations

```typescript
// NEW CODE (Flexible)
const acceptableStatuses = ['open', 'released', 'in_progress', 'negotiating'];
if (!acceptableStatuses.includes(listing.status)) {
  return res.status(400).json({ error: 'This listing is no longer accepting offers' });
}
```

## Additional Improvements

### Added Detailed Logging
To help debug future issues, added console logs at key points:

```typescript
console.log('📝 Submitting offer:', { listingId, buyerId, pricePerUnit, quantity });
console.log('📋 Listing status:', listing.status);
console.log('✅ Offer submitted successfully:', offer.id);
```

If an error occurs, you'll see:
```typescript
console.error('❌ Listing not found:', listingId);
console.error('❌ Listing not accepting offers. Status:', listing.status);
```

## Files Modified
- `backend/src/controllers/buyer.controller.ts` - Updated `submitOffer` method

## Testing

### Test 1: Submit Offer on In-Progress Listing
1. Login as buyer (buyer@gmail.com)
2. Go to "Browse Farmer Listings"
3. Click on a listing with status "in_progress"
4. Click "Make Offer"
5. Enter price and quantity
6. Click "Submit Offer"
7. ✅ Should succeed with success message

### Test 2: Submit Offer on Negotiating Listing
1. Find a listing with status "negotiating"
2. Submit an offer
3. ✅ Should succeed

### Test 3: Submit Offer on Awarded Listing
1. Find a listing with status "awarded"
2. Try to submit an offer
3. ❌ Should fail with "This listing is no longer accepting offers"

## Backend Logs
When you submit an offer, you should see logs like:

```
📝 Submitting offer: {
  listingId: '2a4d9445-9f70-4fbb-b825-0bb21ab10ac3',
  buyerId: '71d5c37f-c4f0-4550-b424-bb9ca76dc27d',
  pricePerUnit: 400,
  quantity: 50
}
📋 Listing status: in_progress
✅ Offer submitted successfully: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## Status Flow

### Farmer Listing Lifecycle:
1. **open** - Newly created, accepting offers
2. **in_progress** - Farmer is managing the listing, still accepting offers
3. **negotiating** - Active negotiations happening, still accepting offers
4. **awarded** - Deal finalized, NO longer accepting offers
5. **completed** - Transaction completed
6. **cancelled** - Listing cancelled

### When Offers Are Accepted:
- ✅ open
- ✅ released
- ✅ in_progress
- ✅ negotiating
- ❌ awarded
- ❌ completed
- ❌ cancelled

## Summary
The fix allows buyers to submit offers on listings that are actively being managed or negotiated, not just newly created ones. This matches the actual workflow where listings go through multiple statuses before being awarded.

The backend has been updated and restarted. Try submitting an offer again - it should work now!

# Buyer Offers Dashboard Feature

## What Was Added

Added a new section to the Buyer Dashboard that displays all offers the buyer has submitted on farmer listings.

## Changes Made

### 1. Backend - Offers Controller (`backend/src/controllers/offers.controller.ts`)

**Added `getMyOffers` method:**
```typescript
async getMyOffers(req: Request, res: Response) {
  // Fetches all offers made by the logged-in buyer
  // Includes listing details for each offer
  // Returns offers with status, price, quantity, and negotiation history
}
```

**Features:**
- Filters offers by buyer ID and type
- Enriches each offer with listing details (crop type, variety, location)
- Includes negotiation history
- Detailed logging for debugging

### 2. Backend - Offers Routes (`backend/src/routes/offers.routes.ts`)

**Added new route:**
```typescript
router.get('/my-offers', authenticate, controller.getMyOffers);
```

Endpoint: `GET /api/offers/my-offers`

### 3. Backend - Buyer Controller (`backend/src/controllers/buyer.controller.ts`)

**Fixed `submitOffer` method:**
- Added `type: 'offer'` field to distinguish offers from other records
- Added `buyerName` field for display purposes
- This ensures offers are properly filtered and displayed

### 4. Frontend - API Service (`src/services/api.ts`)

**Added `getMyOffers` method:**
```typescript
async getMyOffers() {
  const response = await this.client.get('/offers/my-offers');
  return response.data;
}
```

### 5. Frontend - Buyer Dashboard (`src/pages/buyer/BuyerDashboard.tsx`)

**Added new state and loading:**
```typescript
const [myOffers, setMyOffers] = useState<any[]>([]);
const [loadingOffers, setLoadingOffers] = useState(true);
```

**Added `loadMyOffers` function:**
- Fetches buyer's offers on component mount
- Logs the number of offers loaded
- Handles errors gracefully

**Added "My Offers on Farmer Listings" section:**
- Displays up to 5 recent offers
- Shows offer status with color-coded badges
- Displays crop type, price, quantity, and total
- Shows counter offer indicator
- Clickable cards that navigate to listing detail page
- Empty state with "Browse Farmer Listings" button

## UI Features

### Offer Card Display

Each offer shows:
```
┌─────────────────────────────────────────────────┐
│ Cotton (hd123)                     [PENDING]    │
│ Submitted March 7, 2026                         │
├─────────────────────────────────────────────────┤
│ Your Offer: ₹400/kg                             │
│ Quantity: 50 kg                                 │
│ Total: ₹20,000                                  │
│                                                 │
│ 🔄 2 counter offer(s) from farmer               │
└─────────────────────────────────────────────────┘
```

### Status Badges

- **PENDING** (Yellow) - Waiting for farmer's response
- **COUNTERED** (Orange) - Farmer sent a counter offer
- **ACCEPTED** (Green) - Farmer accepted your offer
- **REJECTED** (Gray) - Offer was declined

### Empty State

When no offers exist:
```
┌─────────────────────────────────────────────────┐
│                      🛒                          │
│         No offers submitted yet                 │
│                                                 │
│        [Browse Farmer Listings]                 │
└─────────────────────────────────────────────────┘
```

## How It Works

### Flow:

1. **Buyer submits offer** on a farmer listing
   - Offer is saved with `type: 'offer'` and `buyerId`
   - Farmer receives notification

2. **Dashboard loads offers**
   - Calls `/api/offers/my-offers`
   - Backend filters by buyer ID and type
   - Returns offers with listing details

3. **Offers displayed**
   - Shows in "My Offers on Farmer Listings" section
   - Color-coded status badges
   - Counter offer indicators
   - Clickable to view full details

4. **Click on offer**
   - Navigates to listing detail page
   - Shows full offer details and counter offers
   - Can update offer or accept deal

## Testing

### Test 1: Submit New Offer
1. Login as buyer (buyer@gmail.com)
2. Go to "Browse Farmer Listings"
3. Click on a listing
4. Submit an offer
5. Return to dashboard
6. ✅ Should see offer in "My Offers" section

### Test 2: View Offer Details
1. Click on an offer card in dashboard
2. ✅ Should navigate to listing detail page
3. ✅ Should see "Your Offer" section with details

### Test 3: Counter Offers
1. Farmer sends counter offer (login as farmer)
2. Return to buyer dashboard
3. ✅ Should see "🔄 X counter offer(s) from farmer"
4. Click on offer
5. ✅ Should see counter offers in orange section

### Test 4: Multiple Offers
1. Submit offers on multiple listings
2. Return to dashboard
3. ✅ Should see all offers (up to 5 most recent)
4. ✅ Each with correct status and details

## Backend Logs

When dashboard loads, you'll see:
```
🛍️ Fetching offers for buyer: 71d5c37f-c4f0-4550-b424-bb9ca76dc27d
✅ Found 3 offers for buyer 71d5c37f-c4f0-4550-b424-bb9ca76dc27d
```

When offer is submitted:
```
📝 Submitting offer: { listingId: '...', buyerId: '...', pricePerUnit: 400, quantity: 50 }
📋 Listing status: in_progress
✅ Offer submitted successfully: a1b2c3d4-...
```

## Important Notes

### For Existing Offers

If you submitted offers before this fix, they might not appear because they don't have the `type: 'offer'` field. To fix:
1. Submit a new offer (it will have the correct type)
2. Or manually update old offers in the database to add `type: 'offer'`

### For New Offers

All new offers will automatically:
- Have `type: 'offer'` field
- Have `buyerName` field
- Appear in the dashboard
- Be properly filtered and displayed

## Files Modified

1. `backend/src/controllers/offers.controller.ts` - Added getMyOffers method
2. `backend/src/routes/offers.routes.ts` - Added /my-offers route
3. `backend/src/controllers/buyer.controller.ts` - Fixed submitOffer to add type field
4. `src/services/api.ts` - Added getMyOffers API method
5. `src/pages/buyer/BuyerDashboard.tsx` - Added My Offers section

## Summary

The buyer dashboard now shows all submitted offers with:
- Status tracking (pending, countered, accepted)
- Price and quantity details
- Counter offer indicators
- Direct links to listing details
- Clean, intuitive UI

Try submitting a new offer and it will appear on your dashboard immediately!

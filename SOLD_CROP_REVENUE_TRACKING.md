# Sold Crop Revenue Tracking Implementation

## Summary
Updated the Harvest Management page to properly track sold crops and display actual revenue from finalized deals instead of potential revenue.

## Changes Made

### 1. Backend Changes

#### `backend/src/controllers/farmer.controller.ts`
- Added `cropId` field to purchase request creation
- Now stores the crop ID when a farmer lists produce from a harvest-ready crop

#### `backend/src/controllers/offers.controller.ts`
- Added `cropId` to offer creation (copied from listing)
- Enhanced `confirmAcceptedOffer()` to update crop status to 'sold' when deal is finalized
- Added fallback to check both listing and offer for cropId
- Added detailed logging for crop status updates

### 2. Frontend Changes

#### `src/pages/farmer/HarvestManagement.tsx`

**New State:**
- Added `soldCrops` state to track finalized sales

**New Functions:**
- `fetchSoldCrops()`: Fetches farmer's finalized sales from listings API
- Auto-refresh sold crops every 10 seconds when on "Listed Produce" tab

**Updated UI:**
- Changed "Potential Revenue" to "Revenue" (green color)
- Revenue now calculates actual earnings from sold crops: `quantity × finalPrice`
- Sold crops (status='sold') are automatically excluded from "Listed Produce" display

**Form Submission:**
- Now passes `cropId` when creating a listing from harvest-ready crop

## How It Works

### Complete Flow:

1. **Farmer lists produce:**
   - Selects a harvest-ready crop
   - Fills out listing form
   - System stores `cropId` in the listing

2. **Buyer makes offer:**
   - Offer is created with `cropId` copied from listing

3. **Negotiation:**
   - Farmer and buyer negotiate price
   - `cropId` is maintained throughout

4. **Deal finalized:**
   - Buyer confirms purchase
   - Backend updates crop status to 'sold'
   - Crop disappears from "Listed Produce" tab
   - Revenue is calculated and displayed

### Revenue Calculation:

```javascript
Revenue = Σ (quantity × finalPrice) for all sold crops
```

Where:
- `quantity`: Amount sold (in quintals)
- `finalPrice`: Final agreed price per unit

## UI Changes

### Before:
- "Potential Revenue" showed estimated value of listed crops
- Calculation: `listed_quantity × market_price`
- Sold crops remained in "Listed Produce" tab

### After:
- "Revenue" shows actual earnings from sold crops
- Calculation: `sold_quantity × final_sale_price`
- Sold crops automatically removed from "Listed Produce" tab
- Green color indicates actual money earned

## Statistics Display

The "Listed Produce" tab now shows:

1. **Listed Items**: Count of crops currently listed (status='listed')
2. **Total Listed Quantity**: Sum of quantities for listed crops
3. **Revenue**: Total actual revenue from sold crops (status='awarded')

## Auto-Refresh

- Sold crops data refreshes every 10 seconds when viewing "Listed Produce" tab
- Ensures revenue updates in real-time as deals are finalized

## Testing

Run the test script to verify the flow:

```bash
cd backend
npx ts-node scripts/test-sold-crop-flow.ts
```

The script checks:
- Crop status breakdown
- Listings with cropId
- Finalized sales with revenue calculation
- Verification that sold crops are marked correctly

## Notes

- Existing finalized sales (created before this update) won't have cropId
- New listings going forward will properly track cropId
- The system gracefully handles missing cropId (logs warning but doesn't fail)
- Revenue calculation only includes sales with valid price and quantity data

## Future Enhancements

Potential improvements:
1. Add a "Sold Crops" tab to view sales history
2. Show revenue breakdown by crop type
3. Add date range filters for revenue
4. Export revenue reports
5. Show profit margins (revenue - costs)

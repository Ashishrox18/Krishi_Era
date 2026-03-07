# Buyer Dashboard Purchase Statistics

## Summary
Updated the Buyer Dashboard to display total value and volume of goods actually purchased (finalized offers) instead of procurement requests.

## Changes Made

### `src/pages/buyer/BuyerDashboard.tsx`

#### 1. Added Finalized Purchases State
```javascript
const [finalizedPurchases, setFinalizedPurchases] = useState<any[]>([]);
```

#### 2. Created loadFinalizedPurchases Function
Fetches all buyer's offers and filters for accepted/finalized ones:
```javascript
const loadFinalizedPurchases = async () => {
  const response = await apiService.getMyOffers();
  const offers = response.offers || [];
  
  // Filter for finalized purchases (accepted offers)
  const finalized = offers.filter((offer: any) => offer.status === 'accepted');
  
  setFinalizedPurchases(finalized);
};
```

#### 3. Updated Statistics Calculations

**Before:**
- Calculated from procurement requests (buyer's requests, not actual purchases)
- Used `targetPrice` (desired price, not actual price paid)

```javascript
const totalVolume = procurementRequests.reduce((sum, r) => sum + (r.quantity || 0), 0);
const totalValue = procurementRequests.reduce((sum, r) => 
  sum + ((r.quantity || 0) * (r.targetPrice || 0)), 0
);
```

**After:**
- Calculates from finalized purchases (accepted offers)
- Uses actual `pricePerUnit` (price actually paid)

```javascript
const totalPurchasedValue = finalizedPurchases.reduce((sum, purchase) => {
  const quantity = purchase.quantity || 0;
  const price = purchase.pricePerUnit || 0;
  return sum + (quantity * price);
}, 0);

const totalPurchasedVolume = finalizedPurchases.reduce((sum, purchase) => {
  return sum + (purchase.quantity || 0);
}, 0);
```

#### 4. Updated Statistics Cards Display

**Card 1: Active Requests** (unchanged)
- Shows count of active procurement requests
- Blue color

**Card 2: Total Value Purchased** (updated)
- **Before**: "Total Value" showing estimated value from requests in lakhs
- **After**: "Total Value Purchased" showing actual amount spent
- Changed from lakhs format to full amount: `₹81,400` instead of `₹0.8L`
- Green color to indicate spending/investment

**Card 3: Total Volume Purchased** (updated)
- **Before**: "Total Volume" from procurement requests
- **After**: "Total Volume Purchased" from finalized purchases
- Shows actual quantity purchased with unit
- Purple color

**Card 4: Completed Purchases** (updated)
- **Before**: "Total Requests" showing all procurement requests
- **After**: "Completed Purchases" showing count of finalized purchases
- Orange color

#### 5. Added Auto-Refresh
Finalized purchases data refreshes every 30 seconds along with other data.

## How It Works

### Data Flow:

1. **On Dashboard Load:**
   - Fetches buyer's offers via `getMyOffers()`
   - Filters for accepted offers (status='accepted')
   - Calculates total value and volume

2. **Value Calculation:**
   ```
   Total Value = Σ (quantity × pricePerUnit) for all accepted offers
   ```

3. **Volume Calculation:**
   ```
   Total Volume = Σ quantity for all accepted offers
   ```

4. **Auto-Refresh:**
   - All data refreshes every 30 seconds
   - Manual refresh button available

### Display Format:

**Total Value Purchased:**
- Full rupee amount with Indian number formatting
- Example: ₹81,400 (not ₹0.8L)
- Green color to indicate investment/spending

**Total Volume Purchased:**
- Decimal format with one decimal place
- Includes unit (quintals, tons, etc.)
- Example: 22.8 quintals

## Quick Stats Cards

The dashboard now shows:

1. **Active Requests**: Count of ongoing procurement requests (blue)
2. **Total Value Purchased**: Actual money spent on finalized purchases (green)
3. **Total Volume Purchased**: Actual quantity of goods purchased (purple)
4. **Completed Purchases**: Count of finalized purchases (orange)

## Benefits

1. **Accurate Spending**: Shows actual money spent, not estimates
2. **Real Inventory**: Shows actual goods purchased, not requested
3. **Clear Metrics**: Easy to track procurement performance
4. **Always Current**: Auto-refreshes every 30 seconds
5. **Better Insights**: Separates requests from actual purchases

## Example

If a buyer has completed these purchases:
- 10 quintals of Mustard at ₹5,600/quintal = ₹56,000
- 1.8 quintals of Moong at ₹8,450/quintal = ₹15,210
- 11 quintals of Jowar at ₹1,000/quintal = ₹11,000

**Dashboard displays:**
- Total Value Purchased: ₹82,210
- Total Volume Purchased: 22.8 quintals
- Completed Purchases: 3

## Comparison: Before vs After

### Before (Procurement Requests):
- Showed what buyer WANTS to buy
- Used target/desired prices
- Included pending/cancelled requests
- Not accurate for actual spending

### After (Finalized Purchases):
- Shows what buyer ACTUALLY bought
- Uses actual negotiated prices
- Only includes completed purchases
- Accurate spending and inventory tracking

## Testing

To verify the statistics:

1. Navigate to buyer dashboard: `http://localhost:5173/buyer`
2. Check the Quick Stats cards:
   - Card 2: "Total Value Purchased" (green)
   - Card 3: "Total Volume Purchased" (purple)
   - Card 4: "Completed Purchases" (orange)
3. Values should match finalized offers

Run backend test script to see finalized offers:
```bash
cd backend
npx ts-node scripts/test-sold-crop-flow.ts
```

Look for "Finalized sales" section to verify calculations.

## Notes

- Only includes offers with status='accepted'
- Requires both quantity and pricePerUnit to be present
- Auto-refreshes every 30 seconds
- Manual refresh button available in header
- Works seamlessly with the offer negotiation flow
- Matches the farmer's revenue tracking on the other side

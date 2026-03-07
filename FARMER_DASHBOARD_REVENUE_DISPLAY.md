# Farmer Dashboard Revenue Display

## Summary
Updated the Farmer Dashboard to display total revenue from sold items in the Quick Stats section.

## Changes Made

### `src/pages/farmer/FarmerDashboard.tsx`

#### 1. Added Sold Crops State
```javascript
const [soldCrops, setSoldCrops] = useState<any[]>([]);
```

#### 2. Created loadSoldCrops Function
Fetches finalized sales from the farmer's listings:
```javascript
const loadSoldCrops = async () => {
  const response = await apiService.getMyPurchaseRequests();
  const listings = response.requests || [];
  
  // Filter for finalized/awarded listings
  const finalizedListings = listings.filter((listing: any) => 
    listing.status === 'awarded' && listing.finalPrice
  );
  
  setSoldCrops(finalizedListings);
};
```

#### 3. Updated Revenue Calculation
Changed from looking for non-existent `actualRevenue` field to calculating from finalized sales:

**Before:**
```javascript
const actualRevenue = crops
  .filter(c => c.status === 'sold' && c.actualRevenue)
  .reduce((sum, crop) => sum + (crop.actualRevenue || 0), 0);
```

**After:**
```javascript
const actualRevenue = soldCrops.reduce((sum, crop) => {
  const quantity = crop.quantity || 0;
  const price = crop.finalPrice || crop.currentBestOffer || 0;
  return sum + (quantity * price);
}, 0);
```

#### 4. Updated Revenue Display
- Changed from lakhs format to full amount with Indian number formatting
- Changed color from orange to green to match revenue theme
- Shows actual rupee amount: `₹81,400` instead of `₹0.8L`

**Before:**
```javascript
<p className="text-2xl font-bold text-gray-900">₹{(actualRevenue / 100000).toFixed(1)}L</p>
<TrendingUp className="h-8 w-8 text-orange-600" />
```

**After:**
```javascript
<p className="text-2xl font-bold text-green-600">₹{actualRevenue.toLocaleString('en-IN')}</p>
<TrendingUp className="h-8 w-8 text-green-600" />
```

#### 5. Added Auto-Refresh
Revenue data refreshes every 30 seconds:
```javascript
useEffect(() => {
  const interval = setInterval(loadSoldCrops, 30000);
  return () => clearInterval(interval);
}, []);
```

#### 6. Updated Active Crops Filter
Excluded sold crops from all calculations and displays:
```javascript
// Before
const activeCropsFiltered = crops.filter(c => c.status !== 'ready' && c.status !== 'listed');

// After
const activeCropsFiltered = crops.filter(c => c.status !== 'ready' && c.status !== 'listed' && c.status !== 'sold');
```

This affects:
- Total Land calculation
- Active Crops count
- Expected Yield calculation
- Current Crops display
- Farming Tips display

## How It Works

### Data Flow:

1. **On Dashboard Load:**
   - Fetches all crops
   - Fetches finalized sales (awarded listings)
   - Calculates revenue from sales

2. **Revenue Calculation:**
   ```
   Revenue = Σ (quantity × finalPrice) for all finalized sales
   ```

3. **Auto-Refresh:**
   - Sold crops data refreshes every 30 seconds
   - Ensures revenue is always up-to-date

### Display Format:

- **Amount**: Full rupee amount with Indian number formatting
  - Example: ₹81,400 (not ₹0.8L)
- **Color**: Green to indicate positive earnings
- **Icon**: TrendingUp in green

## Quick Stats Cards

The dashboard now shows:

1. **Total Land**: Sum of area for active (planted) crops
2. **Active Crops**: Count of crops currently growing (excludes ready, listed, sold)
3. **Expected Yield**: Sum of expected yield for active crops
4. **Total Revenue**: Actual earnings from finalized sales (green, auto-refreshing)

## Benefits

1. **Real Revenue**: Shows actual money earned, not estimates
2. **Always Current**: Auto-refreshes every 30 seconds
3. **Clear Display**: Full amount in rupees, easy to read
4. **Accurate Stats**: Sold crops don't inflate active crop counts
5. **Visual Clarity**: Green color indicates positive earnings

## Example

If a farmer has sold:
- 10 quintals of Mustard at ₹5,600/quintal = ₹56,000
- 1.8 quintals of Moong at ₹8,450/quintal = ₹15,210
- 11 quintals of Jowar at ₹1,000/quintal = ₹11,000

**Total Revenue displayed: ₹82,210**

## Testing

To verify the revenue display:

1. Navigate to farmer dashboard: `http://localhost:5173/farmer`
2. Check the "Total Revenue" card (4th card in Quick Stats)
3. Should show green amount with Indian number formatting
4. Amount should match sum of all finalized sales

Run backend test script:
```bash
cd backend
npx ts-node scripts/test-sold-crop-flow.ts
```

Look for "Total Revenue" in the output to verify calculation.

## Notes

- Revenue only includes finalized sales (status='awarded')
- Requires both quantity and finalPrice to be present
- Auto-refresh ensures real-time updates
- Sold crops are excluded from all other statistics
- Works seamlessly with the existing crop lifecycle

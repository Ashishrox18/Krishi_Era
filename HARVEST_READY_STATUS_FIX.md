# Harvest Ready Status Fix

## Issue
When a crop was marked as "Harvest Ready", it would revert back to "Growing" or "Upcoming" status when the page was refreshed or revisited.

## Root Cause
The backend `getHarvests()` method in `farmer.controller.ts` was automatically recalculating the crop status based on `daysRemaining` every time crops were fetched, overwriting the status stored in the database.

### Problematic Code:
```javascript
return {
  ...crop,
  harvestDate: harvestDate.toISOString(),
  daysRemaining,
  status: daysRemaining <= 0 ? 'ready' : daysRemaining <= 30 ? 'upcoming' : 'growing',
};
```

This code always calculated status from `daysRemaining`, ignoring any status explicitly set in the database (like when a farmer manually marks a crop as "Harvest Ready").

## Solution

### `backend/src/controllers/farmer.controller.ts`

Updated the `getHarvests()` method to respect the status stored in the database:

**Before:**
```javascript
status: daysRemaining <= 0 ? 'ready' : daysRemaining <= 30 ? 'upcoming' : 'growing',
```

**After:**
```javascript
// Use status from database if it exists, otherwise calculate it
const status = crop.status || (daysRemaining <= 0 ? 'ready' : daysRemaining <= 30 ? 'upcoming' : 'growing');
```

## How It Works Now

### Status Priority:

1. **Database Status (Highest Priority)**: If a crop has a status explicitly set in the database (e.g., 'ready', 'listed', 'sold'), use that status.

2. **Calculated Status (Fallback)**: Only if no status exists in the database, calculate it based on days remaining:
   - `daysRemaining <= 0` → 'ready'
   - `daysRemaining <= 30` → 'upcoming'
   - Otherwise → 'growing'

### Crop Lifecycle:

1. **Planted**: Status = 'growing' (or 'upcoming' if harvest is within 30 days)
2. **Auto-Ready**: Status automatically becomes 'ready' when harvest date passes (if not manually set)
3. **Manual Ready**: Farmer clicks "Mark Harvest Ready" → Status = 'ready' (saved to database)
4. **Listed**: Farmer lists the crop → Status = 'listed' (saved to database)
5. **Sold**: Deal finalized → Status = 'sold' (saved to database)

### Status Persistence:

Once a status is explicitly set in the database (ready, listed, sold), it will NOT be overwritten by the automatic calculation. This ensures:
- Harvest ready crops stay in "Harvest Ready" tab
- Listed crops stay in "Listed Produce" tab
- Sold crops remain hidden from all tabs

## Benefits

1. **Status Persistence**: Manually set statuses are preserved across page refreshes
2. **Correct Tab Display**: Crops stay in the correct tab after being moved
3. **No Regression**: Crops don't revert to previous status
4. **Automatic Fallback**: New crops without explicit status still get calculated status
5. **Lifecycle Integrity**: Status transitions are maintained throughout the crop lifecycle

## Testing

### Test Scenario 1: Mark Harvest Ready
1. Go to "Planted Crops" tab
2. Click "Mark Harvest Ready" on a crop
3. Fill out the form and submit
4. Crop should move to "Harvest Ready" tab
5. Refresh the page
6. **Expected**: Crop remains in "Harvest Ready" tab ✅
7. **Before Fix**: Crop would revert to "Planted Crops" ❌

### Test Scenario 2: List Produce
1. Go to "Harvest Ready" tab
2. Click "List for Sale" on a crop
3. Fill out the form and submit
4. Crop should move to "Listed Produce" tab
5. Refresh the page
6. **Expected**: Crop remains in "Listed Produce" tab ✅
7. **Before Fix**: Crop might revert to "Harvest Ready" ❌

### Test Scenario 3: Finalize Sale
1. Complete a sale (buyer confirms purchase)
2. Crop status becomes 'sold'
3. Refresh the page
4. **Expected**: Crop disappears from all tabs ✅
5. **Before Fix**: Crop might reappear in a tab ❌

## Verification

Run the test script to check crop statuses:
```bash
cd backend
npx ts-node scripts/test-sold-crop-flow.ts
```

Check that:
- Crops with status='ready' remain 'ready'
- Crops with status='listed' remain 'listed'
- Crops with status='sold' remain 'sold'
- Crops without explicit status get calculated status

## Related Files

- `backend/src/controllers/farmer.controller.ts` - Fixed getHarvests() method
- `src/pages/farmer/HarvestManagement.tsx` - Frontend already respects database status
- `backend/src/controllers/offers.controller.ts` - Updates status to 'sold' on deal finalization

## Notes

- The fix is backward compatible - existing crops without status will still work
- The frontend already had correct logic to respect database status
- The issue was purely in the backend overwriting the status
- Auto-refresh and polling will now maintain correct status
- Status transitions are one-way: growing → ready → listed → sold

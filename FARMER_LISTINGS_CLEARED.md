# Farmer Sell Listings Cleared ✅

## Summary
All farmer sell listings have been successfully removed from the database.

## Execution Details

**Date**: March 7, 2026
**Table**: krishi-orders
**Total Items in Table**: 37
**Farmer Listings Found**: 9
**Successfully Deleted**: 9
**Failed**: 0

## Deleted Listings

1. **Test Crop for Fixes**
   - Quantity: 1400 kg
   - Price: ₹3000/kg
   - Status: in_progress
   - ID: e4976a5f-dfec-4afb-a1ad-86eb75e15847

2. **Groundnut**
   - Quantity: 99.99 quintals
   - Price: ₹2300/quintals
   - Status: awarded
   - ID: a189e87e-39af-4915-8f13-3c6075bd1318

3. **Cotton**
   - Quantity: 46.99 quintals
   - Price: ₹374.98/quintals
   - Status: in_progress
   - ID: 2a4d9445-9f70-4fbb-b825-0bb21ab10ac3

4. **Bajra**
   - Quantity: 250 quintals
   - Price: ₹74.98/quintals
   - Status: in_progress
   - ID: c60f58d4-f1ef-4a00-a19f-4ca6c66b2ea8

5. **Rice**
   - Quantity: 50 Quintals
   - Price: ₹3000/Quintals
   - Status: in_progress
   - ID: 4953ba89-3bba-4aa0-bf2c-315031164944

6. **Potato**
   - Quantity: 25.99 quintals
   - Price: ₹100/quintals
   - Status: in_progress
   - ID: 391c1ef3-58dd-4814-ac7a-660384dfaf7b

7. **Wheat**
   - Quantity: 28.8 quintals
   - Price: ₹2288/quintals
   - Status: released
   - ID: bba80cb7-b1af-4e64-a8c8-9e8bce908a16

8. **Test Crop for Fixes** (duplicate)
   - Quantity: 1400 kg
   - Price: ₹3000/kg
   - Status: negotiating
   - ID: c90a0275-21a9-4bb3-b8c6-7fb391a55e7e

9. **Moong**
   - Quantity: 1.8 quintals
   - Price: ₹30000/quintals
   - Status: in_progress
   - ID: b1aa0b08-9a33-40c9-a696-0ec13925111d

## Verification
✅ Post-deletion scan confirmed: **0 farmer listings remain** in the database

## Remaining Data in Database

After deletion, the database still contains:
- **12 Offers** (buyer offers on listings)
- **14 No-Type items** (various records)
- **1 Quote** (farmer quote on procurement request)
- **1 Procurement Request** (buyer procurement request)

**Total remaining items**: 28

## Script Used

**Location**: `backend/scripts/clear-farmer-listings.ts`

The script:
1. Scans the entire krishi-orders table
2. Filters for items with type: 'FARMER_LISTING' and farmerId field
3. Displays all listings to be deleted
4. Deletes each listing individually
5. Verifies deletion was successful
6. Provides detailed summary

## How to Run Again (if needed)

```bash
cd backend
npx ts-node scripts/clear-farmer-listings.ts
```

## Impact

### What Was Deleted:
- All farmer sell listings (produce available for sale)
- Listings in various statuses (in_progress, awarded, negotiating, released)

### What Was NOT Deleted:
- Buyer offers (preserved for reference)
- Procurement requests (buyer requests for produce)
- Quotes (farmer quotes on procurement requests)
- Other system records

### User Impact:
- Farmers will see empty "My Listings" page
- Buyers will not see any farmer listings in procurement page
- Existing offers remain in database but reference deleted listings
- Farmers can create new listings from scratch

## Next Steps

Farmers can now:
1. Go to `/farmer/harvest`
2. Click "List Produce" tab
3. Create new listings with fresh data

## Notes

- The deletion was permanent and cannot be undone
- All associated offers still exist in the database
- Notifications related to deleted listings remain
- This was a clean slate for farmer listings only

---

**Status**: ✅ Complete
**Result**: All 9 farmer sell listings successfully removed from database

# Dashboard Listings Display Fix

## Issue
Farmer listings and buyer procurement requests were not showing up correctly on their respective dashboards.

## Root Cause
The backend was filtering items from the orders table but wasn't filtering by the `type` field, which distinguishes between:
- `farmer_listing` - Farmer's produce listings
- `procurement_request` - Buyer's procurement requests

## Changes Made

### 1. Backend - Farmer Controller (`backend/src/controllers/farmer.controller.ts`)

**Updated `getPurchaseRequests` method:**
```typescript
// OLD: Only filtered by farmerId
const requests = allItems.filter((item: any) => 
  item.farmerId === userId
);

// NEW: Filter by farmerId AND type
const requests = allItems.filter((item: any) => 
  item.farmerId === userId && item.type === 'farmer_listing'
);
```

**Added detailed logging:**
- Shows total items in table
- Shows filtered farmer listings count
- Shows listing details (id, cropType, status)

### 2. Backend - Buyer Controller (`backend/src/controllers/buyer.controller.ts`)

**Updated `getMyProcurementRequests` method:**
```typescript
// OLD: Only filtered by buyerId
const requests = allItems.filter((item: any) => 
  item.buyerId === userId
);

// NEW: Filter by buyerId AND type
const requests = allItems.filter((item: any) => 
  item.buyerId === userId && item.type === 'procurement_request'
);
```

**Added detailed logging:**
- Shows total items in table
- Shows filtered procurement requests count
- Shows request details (id, cropType, status)

### 3. Frontend - API Service (`src/services/api.ts`)

**Added `getMyListings` method:**
```typescript
async getMyListings() {
  // Farmer's listings are the same as purchase requests
  const response = await this.client.get('/farmer/purchase-requests');
  return response.data;
}
```

This provides a clearer API method name for fetching farmer's own listings.

### 4. Frontend - Farmer Dashboard (`src/pages/farmer/FarmerDashboard.tsx`)

**Updated `loadRecentListings` method:**
```typescript
// OLD: Called getMyPurchaseRequests (confusing name)
const response = await apiService.getMyPurchaseRequests();

// NEW: Calls getMyListings (clearer name)
const response = await apiService.getMyListings();
```

**Added console logging:**
```typescript
console.log('📦 Loaded farmer listings:', listings.length);
```

## Data Structure

### Farmer Listing Example:
```json
{
  "id": "2a4d9445-9f70-4fbb-b825-0bb21ab10ac3",
  "farmerId": "bb1c1266-3584-4a08-81eb-66ac57c806cd",
  "cropType": "Cotton",
  "variety": "hd123",
  "quantity": 46.99,
  "quantityUnit": "quintals",
  "qualityGrade": "A",
  "minimumPrice": 374.98,
  "pickupLocation": "bengaluru",
  "status": "in_progress",
  "type": "farmer_listing",
  "createdAt": "2026-03-05T18:58:48.352Z"
}
```

### Procurement Request Example:
```json
{
  "id": "feea50ed-2fba-40ed-9681-b6d8e245bc73",
  "buyerId": "71d5c37f-c4f0-4550-b424-bb9ca76dc27d",
  "cropType": "Test Rice",
  "quantity": 200,
  "quantityUnit": "kg",
  "maxPricePerUnit": 3150,
  "deliveryLocation": "Test Buyer Location",
  "status": "negotiating",
  "type": "procurement_request",
  "createdAt": "2026-03-05T18:52:34.949Z"
}
```

## How to Verify

### 1. Check Backend Logs
When you refresh the dashboards, you should see logs like:

**Farmer Dashboard:**
```
🌾 Fetching farmer listings for user: bb1c1266-3584-4a08-81eb-66ac57c806cd
📦 Total items in orders table: 15
✅ Found 6 farmer listings for user bb1c1266-3584-4a08-81eb-66ac57c806cd
📋 Listings: [
  { id: '2a4d9445...', cropType: 'Cotton', status: 'in_progress' },
  { id: '391c1ef3...', cropType: 'Potato', status: 'in_progress' },
  ...
]
```

**Buyer Dashboard:**
```
🛒 Fetching procurement requests for buyer: 71d5c37f-c4f0-4550-b424-bb9ca76dc27d
📦 Total items in orders table: 15
✅ Found 5 procurement requests for buyer 71d5c37f-c4f0-4550-b424-bb9ca76dc27d
📋 Requests: [
  { id: 'feea50ed...', cropType: 'Test Rice', status: 'negotiating' },
  { id: 'ce7531fe...', cropType: 'Jowar', status: 'in_progress' },
  ...
]
```

### 2. Check Frontend Console
Open browser DevTools (F12) and check the Console tab for:
```
📦 Loaded farmer listings: 6
```

### 3. Visual Verification

**Farmer Dashboard should show:**
- Recent Listings section with up to 3 listings
- Each listing showing: crop type, quantity, price, location, status
- "View All →" link to see all listings

**Buyer Dashboard should show:**
- Recent Procurement Requests section with up to 3 requests
- Each request showing: crop type, quantity, target price, status, quotes count
- "Create Your First Request" button if no requests exist

## Testing Steps

1. **Login as Farmer** (farmer@gmail.com)
   - Go to Farmer Dashboard
   - Check "Recent Listings" section
   - Should see your created listings
   - Check backend logs for farmer listing count

2. **Login as Buyer** (buyer@gmail.com)
   - Go to Buyer Dashboard
   - Check "Recent Procurement Requests" section
   - Should see your created requests
   - Check backend logs for procurement request count

3. **Create New Listing** (as Farmer)
   - Go to Harvest Management
   - List a crop for sale
   - Return to dashboard
   - New listing should appear in "Recent Listings"

4. **Create New Request** (as Buyer)
   - Go to "Create Procurement Request"
   - Submit a new request
   - Return to dashboard
   - New request should appear in "Recent Procurement Requests"

## Files Modified

1. `backend/src/controllers/farmer.controller.ts` - Added type filtering and logging
2. `backend/src/controllers/buyer.controller.ts` - Added type filtering and logging
3. `src/services/api.ts` - Added getMyListings method
4. `src/pages/farmer/FarmerDashboard.tsx` - Updated to use getMyListings with logging

## Summary

The fix ensures that:
- Farmers only see their own listings (type: farmer_listing)
- Buyers only see their own procurement requests (type: procurement_request)
- Both dashboards display the correct data with proper filtering
- Detailed logging helps debug any future issues
- Clear API method names reduce confusion

The backend will automatically restart and apply these changes. Refresh your browser to see the updated dashboards with correct data.

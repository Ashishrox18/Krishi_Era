# Procurement Request Detail Pages - Bug Fix

## Issue
Both buyer and farmer procurement request detail pages were showing blank screens when clicking "View Details" buttons.

## Root Cause
1. **Farmer viewing buyer's procurement request**: The `getPurchaseRequest` method in farmer controller was checking if `request.farmerId !== userId`, but buyer procurement requests have `buyerId` not `farmerId`. This caused a 403 Unauthorized error.

2. **Buyer viewing their own procurement request**: There was no backend endpoint for buyers to view a single procurement request detail. The route and controller method were missing.

3. **API method mismatch**: The buyer's procurement request detail page was using the farmer's API endpoint instead of a buyer-specific endpoint.

## Changes Made

### Backend Changes

#### 1. Fixed `backend/src/controllers/farmer.controller.ts`
**Method**: `getPurchaseRequest`

**Before**:
```typescript
if (request.farmerId !== userId) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

**After**:
```typescript
// If it's a farmer's listing (has farmerId), check ownership
// If it's a buyer's procurement request (has buyerId), allow any farmer to view
if (request.farmerId && request.farmerId !== req.user!.id) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

**Reason**: Farmers need to view buyer procurement requests (which have `buyerId`) to submit quotes. Only farmer's own listings (which have `farmerId`) should be restricted.

#### 2. Added `backend/src/controllers/buyer.controller.ts`
**New Method**: `getProcurementRequest`

```typescript
async getProcurementRequest(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const request = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });

    if (!request) {
      return res.status(404).json({ error: 'Procurement request not found' });
    }

    // Verify this is a buyer's procurement request and belongs to this buyer
    if (!request.buyerId || request.buyerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Get procurement request error:', error);
    res.status(500).json({ error: 'Failed to fetch procurement request' });
  }
}
```

**Reason**: Buyers need a dedicated endpoint to view their own procurement request details with proper authorization.

#### 3. Updated `backend/src/routes/buyer.routes.ts`
**Added Route**:
```typescript
router.get('/procurement-requests/:id', authenticate, controller.getProcurementRequest);
```

**Reason**: Expose the new controller method as an API endpoint.

### Frontend Changes

#### 1. Updated `src/services/api.ts`
**Added Method**: `getProcurementRequestDetail`

```typescript
async getProcurementRequestDetail(id: string) {
  const response = await this.client.get(`/buyer/procurement-requests/${id}`);
  return response.data;
}
```

**Reason**: Provide a separate API method for buyers to fetch their procurement request details.

#### 2. Updated `src/pages/buyer/ProcurementRequestDetail.tsx`
**Changed**: `loadData` method

**Before**:
```typescript
const requestRes = await apiService.getPurchaseRequest(id!)
```

**After**:
```typescript
const requestRes = await apiService.getProcurementRequestDetail(id!)
```

**Reason**: Use the correct buyer-specific API endpoint instead of the farmer endpoint.

## API Endpoints Summary

### Farmer Endpoints
- `GET /api/farmer/purchase-requests/:id` - View any procurement request (buyer's or farmer's own listing)
  - If has `buyerId`: Any farmer can view (to submit quotes)
  - If has `farmerId`: Only owner farmer can view

### Buyer Endpoints
- `GET /api/buyer/procurement-requests/:id` - View own procurement request
  - Must have `buyerId` matching authenticated user
  - Returns 403 if not owner

## Data Model Clarification

### ORDERS Table Structure
The ORDERS table stores both farmer listings and buyer procurement requests:

**Farmer Listing** (created by farmer):
```json
{
  "id": "uuid",
  "farmerId": "farmer-user-id",
  "cropType": "Rice",
  "quantity": 100,
  "minimumPrice": 2200,
  "pickupLocation": "Farm address",
  "status": "open"
}
```

**Buyer Procurement Request** (created by buyer):
```json
{
  "id": "uuid",
  "buyerId": "buyer-user-id",
  "cropType": "Wheat",
  "quantity": 500,
  "maxPricePerUnit": 2500,
  "deliveryLocation": "Warehouse address",
  "status": "open"
}
```

## User Flows Now Working

### Buyer Flow
1. Buyer creates procurement request → Stored with `buyerId`
2. Buyer views "My Procurement Requests" → Lists all their requests
3. Buyer clicks "View Details & Quotes" → Calls `/api/buyer/procurement-requests/:id`
4. Page loads with request details, status workflow, and received quotes
5. Buyer can send counter offers and award quotes

### Farmer Flow
1. Farmer browses procurement requests → Lists all buyer requests (have `buyerId`)
2. Farmer clicks "View Details & Submit Quote" → Calls `/api/farmer/purchase-requests/:id`
3. Page loads with request details, status workflow, and quote submission form
4. Farmer can submit quotes, update them, and accept counter offers

## Testing Checklist

### Buyer Side
- ✅ Create procurement request
- ✅ View list of own procurement requests
- ✅ Click "View Details & Quotes" button
- ✅ Page loads without blank screen
- ✅ Request details display correctly
- ✅ Status workflow shows
- ✅ Quotes section displays (empty or with quotes)
- ✅ Can send counter offers
- ✅ Can award quotes

### Farmer Side
- ✅ Browse buyer procurement requests
- ✅ See list of available requests
- ✅ Click "View Details & Submit Quote" button
- ✅ Page loads without blank screen
- ✅ Request details display correctly
- ✅ Status workflow shows
- ✅ Can submit quote
- ✅ Can update quote
- ✅ Can accept counter offers

## Status
✅ **FIXED** - Both pages now load correctly with proper data and functionality.

## Backend Server
✅ Rebuilt and restarted successfully on port 3000

# Status Flow, Negotiation & Award System - Implementation Plan

## Overview
Complete implementation of status tracking, negotiation workflow, and contract award system for both buyer and farmer perspectives.

## Status Flow Requirements

### 1. Initial Status: "Released"
- **Farmer creates listing** → Status: `released`
- **Buyer creates procurement request** → Status: `released`
- Display: "Released" in status workflow

### 2. Viewing Triggers "In Progress"
- **Buyer views farmer listing detail page** → Update status to `in_progress`
- **Farmer views buyer procurement request detail page** → Update status to `in_progress`
- Implementation: API call on page load to update status

### 3. Negotiation Status
- **Click "Negotiate" button** → Status changes to `negotiating`
- Opens modal with editable fields (price, quantity, terms)
- Submit updates the listing/request with new values
- Status remains `negotiating` until awarded

### 4. Award Status
- **Click "Award" button** → Navigate to award page
- Award page shows contract generation
- After awarding → Status changes to `awarded`

## UI Components Needed

### 1. Negotiate & Award Buttons
**Location**: Top right of detail pages
- Buyer's farmer listing detail page
- Buyer's procurement request detail page  
- Farmer's listing detail page
- Farmer's procurement request detail page

**Buttons**:
```tsx
<div className="flex space-x-3">
  <button onClick={handleNegotiate} className="btn-secondary">
    <MessageSquare className="h-4 w-4 mr-2" />
    Negotiate
  </button>
  <button onClick={handleAward} className="btn-primary">
    <Award className="h-4 w-4 mr-2" />
    Award
  </button>
</div>
```

### 2. Negotiation Modal
**Fields to Edit**:
- Price per unit
- Quantity
- Quality requirements
- Delivery/Pickup terms
- Additional notes

**Actions**:
- Save changes → Updates listing/request
- Cancel → Closes modal

### 3. Award Page
**Route**: `/award/:type/:id`
- type: 'listing' or 'procurement'
- id: listing/request ID

**Components**:
- Award summary (crop, quantity, price)
- Quantity to award input
- Contract template display
- Download contract button
- Finalize award button

## Backend API Endpoints

### Status Update Endpoints
```typescript
// Update status when viewing
PUT /api/farmer/listings/:id/status
PUT /api/buyer/procurement-requests/:id/status
Body: { status: 'in_progress' | 'negotiating' | 'awarding' | 'awarded' }

// Negotiate (update fields)
PUT /api/farmer/listings/:id/negotiate
PUT /api/buyer/procurement-requests/:id/negotiate
Body: { pricePerUnit, quantity, terms, notes }

// Award
POST /api/farmer/listings/:id/award
POST /api/buyer/procurement-requests/:id/award
Body: { awardedQuantity, buyerId/farmerId, contractTerms }
```

### Contract Generation
```typescript
POST /api/contracts/generate
Body: {
  type: 'listing' | 'procurement',
  listingId/requestId,
  buyerId,
  farmerId,
  quantity,
  pricePerUnit,
  terms
}
Response: { contractId, contractPDF: base64 }
```

## Implementation Steps

### Phase 1: Status Updates (PRIORITY)
1. ✅ Update create methods to set status='released'
2. ✅ Update StatusWorkflow component to handle all statuses
3. ⏳ Add API endpoints for status updates
4. ⏳ Add status update on page view (useEffect)
5. ⏳ Test status flow

### Phase 2: Negotiate & Award Buttons
1. ⏳ Add buttons to all 4 detail pages
2. ⏳ Create negotiation modal component
3. ⏳ Implement negotiate API calls
4. ⏳ Test negotiation workflow

### Phase 3: Award Page & Contract
1. ⏳ Create Award page component
2. ⏳ Create contract template
3. ⏳ Implement contract generation (PDF)
4. ⏳ Add download functionality
5. ⏳ Test award workflow

## File Changes Required

### Backend
- `backend/src/controllers/farmer.controller.ts` - Add status update, negotiate, award methods
- `backend/src/controllers/buyer.controller.ts` - Add status update, negotiate, award methods
- `backend/src/routes/farmer.routes.ts` - Add new routes
- `backend/src/routes/buyer.routes.ts` - Add new routes
- `backend/src/services/contract.service.ts` - NEW: Contract generation service

### Frontend
- `src/components/StatusWorkflow.tsx` - ✅ Updated
- `src/components/NegotiationModal.tsx` - NEW
- `src/pages/Award.tsx` - NEW
- `src/pages/buyer/FarmerListingDetail.tsx` - Add buttons, status update
- `src/pages/buyer/ProcurementRequestDetail.tsx` - Add buttons, status update
- `src/pages/farmer/ListingDetail.tsx` - Add buttons, status update
- `src/pages/farmer/ProcurementRequestDetail.tsx` - Add buttons, status update
- `src/services/api.ts` - Add new API methods
- `src/App.tsx` - Add Award route

## Status Mapping

| User Action | Old Status | New Status |
|-------------|------------|------------|
| Create listing/request | - | released |
| View detail page | released | in_progress |
| Click Negotiate | in_progress | negotiating |
| Submit negotiation | negotiating | negotiating |
| Click Award | negotiating | awarding |
| Finalize award | awarding | awarded |

## Contract Template Structure

```
AGRICULTURAL PRODUCE CONTRACT

Contract ID: [AUTO-GENERATED]
Date: [CURRENT_DATE]

BETWEEN:
Seller (Farmer): [FARMER_NAME]
Address: [FARMER_ADDRESS]
Contact: [FARMER_PHONE]

AND:
Buyer: [BUYER_NAME]
Address: [BUYER_ADDRESS]
Contact: [BUYER_PHONE]

TERMS:
1. Produce: [CROP_TYPE] ([VARIETY])
2. Quantity: [QUANTITY] [UNIT]
3. Quality Grade: [GRADE]
4. Price: ₹[PRICE_PER_UNIT] per [UNIT]
5. Total Amount: ₹[TOTAL_AMOUNT]
6. Delivery Location: [LOCATION]
7. Delivery Date: [DATE]

PAYMENT TERMS:
[PAYMENT_TERMS]

QUALITY STANDARDS:
[QUALITY_REQUIREMENTS]

SIGNATURES:
Farmer: _________________ Date: _______
Buyer: __________________ Date: _______
```

## Next Steps
1. Complete Phase 1 (Status Updates)
2. Implement Negotiate & Award buttons
3. Create Award page with contract generation
4. Test complete workflow end-to-end

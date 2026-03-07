# Negotiation Authorization Fix

## Problem Identified

**Error**: "Unauthorized" when buyer tries to negotiate a farmer's listing

**Root Cause**: Incorrect negotiation flow implementation

### What Was Wrong:

```javascript
// WRONG: Buyer trying to negotiate farmer's listing directly
// This calls: PUT /farmer/listings/:id/negotiate
// Only the farmer (owner) can do this!
await apiService.negotiateListing(id, updates)
```

### Why It Failed:

The backend checks:
```typescript
// farmer.controller.ts - negotiateListing()
if (listing.farmerId !== userId) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

Since the buyer is not the owner of the listing, they get "Unauthorized".

---

## Correct Negotiation Flow

### Scenario 1: Buyer Interested in Farmer's Listing

```
┌─────────────────────────────────────────────────────────┐
│  Farmer Creates Listing                                  │
│  ├─ Crop: Rice                                          │
│  ├─ Price: ₹50/kg                                       │
│  └─ Quantity: 1000 kg                                   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Buyer Submits OFFER (not negotiate listing)            │
│  ├─ Offered Price: ₹45/kg                               │
│  ├─ Quantity: 1000 kg                                   │
│  └─ API: POST /api/buyer/offers                         │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Farmer Responds                                         │
│  ├─ Option A: Accept Offer                              │
│  ├─ Option B: Counter Offer (₹48/kg)                    │
│  └─ Option C: Reject Offer                              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Buyer Responds to Counter                               │
│  ├─ Option A: Accept Counter                            │
│  ├─ Option B: Counter Again                             │
│  └─ Option C: Withdraw                                  │
└─────────────────────────────────────────────────────────┘
```

### Scenario 2: Farmer Interested in Buyer's Procurement Request

```
┌─────────────────────────────────────────────────────────┐
│  Buyer Creates Procurement Request                       │
│  ├─ Crop: Wheat                                         │
│  ├─ Max Price: ₹55/kg                                   │
│  └─ Quantity: 2000 kg                                   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Farmer Submits QUOTE (not negotiate request)           │
│  ├─ Quoted Price: ₹60/kg                                │
│  ├─ Quantity: 2000 kg                                   │
│  └─ API: POST /api/quotes                               │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Buyer Responds                                          │
│  ├─ Option A: Accept Quote                              │
│  ├─ Option B: Counter Offer (₹57/kg)                    │
│  └─ Option C: Reject Quote                              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Farmer Responds to Counter                              │
│  ├─ Option A: Accept Counter                            │
│  ├─ Option B: Counter Again                             │
│  └─ Option C: Withdraw                                  │
└─────────────────────────────────────────────────────────┘
```

---

## What Was Fixed

### File 1: `src/pages/buyer/FarmerListingDetail.tsx`

**Before (Wrong):**
```typescript
const handleNegotiate = async (updates: any) => {
  // Trying to negotiate farmer's listing directly - UNAUTHORIZED!
  await apiService.negotiateListing(id!, updates)
}
```

**After (Correct):**
```typescript
const handleNegotiate = async (updates: any) => {
  if (existingOffer) {
    // Update existing offer
    await apiService.updateOffer(existingOffer.id, {
      pricePerUnit: updates.minimumPrice,
      quantity: updates.quantity,
      message: updates.negotiationNotes
    })
  } else {
    // Submit new offer
    await apiService.submitOffer({
      listingId: id!,
      pricePerUnit: updates.minimumPrice,
      quantity: updates.quantity,
      quantityUnit: listing?.quantityUnit,
      message: updates.negotiationNotes
    })
  }
}
```

### File 2: `src/pages/farmer/ProcurementRequestDetail.tsx`

**Before (Wrong):**
```typescript
const handleNegotiate = async (updates: any) => {
  // Trying to negotiate buyer's request directly - UNAUTHORIZED!
  await apiService.negotiateProcurement(id!, updates)
}
```

**After (Correct):**
```typescript
const handleNegotiate = async (updates: any) => {
  if (existingQuote) {
    // Update existing quote
    await apiService.updateQuote(existingQuote.id, {
      pricePerUnit: updates.maxPricePerUnit,
      quantity: updates.quantity,
      message: updates.negotiationNotes
    })
  } else {
    // Submit new quote
    await apiService.submitQuote({
      requestId: id!,
      pricePerUnit: updates.maxPricePerUnit,
      quantity: updates.quantity,
      quantityUnit: request?.quantityUnit,
      message: updates.negotiationNotes
    })
  }
}
```

---

## API Endpoints Summary

### For Buyers (Negotiating Farmer Listings)

```typescript
// Submit initial offer
POST /api/buyer/offers
Body: { listingId, pricePerUnit, quantity, quantityUnit, message }

// Update existing offer
PUT /api/offers/:offerId
Body: { pricePerUnit, quantity, message }

// Accept farmer's counter offer
POST /api/offers/:offerId/accept

// Withdraw offer
DELETE /api/offers/:offerId
```

### For Farmers (Negotiating Buyer Requests)

```typescript
// Submit initial quote
POST /api/quotes
Body: { requestId, pricePerUnit, quantity, quantityUnit, message }

// Update existing quote
PUT /api/quotes/:quoteId
Body: { pricePerUnit, quantity, message }

// Accept buyer's counter offer
POST /api/quotes/:quoteId/accept-counter
Body: { pricePerUnit }

// Withdraw quote
DELETE /api/quotes/:quoteId
```

### For Owners Only (Negotiating Own Items)

```typescript
// Farmer negotiates their own listing
PUT /api/farmer/listings/:id/negotiate
Body: { minimumPrice, quantity, qualityGrade, negotiationNotes }

// Buyer negotiates their own procurement request
PUT /api/buyer/procurement-requests/:id/negotiate
Body: { maxPricePerUnit, quantity, qualityGrade, negotiationNotes }
```

---

## Testing

### Test Case 1: Buyer Negotiates Farmer Listing ✅

1. Login as Buyer
2. Browse farmer listings
3. Click on a listing
4. Click "Negotiate" button
5. Update price/quantity
6. Click "Update & Continue Negotiation"
7. ✅ Should submit/update offer successfully

### Test Case 2: Farmer Negotiates Buyer Request ✅

1. Login as Farmer
2. Browse procurement requests
3. Click on a request
4. Click "Negotiate" button
5. Update price/quantity
6. Click "Update & Continue Negotiation"
7. ✅ Should submit/update quote successfully

### Test Case 3: Farmer Negotiates Own Listing ✅

1. Login as Farmer
2. Go to "My Listings"
3. Click on your listing
4. Click "Negotiate" button
5. Update terms
6. ✅ Should update listing successfully

### Test Case 4: Buyer Negotiates Own Request ✅

1. Login as Buyer
2. Go to "My Procurement Requests"
3. Click on your request
4. Click "Negotiate" button
5. Update terms
6. ✅ Should update request successfully

---

## Key Takeaways

### ✅ Correct Understanding:

1. **Offers** = Buyer's proposal to Farmer's listing
2. **Quotes** = Farmer's proposal to Buyer's request
3. **Negotiate Listing** = Farmer updates their own listing
4. **Negotiate Request** = Buyer updates their own request

### ❌ Common Mistakes:

1. Buyer trying to negotiate farmer's listing directly
2. Farmer trying to negotiate buyer's request directly
3. Confusing offers/quotes with negotiation
4. Not checking ownership before allowing actions

### 🔒 Authorization Rules:

- Only **listing owner (farmer)** can negotiate the listing
- Only **request owner (buyer)** can negotiate the request
- Anyone can submit **offers** to listings
- Anyone can submit **quotes** to requests
- Only **offer owner (buyer)** can update their offer
- Only **quote owner (farmer)** can update their quote

---

## Summary

The fix ensures that:
1. ✅ Buyers submit/update **offers** (not negotiate listings)
2. ✅ Farmers submit/update **quotes** (not negotiate requests)
3. ✅ Only owners can negotiate their own items
4. ✅ No more "Unauthorized" errors
5. ✅ Proper negotiation flow maintained

The negotiation button now works correctly for all user roles!

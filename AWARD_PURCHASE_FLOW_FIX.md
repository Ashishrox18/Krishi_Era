# Award & Purchase Flow - Complete Fix ✅

## Problem Statement
The previous award/purchase flow was broken:
- Buyer clicked "Award & Purchase" but it called farmer's `acceptOffer` endpoint
- Authorization errors occurred because buyer couldn't accept their own offer
- Farmer had no opportunity to review or negotiate the final purchase

## New Flow Implemented

### Step 1: Buyer Proposes Purchase
**Action**: Buyer clicks "Propose Purchase" button
**What Happens**:
- Offer status changes to `proposed_award`
- Listing status changes to `pending_award`
- Notification sent to farmer
- Buyer sees "Awaiting Farmer Approval" status

### Step 2: Farmer Receives Notification
**Notification Content**:
```
Title: "Award Proposal Received"
Message: "[Buyer Name] wants to purchase your [Crop] at ₹[Price]/[Unit]. Review and accept or negotiate."
```

### Step 3: Farmer Reviews and Decides
**Options Available**:
1. **Accept & Finalize** - Confirms the deal at proposed price
2. **Negotiate Price** - Counter with different price

### Step 4: Deal Finalized
**When Farmer Accepts**:
- Offer status changes to `accepted`
- Listing status changes to `awarded`
- Both parties receive confirmation notifications
- Deal is complete

## Technical Implementation

### Backend Changes

#### 1. New Controller Methods
**File**: `backend/src/controllers/offers.controller.ts`

```typescript
// Buyer proposes award/purchase
async proposeAward(req: Request, res: Response) {
  // Verify buyer owns the offer
  // Update offer status to 'proposed_award'
  // Update listing status to 'pending_award'
  // Send notification to farmer
}

// Farmer accepts the award proposal
async acceptAward(req: Request, res: Response) {
  // Verify farmer owns the listing
  // Update offer status to 'accepted'
  // Update listing status to 'awarded'
  // Send notifications to both parties
}
```

#### 2. New Routes
**File**: `backend/src/routes/offers.routes.ts`

```typescript
// Buyer proposes award/purchase
router.post('/:offerId/propose-award', authenticate, controller.proposeAward);

// Farmer accepts the award proposal
router.post('/:offerId/accept-award', authenticate, controller.acceptAward);
```

### Frontend Changes

#### 1. API Service Methods
**File**: `src/services/api.ts`

```typescript
async proposeAward(offerId: string) {
  const response = await this.client.post(`/offers/${offerId}/propose-award`);
  return response.data;
}

async acceptOffer(offerId: string) {
  const response = await this.client.post(`/offers/${offerId}/accept-award`);
  return response.data;
}
```

#### 2. Buyer Page Updates
**File**: `src/pages/buyer/FarmerListingDetail.tsx`

**Changes**:
- Button text changed from "Award & Purchase" to "Propose Purchase"
- Calls `proposeAward()` instead of `acceptOffer()`
- Shows "Awaiting Farmer Approval" status for `proposed_award` offers
- Disables update button when proposal is pending
- Shows purple status badge for pending proposals

**UI States**:
```typescript
// Offer status display
{myOffer.status === 'proposed_award' ? 'AWAITING FARMER APPROVAL' : myOffer.status.toUpperCase()}

// Status message
{myOffer.status === 'proposed_award' && (
  <div className="p-4 bg-purple-100 rounded border border-purple-300">
    <p>⏳ Purchase proposal sent to farmer</p>
    <p>Waiting for the farmer to review and accept your purchase proposal.</p>
  </div>
)}
```

#### 3. Farmer Page Updates
**File**: `src/pages/farmer/ListingDetail.tsx`

**Changes**:
- Shows "PURCHASE PROPOSED" status badge for `proposed_award` offers
- Button text changes to "Accept & Finalize" for proposed awards
- Button text changes to "Negotiate Price" for proposed awards
- Shows special message for proposed awards

**UI States**:
```typescript
// Status badge
{offer.status === 'proposed_award' ? 'PURCHASE PROPOSED' : offer.status.toUpperCase()}

// Action buttons
<button onClick={() => handleAcceptOffer(offer.id)}>
  {offer.status === 'proposed_award' ? 'Accept & Finalize' : 'Accept Offer'}
</button>

// Special message
{offer.status === 'proposed_award' && (
  <div className="p-3 bg-purple-50 rounded border border-purple-200">
    <p>🎯 Buyer wants to purchase!</p>
    <p>Accept to finalize the deal or negotiate for a better price.</p>
  </div>
)}
```

## Complete User Flow

### Buyer Journey

1. **Browse Listings**
   - Go to `/buyer/procurement`
   - Click on a farmer's listing

2. **Submit Offer**
   - Fill form with price, quantity, message
   - Click "Submit Offer"
   - Offer status: `pending`

3. **Wait for Farmer Response**
   - Farmer may counter offer
   - Buyer can update offer if countered

4. **Propose Purchase**
   - When ready to buy, click "Propose Purchase"
   - Offer status changes to: `proposed_award`
   - See message: "Purchase proposal sent to farmer"

5. **Wait for Farmer Approval**
   - Status shows: "AWAITING FARMER APPROVAL"
   - Cannot update offer while pending

6. **Deal Finalized**
   - Farmer accepts proposal
   - Receive notification: "Deal Finalized!"
   - Offer status: `accepted`
   - Listing status: `awarded`

### Farmer Journey

1. **Receive Offer Notification**
   - Notification: "New Offer Received"
   - Click to view listing and offers

2. **Review Offers**
   - See all offers with buyer details
   - Compare prices with minimum
   - Options: Accept or Counter

3. **Receive Purchase Proposal**
   - Notification: "Award Proposal Received"
   - Offer shows: "PURCHASE PROPOSED" badge
   - Special message: "🎯 Buyer wants to purchase!"

4. **Make Decision**
   - **Option A: Accept & Finalize**
     - Click "Accept & Finalize"
     - Deal is confirmed
     - Both parties notified
   
   - **Option B: Negotiate Price**
     - Click "Negotiate Price"
     - Enter counter price and message
     - Buyer receives counter offer
     - Offer status back to `countered`

5. **Deal Complete**
   - Listing status: `awarded`
   - Receive confirmation notification
   - Proceed with delivery arrangements

## Offer Status Flow

```
pending → countered → proposed_award → accepted
   ↓         ↓            ↓
   └─────────┴────────────┘
   (Can negotiate at any stage before acceptance)
```

### Status Definitions

| Status | Description | Who Can Act | Actions Available |
|--------|-------------|-------------|-------------------|
| `pending` | Initial offer submitted | Farmer | Accept, Counter |
| `countered` | Farmer countered the offer | Buyer | Update offer, Propose purchase |
| `proposed_award` | Buyer wants to purchase | Farmer | Accept & finalize, Negotiate |
| `accepted` | Deal finalized | None | Complete (read-only) |

## Notifications Sent

### 1. Buyer Submits Offer
**To**: Farmer
```
Title: "New Offer Received"
Message: "[Buyer] offered ₹[Price]/[Unit] for your [Crop]"
Link: /farmer/listing/:id
```

### 2. Farmer Counters Offer
**To**: Buyer
```
Title: "Counter Offer Received"
Message: "[Farmer] countered with ₹[Price]/[Unit]"
Link: /buyer/farmer-listing/:id
```

### 3. Buyer Proposes Purchase
**To**: Farmer
```
Title: "Award Proposal Received"
Message: "[Buyer] wants to purchase your [Crop] at ₹[Price]/[Unit]. Review and accept or negotiate."
Link: /farmer/listing/:id
```

### 4. Farmer Accepts Award
**To**: Buyer
```
Title: "Deal Finalized!"
Message: "[Farmer] accepted your purchase proposal for [Crop]. Proceed with delivery arrangements."
Link: /buyer/farmer-listing/:id
```

**To**: Farmer
```
Title: "Deal Confirmed"
Message: "You confirmed the sale of your [Crop] to [Buyer] at ₹[Price]/[Unit]"
Link: /farmer/listing/:id
```

## Database Schema Updates

### Offer Record
```json
{
  "id": "offer-uuid",
  "listingId": "listing-uuid",
  "buyerId": "buyer-uuid",
  "buyerName": "John Doe",
  "pricePerUnit": 50,
  "quantity": 100,
  "quantityUnit": "kg",
  "message": "Interested in your wheat",
  "status": "proposed_award",  // NEW STATUS
  "proposedAt": "2026-03-07T18:00:00Z",  // NEW FIELD
  "acceptedAt": "2026-03-07T19:00:00Z",  // When farmer accepts
  "type": "offer",
  "createdAt": "2026-03-07T17:00:00Z",
  "updatedAt": "2026-03-07T18:00:00Z"
}
```

### Listing Record
```json
{
  "id": "listing-uuid",
  "farmerId": "farmer-uuid",
  "cropType": "Wheat",
  "status": "pending_award",  // NEW STATUS
  "pendingAwardOfferId": "offer-uuid",  // NEW FIELD
  "awardedOfferId": "offer-uuid",  // When finalized
  ...
}
```

## API Endpoints

### Buyer Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/buyer/offers` | Submit initial offer | Buyer |
| PUT | `/api/offers/:offerId` | Update offer | Buyer |
| POST | `/api/offers/:offerId/propose-award` | Propose purchase | Buyer |

### Farmer Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/offers/listing/:listingId` | Get all offers | Farmer |
| POST | `/api/offers/:offerId/counter` | Counter offer | Farmer |
| POST | `/api/offers/:offerId/accept-award` | Accept & finalize | Farmer |

## Testing Steps

### Test Complete Flow:

1. **As Buyer**:
   ```
   1. Login as buyer
   2. Go to /buyer/procurement
   3. Click on a listing
   4. Submit offer with price and quantity
   5. Wait for farmer response (or proceed)
   6. Click "Propose Purchase"
   7. Verify status shows "AWAITING FARMER APPROVAL"
   8. Check notification bell for updates
   ```

2. **As Farmer**:
   ```
   1. Login as farmer
   2. Check notification bell (should show new notification)
   3. Click "Award Proposal Received" notification
   4. View offer with "PURCHASE PROPOSED" badge
   5. See special message: "Buyer wants to purchase!"
   6. Options:
      - Click "Accept & Finalize" to confirm deal
      - Click "Negotiate Price" to counter
   ```

3. **Verify Finalization**:
   ```
   1. Farmer clicks "Accept & Finalize"
   2. Both parties receive notifications
   3. Buyer sees "Deal Finalized!" message
   4. Farmer sees "Deal Confirmed" message
   5. Listing status changes to "awarded"
   6. Offer status changes to "accepted"
   ```

## Error Handling

- ✅ Authorization checks ensure only buyer can propose award
- ✅ Authorization checks ensure only farmer can accept award
- ✅ Cannot propose award without submitting offer first
- ✅ Cannot update offer while proposal is pending
- ✅ Graceful notification failures don't block transactions
- ✅ Proper error messages for all failure scenarios

## Benefits of New Flow

1. **Clear Intent**: Buyer explicitly proposes purchase
2. **Farmer Control**: Farmer can review before finalizing
3. **Negotiation Option**: Farmer can still negotiate even after proposal
4. **Proper Authorization**: Each party can only perform their actions
5. **Better UX**: Clear status messages at each stage
6. **Notifications**: Both parties stay informed
7. **Audit Trail**: All actions tracked with timestamps

## Status: ✅ COMPLETE

The award and purchase flow now works correctly:
- ✅ Buyer can propose purchase
- ✅ Farmer receives notification
- ✅ Farmer can accept or negotiate
- ✅ Deal finalizes only when farmer accepts
- ✅ Both parties receive appropriate notifications
- ✅ Clear status indicators throughout the process

---

**Summary**: Implemented a proper two-step award process where buyers propose purchases and farmers must accept before deals are finalized. This gives farmers the opportunity to review and negotiate even at the final stage.

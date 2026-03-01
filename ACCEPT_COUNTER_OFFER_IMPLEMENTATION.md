# Accept Counter Offer Implementation

## Summary
Added the ability for farmers to accept buyer counter offers on procurement requests, completing the negotiation workflow.

## Changes Made

### Frontend Changes

#### 1. Updated `src/pages/farmer/ProcurementRequestDetail.tsx`
- Added "Accept Counter Offer" button in the counter offers section
- Button appears only for the latest counter offer when quote status is not 'accepted'
- Added `handleAcceptCounterOffer` function to handle accepting counter offers
- Imported `Award` icon from lucide-react
- Shows confirmation dialog before accepting
- Updates quote with buyer's counter price and finalizes the deal

#### 2. Updated `src/services/api.ts`
- Added `acceptCounterOffer(quoteId, counterPrice)` method
- Calls POST `/api/quotes/:quoteId/accept-counter` endpoint
- Sends the counter price to be accepted

### Backend Changes

#### 1. Created `backend/src/controllers/quotes.controller.ts`
- `submitQuote`: Farmer submits quote for procurement request
- `getQuotesForRequest`: Get all quotes for a procurement request
- `updateQuote`: Farmer updates their quote
- `acceptQuote`: Buyer accepts/awards a quote
- `counterOffer`: Buyer sends counter offer to farmer
- `acceptCounterOffer`: Farmer accepts buyer's counter offer (NEW)

#### 2. Created `backend/src/routes/quotes.routes.ts`
- POST `/quotes` - Submit quote
- GET `/quotes/request/:requestId` - Get quotes for request
- PUT `/quotes/:quoteId` - Update quote
- POST `/quotes/:quoteId/accept` - Accept quote (buyer awards)
- POST `/quotes/:quoteId/counter` - Counter offer (buyer)
- POST `/quotes/:quoteId/accept-counter` - Accept counter offer (farmer)

#### 3. Created `backend/src/controllers/offers.controller.ts`
- `getOffersForListing`: Get all offers for a farmer listing
- `updateOffer`: Buyer updates their offer
- `acceptOffer`: Farmer accepts buyer's offer
- `counterOffer`: Farmer sends counter offer to buyer

#### 4. Created `backend/src/routes/offers.routes.ts`
- PUT `/offers/:offerId` - Update offer
- POST `/offers/:offerId/accept` - Accept offer
- POST `/offers/:offerId/counter` - Counter offer

#### 5. Updated `backend/src/server.ts`
- Added quotes routes: `app.use('/api/quotes', quotesRoutes)`
- Added offers routes: `app.use('/api/offers', offersRoutes)`

## Workflow

### Procurement Request Negotiation (Buyer → Farmer)
1. Buyer creates procurement request
2. Farmer submits quote
3. Buyer sends counter offer (lower price)
4. Farmer can either:
   - Update quote with new price
   - **Accept buyer's counter offer** (NEW FEATURE)
5. When farmer accepts counter offer:
   - Quote status → 'accepted'
   - Quote price updated to counter offer price
   - Procurement request status → 'awarded'
   - Deal is finalized

### Farmer Listing Negotiation (Farmer → Buyer)
1. Farmer creates listing
2. Buyer submits offer
3. Farmer sends counter offer (higher price)
4. Buyer can either:
   - Update offer with new price
   - Accept farmer's counter offer
5. When buyer accepts counter offer:
   - Offer status → 'accepted'
   - Listing status → 'awarded'
   - Deal is finalized

## UI Features

### Accept Counter Offer Button
- Appears in orange-bordered counter offer section
- Only shows for the latest counter offer
- Hidden if quote is already accepted or request is awarded
- Green button with Award icon
- Shows confirmation dialog with counter price
- Success message after acceptance

## Database Tables

### QUOTES Table
- Stores farmer quotes for buyer procurement requests
- Fields: id, requestId, farmerId, pricePerUnit, quantity, status, negotiationHistory
- Status values: 'pending', 'countered', 'accepted'

### OFFERS Table
- Stores buyer offers for farmer listings
- Fields: id, listingId, buyerId, pricePerUnit, quantity, status, negotiationHistory
- Status values: 'pending', 'countered', 'accepted'

### ORDERS Table
- Stores both procurement requests (buyerId) and farmer listings (farmerId)
- Status values: 'open', 'negotiating', 'awarded'

## Testing

To test the feature:
1. Login as buyer, create procurement request
2. Login as farmer, browse procurement requests
3. Submit a quote on the request
4. Login as buyer, view procurement request detail
5. Send counter offer to farmer's quote
6. Login as farmer, view procurement request detail
7. See buyer's counter offer with "Accept This Counter Offer" button
8. Click button, confirm acceptance
9. Quote should be marked as accepted with counter price
10. Procurement request should be marked as awarded

## Status
✅ Frontend implementation complete
✅ Backend API endpoints created
✅ Backend server restarted
✅ Ready for testing

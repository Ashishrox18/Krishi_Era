# Buyer Update Offer Notification Fix ✅

## Problem
When a buyer updates their offer (second time or more), the farmer doesn't receive a notification about the updated offer.

## Root Cause
The `updateOffer` method in the offers controller was:
- ❌ Not sending any notification to the farmer
- ❌ Not resetting the offer status
- ❌ Not logging the update action

## Solution Implemented

### Updated Method
**File**: `backend/src/controllers/offers.controller.ts`

Added notification sending when buyer updates offer:

```typescript
async updateOffer(req: Request, res: Response) {
  try {
    const { offerId } = req.params;
    const { pricePerUnit, quantity, message } = req.body;
    const buyerId = (req as any).user.id;
    const tableName = getTableName();

    console.log('📝 Updating offer:', { offerId, buyerId, pricePerUnit, quantity });

    const offer = await dynamoDBService.get(tableName, { id: offerId });

    if (!offer || offer.buyerId !== buyerId) {
      console.error('❌ Offer not found or unauthorized');
      return res.status(404).json({ error: 'Offer not found' });
    }

    const updatedOffer = {
      ...offer,
      pricePerUnit,
      quantity,
      message,
      status: 'pending', // Reset status to pending when buyer updates
      updatedAt: new Date().toISOString()
    };

    await dynamoDBService.put(tableName, updatedOffer);

    // Get the listing to notify the farmer
    try {
      const listing = await dynamoDBService.get(tableName, { id: offer.listingId });
      if (listing && listing.farmerId) {
        await NotificationsController.createNotification({
          userId: listing.farmerId,
          title: 'Offer Updated',
          message: `${offer.buyerName} updated their offer to ₹${pricePerUnit}/${offer.quantityUnit} for your ${listing.cropType}`,
          type: 'offer',
          relatedId: listing.id,
          link: `/farmer/listing/${listing.id}`
        });
        console.log('✅ Notification sent to farmer:', listing.farmerId);
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the request if notifications fail
    }

    console.log('✅ Offer updated successfully');
    res.json({ success: true, offer: updatedOffer });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ error: 'Failed to update offer' });
  }
}
```

## Key Changes

### 1. Added Notification
When buyer updates offer, farmer receives:
```
Title: "Offer Updated"
Message: "[Buyer Name] updated their offer to ₹[Price]/[Unit] for your [Crop]"
Type: offer
Link: /farmer/listing/:id
```

### 2. Reset Status to Pending
```typescript
status: 'pending', // Reset status to pending when buyer updates
```

This ensures:
- Farmer knows there's a new offer to review
- Status accurately reflects current state
- Farmer can accept or counter the updated offer

### 3. Added Logging
```typescript
console.log('📝 Updating offer:', { offerId, buyerId, pricePerUnit, quantity });
console.log('✅ Notification sent to farmer:', listing.farmerId);
console.log('✅ Offer updated successfully');
```

Benefits:
- Easy debugging
- Track update flow
- Monitor notification delivery

### 4. Error Handling
```typescript
try {
  // Send notification
} catch (notificationError) {
  console.error('Failed to send notification:', notificationError);
  // Don't fail the request if notifications fail
}
```

Ensures:
- Offer update succeeds even if notification fails
- Errors are logged for debugging
- Graceful degradation

## Complete Flow Now

### Scenario: Buyer Updates Offer After Farmer Counter

1. **Initial State**:
   - Buyer submitted offer: ₹50/kg
   - Farmer countered: ₹55/kg
   - Offer status: `countered`

2. **Buyer Updates Offer**:
   - Buyer clicks "Update Offer"
   - Changes price to ₹52/kg
   - Adds message: "Can we meet at ₹52?"
   - Clicks "Update Offer"

3. **Backend Processing**:
   - Offer updated in database
   - Status reset to: `pending`
   - Notification created for farmer
   - Response sent to buyer

4. **Farmer Receives Notification** (within 10 seconds):
   - Notification bell shows red badge
   - Title: "Offer Updated"
   - Message: "John Doe updated their offer to ₹52/kg for your Wheat"
   - Click to view listing

5. **Farmer Views Updated Offer**:
   - Page auto-refreshes (10s polling)
   - Sees updated price: ₹52/kg
   - Status shows: `PENDING`
   - Can accept or counter again

6. **Negotiation Continues**:
   - Farmer can accept the ₹52/kg offer
   - Or counter with ₹53/kg
   - Process repeats until agreement

## Notification Details

### When Sent
- Every time buyer updates their offer
- Regardless of how many times updated
- Even if farmer previously countered

### Notification Content
```json
{
  "userId": "farmer-uuid",
  "title": "Offer Updated",
  "message": "John Doe updated their offer to ₹52/kg for your Wheat",
  "notificationType": "offer",
  "relatedId": "listing-uuid",
  "link": "/farmer/listing/listing-uuid",
  "read": false,
  "createdAt": "2026-03-07T19:00:00Z"
}
```

### Farmer Experience
1. Red badge appears on notification bell
2. Click bell to see notification
3. Click notification to go to listing
4. See updated offer with new price
5. Can accept or counter

## Testing Steps

### Test Update Offer Flow:

1. **Setup**:
   ```
   - Farmer creates listing: Wheat, ₹45/kg minimum
   - Buyer submits offer: ₹50/kg
   - Farmer counters: ₹55/kg
   ```

2. **As Buyer**:
   ```
   1. Login as buyer
   2. Go to listing page
   3. See farmer's counter: ₹55/kg
   4. Click "Update Offer"
   5. Change price to ₹52/kg
   6. Add message: "Can we meet at ₹52?"
   7. Click "Update Offer"
   8. Verify success message
   ```

3. **As Farmer** (different browser/incognito):
   ```
   1. Stay on listing page (don't refresh)
   2. Wait 10 seconds
   3. Should see:
      - Notification bell badge updates
      - New notification: "Offer Updated"
      - Offer status changes to "PENDING"
      - Price updates to ₹52/kg
   4. Click notification bell
   5. See "Offer Updated" notification
   6. Click notification
   7. View updated offer details
   ```

4. **Verify Multiple Updates**:
   ```
   1. Buyer updates again to ₹53/kg
   2. Farmer receives another notification
   3. Buyer updates again to ₹54/kg
   4. Farmer receives another notification
   5. Each update triggers notification
   ```

## Backend Logs

### When Buyer Updates Offer:
```
📝 Updating offer: { offerId: '...', buyerId: '...', pricePerUnit: 52, quantity: 100 }
✅ Notification sent to farmer: farmer-uuid
✅ Offer updated successfully
```

### If Notification Fails:
```
📝 Updating offer: { offerId: '...', buyerId: '...', pricePerUnit: 52, quantity: 100 }
Failed to send notification: Error message
✅ Offer updated successfully
```

Note: Offer still updates even if notification fails.

## Database Changes

### Before Update:
```json
{
  "id": "offer-uuid",
  "buyerId": "buyer-uuid",
  "pricePerUnit": 50,
  "status": "countered",
  "negotiationHistory": [
    {
      "type": "counter",
      "by": "farmer",
      "price": 55,
      "message": "Quality is Grade A",
      "timestamp": "2026-03-07T18:00:00Z"
    }
  ],
  "updatedAt": "2026-03-07T18:00:00Z"
}
```

### After Update:
```json
{
  "id": "offer-uuid",
  "buyerId": "buyer-uuid",
  "pricePerUnit": 52,
  "status": "pending",
  "negotiationHistory": [
    {
      "type": "counter",
      "by": "farmer",
      "price": 55,
      "message": "Quality is Grade A",
      "timestamp": "2026-03-07T18:00:00Z"
    }
  ],
  "updatedAt": "2026-03-07T19:00:00Z"
}
```

Note: Negotiation history is preserved.

## Benefits

1. **Farmer Awareness**
   - Farmer knows when buyer updates offer
   - No need to manually check
   - Real-time notifications

2. **Better Communication**
   - Clear notification messages
   - Direct link to listing
   - Updated price visible

3. **Smooth Negotiation**
   - Status reset to pending
   - Farmer can respond immediately
   - Process continues seamlessly

4. **Debugging**
   - Detailed logging
   - Easy to track issues
   - Clear error messages

5. **Reliability**
   - Graceful error handling
   - Offer updates even if notification fails
   - No data loss

## Status: ✅ COMPLETE

The buyer update offer notification issue is now fixed:
- ✅ Farmer receives notification when buyer updates offer
- ✅ Notification sent every time offer is updated
- ✅ Status reset to pending for farmer review
- ✅ Detailed logging for debugging
- ✅ Graceful error handling
- ✅ Works for multiple updates

---

**Summary**: Added notification sending to the `updateOffer` method so farmers receive notifications whenever buyers update their offers. Status is reset to pending and detailed logging is added for better debugging.

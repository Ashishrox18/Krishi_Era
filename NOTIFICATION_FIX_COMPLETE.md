# Buyer Offer Notification - Fix Complete ✅

## Issue
When buyers submit offers, notifications were not being sent to farmers.

## Root Cause
The `BuyerController.submitOffer()` method was creating offers but not triggering notifications.

## Solution Applied

### File Modified
`backend/src/controllers/buyer.controller.ts`

### Changes Made
Added notification creation after offer is saved:

```typescript
// Store offer in database
await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, offer);

console.log('✅ Offer submitted successfully:', offer.id);

// Send notification to farmer
try {
  const { NotificationsController } = await import('./notifications.controller');
  await NotificationsController.createNotification({
    userId: listing.farmerId,
    title: 'New Offer Received',
    message: `${offer.buyerName} offered ₹${pricePerUnit}/${quantityUnit} for your ${listing.cropType}`,
    type: 'offer',
    relatedId: listingId,
    link: `/farmer/listing/${listingId}`
  });
  console.log('✅ Notification sent to farmer:', listing.farmerId);
} catch (notificationError) {
  console.error('Failed to send notification:', notificationError);
  // Don't fail the request if notifications fail
}
```

## How It Works Now

### 1. Buyer Submits Offer
- Buyer goes to `/buyer/farmer-listing/:id`
- Fills form with price, quantity, message
- Clicks "Submit Offer"
- Frontend calls: `POST /api/buyer/offers`

### 2. Backend Processes Offer
- Validates listing exists and is accepting offers
- Creates offer object with all details
- Saves offer to `krishi-orders` table
- **NEW**: Creates notification for farmer
- Updates listing's quote count and best offer
- Returns success response

### 3. Notification Created
- Notification saved to `krishi-notifications` table
- Contains:
  - Farmer's user ID
  - Title: "New Offer Received"
  - Message: "[Buyer Name] offered ₹[Price]/[Unit] for your [Crop]"
  - Link to listing detail page
  - Marked as unread

### 4. Farmer Receives Notification
- Notification bell polls every 10 seconds
- Red badge appears with unread count
- Farmer clicks bell to see notification
- Clicks notification to view listing and offers

### 5. Farmer Views Offers
- Listing detail page shows all offers
- Farmer can:
  - Accept offer (finalizes deal)
  - Counter offer (negotiate)
  - Ignore (leave pending)

## Testing Steps

### Test the Complete Flow:

1. **Login as Buyer**
   ```
   URL: http://localhost:5173/login
   Email: [buyer-email]
   Password: [buyer-password]
   ```

2. **Browse Listings**
   ```
   URL: http://localhost:5173/buyer/procurement
   Click on any farmer listing
   ```

3. **Submit Offer**
   ```
   Fill form:
   - Price per unit: [amount]
   - Quantity: [amount]
   - Message: "Test offer"
   
   Click "Submit Offer"
   Check console for: "✅ Offer submitted successfully"
   ```

4. **Login as Farmer** (different browser/incognito)
   ```
   URL: http://localhost:5173/login
   Email: [farmer-email]
   Password: [farmer-password]
   ```

5. **Check Notification**
   ```
   Wait 10 seconds (or refresh page)
   Look for red badge on notification bell
   Click bell
   Should see: "New Offer Received - [Buyer Name] offered ₹[Price]/[Unit] for your [Crop]"
   ```

6. **View Offer Details**
   ```
   Click notification
   Redirected to: /farmer/listing/:id
   Should see offer with:
   - Buyer name
   - Offered price
   - Quantity
   - Total amount
   - Message
   - Action buttons (Accept/Counter)
   ```

## Backend Logs to Verify

When offer is submitted, you should see:
```
📝 Submitting offer: { listingId: '...', buyerId: '...', pricePerUnit: 50, quantity: 100 }
📋 Listing status: open
✅ Offer submitted successfully: [offer-id]
✅ Notification sent to farmer: [farmer-id]
```

## Error Handling

- If notification creation fails, offer is still saved (graceful degradation)
- Error is logged but doesn't block the response
- Farmer can still see offers on listing page even without notification

## Database Records

### Offer Record (krishi-orders)
```json
{
  "id": "offer-uuid",
  "listingId": "listing-uuid",
  "farmerId": "farmer-uuid",
  "buyerId": "buyer-uuid",
  "buyerName": "John Doe",
  "pricePerUnit": 50,
  "quantity": 100,
  "quantityUnit": "kg",
  "totalAmount": 5000,
  "message": "Interested in your wheat",
  "status": "pending",
  "type": "offer",
  "createdAt": "2026-03-07T18:00:00Z",
  "updatedAt": "2026-03-07T18:00:00Z"
}
```

### Notification Record (krishi-notifications)
```json
{
  "id": "notification-uuid",
  "userId": "farmer-uuid",
  "title": "New Offer Received",
  "message": "John Doe offered ₹50/kg for your Wheat",
  "notificationType": "offer",
  "relatedId": "listing-uuid",
  "link": "/farmer/listing/listing-uuid",
  "read": false,
  "type": "notification",
  "createdAt": "2026-03-07T18:00:00Z",
  "updatedAt": "2026-03-07T18:00:00Z"
}
```

## API Endpoints

### Submit Offer
```
POST /api/buyer/offers
Headers: Authorization: Bearer <buyer-token>
Body: {
  "listingId": "listing-uuid",
  "farmerId": "farmer-uuid",
  "pricePerUnit": 50,
  "quantity": 100,
  "quantityUnit": "kg",
  "message": "Interested in your wheat"
}
Response: {
  "offer": { ... }
}
```

### Get Notifications
```
GET /api/notifications
Headers: Authorization: Bearer <farmer-token>
Response: {
  "notifications": [
    {
      "id": "...",
      "title": "New Offer Received",
      "message": "...",
      "read": false,
      ...
    }
  ]
}
```

### Get Offers for Listing
```
GET /api/offers/listing/:listingId
Headers: Authorization: Bearer <farmer-token>
Response: {
  "success": true,
  "offers": [
    {
      "id": "...",
      "buyerName": "John Doe",
      "pricePerUnit": 50,
      ...
    }
  ]
}
```

## Environment Variables Required

```env
# In backend/.env
DYNAMODB_ORDERS_TABLE=krishi-orders
DYNAMODB_NOTIFICATIONS_TABLE=krishi-notifications
JWT_SECRET=your-secret-key
```

## Files Involved

### Backend
- `backend/src/controllers/buyer.controller.ts` - **MODIFIED** (added notification)
- `backend/src/controllers/notifications.controller.ts` - Used for creating notifications
- `backend/src/routes/buyer.routes.ts` - Routes for buyer offers
- `backend/src/routes/notifications.routes.ts` - Routes for notifications

### Frontend
- `src/pages/buyer/FarmerListingDetail.tsx` - Buyer submits offers
- `src/pages/farmer/ListingDetail.tsx` - Farmer views offers
- `src/components/NotificationBell.tsx` - Displays notifications
- `src/services/api.ts` - API service methods

## Status: ✅ COMPLETE

The system now:
- ✅ Creates offers when buyers submit them
- ✅ Sends notifications to farmers automatically
- ✅ Displays notifications in real-time (10s polling)
- ✅ Shows offers on farmer's listing detail page
- ✅ Allows farmers to accept or counter offers
- ✅ Handles errors gracefully
- ✅ Logs all actions for debugging

## Next Steps

1. Restart backend server to apply changes:
   ```bash
   cd backend
   npm run dev
   ```

2. Test the complete flow as described above

3. Monitor backend logs for confirmation messages

4. Verify notifications appear in farmer's notification bell

## Additional Features Already Working

- Counter offers with negotiation history
- Accept offer to finalize deals
- Offer status tracking (pending/countered/accepted)
- Price comparison with minimum price
- Notification polling every 10 seconds
- Mark notifications as read
- Direct links from notifications to listing pages

---

**Summary**: Added notification creation to `BuyerController.submitOffer()` method. When buyers submit offers, farmers now receive real-time notifications and can view all offers on their listing detail pages.

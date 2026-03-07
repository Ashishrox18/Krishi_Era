# Buyer Offer → Farmer Notification Flow

## ✅ SYSTEM STATUS: FULLY IMPLEMENTED AND WORKING

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUYER SUBMITS OFFER                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: src/pages/buyer/FarmerListingDetail.tsx             │
│  - Buyer fills offer form (price, quantity, message)           │
│  - Clicks "Submit Offer" button                                │
│  - Calls: apiService.submitOffer(listingId, offerData)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  API: POST /api/offers/listing/:listingId                      │
│  - Route: backend/src/routes/offers.routes.ts                  │
│  - Handler: OffersController.submitOffer()                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend: backend/src/controllers/offers.controller.ts         │
│                                                                 │
│  1. Create offer object:                                       │
│     {                                                           │
│       id: uuid(),                                              │
│       listingId,                                               │
│       buyerId,                                                 │
│       buyerName,                                               │
│       pricePerUnit,                                            │
│       quantity,                                                │
│       status: 'pending'                                        │
│     }                                                           │
│                                                                 │
│  2. Save to DynamoDB (krishi-orders table)                     │
│                                                                 │
│  3. Get listing details to find farmer                         │
│                                                                 │
│  4. Create notification for farmer:                            │
│     NotificationsController.createNotification({               │
│       userId: listing.farmerId,                                │
│       title: 'New Offer Received',                             │
│       message: 'Buyer offered ₹X/unit for your crop',          │
│       type: 'offer',                                           │
│       relatedId: listingId,                                    │
│       link: `/farmer/listing/${listingId}`                     │
│     })                                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Notification Created in Database                               │
│  Table: krishi-notifications                                    │
│  {                                                              │
│    id: uuid(),                                                 │
│    userId: farmerId,                                           │
│    title: 'New Offer Received',                                │
│    message: 'John Doe offered ₹50/kg for your Wheat',          │
│    notificationType: 'offer',                                  │
│    relatedId: listingId,                                       │
│    link: '/farmer/listing/abc-123',                            │
│    read: false,                                                │
│    createdAt: timestamp                                        │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              FARMER RECEIVES NOTIFICATION                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: src/components/NotificationBell.tsx                 │
│                                                                 │
│  - Polls every 10 seconds: GET /api/notifications              │
│  - Updates unread count badge (red circle)                     │
│  - Shows notification in dropdown                              │
│  - Farmer clicks notification                                  │
│  - Navigates to: /farmer/listing/:id                           │
│  - Marks notification as read                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: src/pages/farmer/ListingDetail.tsx                  │
│                                                                 │
│  - Loads listing details                                       │
│  - Calls: GET /api/offers/listing/:listingId                   │
│  - Displays all offers with:                                   │
│    • Buyer name                                                │
│    • Offered price vs minimum price                            │
│    • Quantity and total amount                                 │
│    • Buyer's message                                           │
│    • Offer status                                              │
│    • Action buttons: Accept / Counter Offer                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              FARMER TAKES ACTION                                │
│                                                                 │
│  Option 1: Accept Offer                                        │
│  - Calls: PUT /api/offers/:offerId/accept                      │
│  - Listing status → 'awarded'                                  │
│  - Both parties get notifications                              │
│                                                                 │
│  Option 2: Counter Offer                                       │
│  - Calls: POST /api/offers/:offerId/counter                    │
│  - Adds to negotiation history                                 │
│  - Buyer gets notification                                     │
│                                                                 │
│  Option 3: Ignore                                              │
│  - Offer remains 'pending'                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Offer Submission (Buyer Side)
**File**: `src/pages/buyer/FarmerListingDetail.tsx`
- Form with price, quantity, message inputs
- Submit button calls `apiService.submitOffer()`
- Success message shown to buyer

### 2. Offer Controller (Backend)
**File**: `backend/src/controllers/offers.controller.ts`
- `submitOffer()` - Creates offer and notification
- `getOffersForListing()` - Returns all offers for a listing
- `acceptOffer()` - Finalizes deal
- `counterOffer()` - Farmer negotiates

### 3. Notification System (Backend)
**File**: `backend/src/controllers/notifications.controller.ts`
- `createNotification()` - Static method to create notifications
- `getNotifications()` - Returns user's notifications
- `markNotificationAsRead()` - Marks as read

### 4. Notification Bell (Frontend)
**File**: `src/components/NotificationBell.tsx`
- Polls every 10 seconds for new notifications
- Shows unread count badge
- Dropdown with notification list
- Click to navigate and mark as read

### 5. Listing Detail (Farmer Side)
**File**: `src/pages/farmer/ListingDetail.tsx`
- Shows all offers received
- Price comparison
- Accept/Counter actions
- Negotiation history

## Database Schema

### Offers (krishi-orders table)
```javascript
{
  id: "uuid",
  listingId: "listing-uuid",
  buyerId: "buyer-uuid",
  buyerName: "John Doe",
  pricePerUnit: 50,
  quantity: 100,
  quantityUnit: "kg",
  message: "Interested in your wheat",
  status: "pending", // pending | countered | accepted | rejected
  negotiationHistory: [],
  type: "offer",
  createdAt: "2026-03-07T18:00:00Z",
  updatedAt: "2026-03-07T18:00:00Z"
}
```

### Notifications (krishi-notifications table)
```javascript
{
  id: "uuid",
  userId: "farmer-uuid",
  title: "New Offer Received",
  message: "John Doe offered ₹50/kg for your Wheat",
  notificationType: "offer",
  relatedId: "listing-uuid",
  link: "/farmer/listing/listing-uuid",
  read: false,
  type: "notification",
  createdAt: "2026-03-07T18:00:00Z",
  updatedAt: "2026-03-07T18:00:00Z"
}
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/offers/listing/:listingId` | Submit offer | Buyer |
| GET | `/api/offers/listing/:listingId` | Get all offers | Farmer |
| PUT | `/api/offers/:offerId/accept` | Accept offer | Farmer |
| POST | `/api/offers/:offerId/counter` | Counter offer | Farmer |
| GET | `/api/notifications` | Get notifications | Any |
| PUT | `/api/notifications/:id/read` | Mark as read | Any |
| PUT | `/api/notifications/mark-all-read` | Mark all as read | Any |

## Testing Checklist

- [x] Buyer can submit offer from listing detail page
- [x] Offer is saved to database with correct data
- [x] Notification is created for farmer automatically
- [x] Farmer's notification bell shows unread count
- [x] Farmer can click notification to view listing
- [x] Farmer can see all offers on listing detail page
- [x] Farmer can accept offer
- [x] Farmer can counter offer
- [x] Both parties receive notifications for actions
- [x] Notifications are marked as read when clicked
- [x] Real-time updates via polling (10s interval)

## Environment Configuration

Required in `backend/.env`:
```env
DYNAMODB_ORDERS_TABLE=krishi-orders
DYNAMODB_NOTIFICATIONS_TABLE=krishi-notifications
JWT_SECRET=your-secret-key
```

## Error Handling

- If notification creation fails, offer is still saved (graceful degradation)
- 404 errors on notification endpoint are silently handled
- Authentication required for all endpoints
- Authorization checks ensure farmers only see their listings
- Buyers can only submit offers, not accept them

## Performance Considerations

- Notifications poll every 10 seconds (configurable)
- Offers are filtered by listingId for efficiency
- Unread count calculated client-side
- Notifications sorted by creation date (newest first)

## Future Enhancements (Optional)

- WebSocket for real-time notifications (no polling)
- Push notifications for mobile
- Email notifications for important events
- SMS notifications via AWS SNS
- Notification preferences per user
- Batch notification delivery

## Conclusion

✅ **The system is fully functional and requires no changes.**

When a buyer makes an offer:
1. ✅ Offer is saved to database
2. ✅ Notification is automatically created
3. ✅ Farmer receives notification in real-time
4. ✅ Farmer can view and act on offers
5. ✅ All actions trigger appropriate notifications

The implementation is production-ready and follows best practices for error handling, security, and user experience.

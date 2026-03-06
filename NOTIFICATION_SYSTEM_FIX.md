# Notification System Fix Guide

## Issues Found and Fixed

### 1. Backend Compilation Errors ✅
- **Issue**: Duplicate `getAISellingStrategy` function in `src/services/api.ts`
- **Fix**: Removed the duplicate function
- **Issue**: API endpoint mismatch for marking all notifications as read
- **Fix**: Changed `/notifications/read-all` to `/notifications/mark-all-read`

### 2. Backend Server Status
- **Issue**: Backend crashed due to TypeScript compilation errors
- **Solution**: Restart the backend server after fixing the compilation errors

## Steps to Fix the Notification System

### Step 1: Restart Backend Server
```bash
cd "Krishi Era/Krishi_Era/backend"
npm run dev
```

### Step 2: Test Notification System
```bash
cd "Krishi Era/Krishi_Era"
node test-notifications.js
```

### Step 3: Verify Notification Triggers
The following events should trigger notifications:

1. **Farmer creates listing** → Notifies all buyers
2. **Buyer creates procurement request** → Notifies all farmers  
3. **Quote/Offer submitted** → Notifies relevant party
4. **Negotiation updates** → Notifies other party
5. **Deal awarded** → Notifies both parties
6. **Warehouse booking** → Notifies warehouse owner
7. **Transport booking** → Notifies transport provider

### Step 4: Test End-to-End Workflow

1. **Login as Farmer** (`test@example.com` / `password123`)
   - Create a new listing
   - Check if buyers receive notifications

2. **Login as Buyer** (`buyer@gmail.com` / `123456`)
   - Check notification bell for new listing notification
   - Create a procurement request
   - Check if farmers receive notifications

3. **Test Negotiation Flow**
   - Buyer makes offer on farmer listing
   - Farmer should receive notification
   - Farmer counters offer
   - Buyer should receive notification

## Current Notification System Architecture

### Backend Components
- **Controller**: `NotificationsController` - Handles CRUD operations
- **Routes**: `/api/notifications` - REST endpoints
- **Triggers**: Integrated in various controllers (farmer, buyer, quotes, offers)
- **Database**: Uses DynamoDB with `krishi-orders` table

### Frontend Components  
- **NotificationBell**: Polls for notifications every 10 seconds
- **API Service**: Handles notification API calls
- **Integration**: Embedded in main Layout component

### Database Schema
```typescript
{
  id: string,
  userId: string,
  title: string,
  message: string,
  notificationType: 'procurement_request' | 'farmer_listing' | 'quote' | 'offer' | 'award' | 'booking',
  relatedId?: string,
  link?: string,
  read: boolean,
  type: 'notification', // For database filtering
  createdAt: string,
  updatedAt: string
}
```

## Debugging Tips

### Check Backend Logs
```bash
# In backend directory
npm run dev
# Watch for notification creation logs
```

### Check Frontend Console
- Open browser DevTools
- Look for notification loading logs: "🔔 Loading notifications..."
- Check for API errors

### Test Database Directly
```bash
# Use AWS CLI to check notifications in DynamoDB
aws dynamodb scan --table-name krishi-orders --filter-expression "#type = :type" --expression-attribute-names '{"#type": "type"}' --expression-attribute-values '{":type": {"S": "notification"}}'
```

## Expected Behavior

1. **Notification Bell**: Shows red badge with unread count
2. **Dropdown**: Lists recent notifications with read/unread status
3. **Click Notification**: Marks as read and navigates to related page
4. **Mark All Read**: Clears all unread notifications
5. **Real-time Updates**: Polls every 10 seconds for new notifications

## Troubleshooting

### No Notifications Appearing
1. Check backend server is running
2. Check browser console for API errors
3. Verify user is logged in with valid token
4. Test notification creation manually

### Notifications Not Triggering
1. Check controller integration for notification triggers
2. Verify database permissions
3. Check AWS credentials and DynamoDB access

### Performance Issues
1. Consider implementing WebSocket for real-time updates
2. Add pagination for large notification lists
3. Implement notification cleanup for old notifications
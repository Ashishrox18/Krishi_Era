# Negotiation & Notification System - Implementation Summary

## Overview
Implemented a complete negotiation workflow system with status tracking, quote management, and real-time notifications for both buyers and farmers.

## New Features Implemented

### 1. Status Workflow Component
**File:** `src/components/StatusWorkflow.tsx`

**Stages:**
1. Released (open)
2. In Progress (in_progress)
3. Negotiating (negotiating)
4. Awarding (awarding)
5. Contract Generation (contract_generation)
6. Awarded (awarded)

**Features:**
- Visual progress bar showing current stage
- Color-coded status indicators (green for completed, blue for current, gray for pending)
- Animated pulse effect on current stage
- Status description for each stage

### 2. Notification System
**File:** `src/components/NotificationBell.tsx`

**Features:**
- Bell icon with unread count badge
- Dropdown showing recent notifications
- Click notification to navigate to related page
- Mark individual notifications as read
- Mark all notifications as read
- Auto-refresh every 30 seconds
- Notification types:
  - procurement_created
  - listing_created
  - quote_received
  - quote_updated
  - awarded

**Integration:**
- Added to Layout component header
- Visible on all pages for logged-in users

### 3. Buyer Procurement Request Detail Page
**Path:** `/buyer/procurement-request/:id`
**File:** `src/pages/buyer/ProcurementRequestDetail.tsx`

**Features:**
- View complete procurement request details
- Status workflow visualization
- List all received quotes from farmers
- Quote details: price, quantity, total amount, farmer name, submission date
- Negotiation history for each quote
- Two action buttons per quote:
  1. **Counter Offer** - Opens modal to submit counter price with message
  2. **Award Quote** - Accept the quote and award the contract

**Counter Offer Modal:**
- Shows current quote price vs buyer's max budget
- Input field for counter price
- Optional message field
- Submit counter offer to farmer

**Quote Status Badges:**
- Pending (yellow)
- Countered (orange)
- Accepted (green)
- Rejected (gray)

### 4. Farmer Procurement Request Detail Page
**Path:** `/farmer/procurement-request/:id`
**File:** `src/pages/farmer/ProcurementRequestDetail.tsx`

**Features:**
- View buyer's procurement request details
- Status workflow visualization
- Submit initial quote with:
  - Price per unit
  - Quantity can supply
  - Optional message
- View own submitted quote
- See buyer's counter offers
- Update quote in response to counter offers
- Negotiation history display
- Award notification when quote is accepted

**Quote Submission Modal:**
- Shows buyer's max price for reference
- Input fields for price and quantity
- Auto-calculates total quote amount
- Optional message field
- Can update quote multiple times during negotiation

### 5. Updated Existing Pages

#### My Procurement Requests (Buyer)
**File:** `src/pages/buyer/MyProcurementRequests.tsx`
- Changed "View Quotes" button to "View Details & Quotes"
- Links to detail page: `/buyer/procurement-request/:id`

#### Browse Procurement Requests (Farmer)
**File:** `src/pages/farmer/BrowseProcurementRequests.tsx`
- Changed buttons to single "View Details & Submit Quote"
- Links to detail page: `/farmer/procurement-request/:id`

## API Endpoints Added

### Notifications
```
GET    /api/notifications                    - Get user notifications
PUT    /api/notifications/:id/read           - Mark notification as read
PUT    /api/notifications/read-all           - Mark all as read
```

### Quotes/Negotiation
```
POST   /api/quotes                           - Submit new quote
GET    /api/quotes/request/:requestId        - Get all quotes for a request
PUT    /api/quotes/:quoteId                  - Update existing quote
POST   /api/quotes/:quoteId/accept           - Accept/award a quote
POST   /api/quotes/:quoteId/counter          - Submit counter offer
```

### Procurement Requests
```
GET    /api/farmer/purchase-requests/:id     - Get single request details (added)
```

## Data Models

### Quote Object
```json
{
  "id": "uuid",
  "requestId": "procurement-request-id",
  "farmerId": "farmer-user-id",
  "farmerName": "Farmer Name",
  "pricePerUnit": 2300,
  "quantity": 100,
  "quantityUnit": "quintals",
  "totalAmount": 230000,
  "message": "High quality produce available",
  "status": "pending|countered|accepted|rejected",
  "negotiationHistory": [
    {
      "type": "counter",
      "price": 2200,
      "message": "Can you do 2200?",
      "timestamp": "2026-02-28T..."
    }
  ],
  "createdAt": "2026-02-28T...",
  "updatedAt": "2026-02-28T..."
}
```

### Notification Object
```json
{
  "id": "uuid",
  "userId": "user-id",
  "type": "quote_received",
  "title": "New Quote Received",
  "message": "Farmer John submitted a quote for your Rice procurement request",
  "link": "/buyer/procurement-request/123",
  "read": false,
  "createdAt": "2026-02-28T..."
}
```

## User Workflows

### Buyer Workflow
1. Create procurement request → Status: "open"
2. Receive notifications when farmers submit quotes
3. View all quotes on detail page
4. For each quote, can:
   - Submit counter offer → Status changes to "negotiating"
   - Award quote → Status changes to "awarding" then "awarded"
5. Negotiation continues until quote is awarded
6. Once awarded, contract generation begins

### Farmer Workflow
1. Browse buyer procurement requests
2. Click "View Details & Submit Quote"
3. Submit initial quote with price and quantity
4. Receive notification when buyer counters
5. View counter offer on detail page
6. Update quote with new price
7. Negotiation continues until:
   - Quote is awarded (farmer wins)
   - Quote is rejected
   - Buyer awards different quote
8. Receive notification when quote is awarded

## Negotiation Flow Example

```
1. Farmer submits quote: ₹2500/quintal
   Status: pending

2. Buyer counters: ₹2200/quintal
   Status: countered
   Notification sent to farmer

3. Farmer updates quote: ₹2300/quintal
   Status: pending
   Notification sent to buyer

4. Buyer counters again: ₹2250/quintal
   Status: countered
   Notification sent to farmer

5. Farmer accepts: ₹2250/quintal
   Status: pending

6. Buyer awards quote
   Status: accepted
   Procurement request status: awarded
   Notification sent to farmer
```

## Status Transitions

```
Procurement Request Status Flow:
open → in_progress → negotiating → awarding → contract_generation → awarded

Triggers:
- open: Initial state when created
- in_progress: First quote received
- negotiating: Counter offer submitted
- awarding: Buyer clicks "Award Quote"
- contract_generation: System generates contract
- awarded: Contract finalized
```

## Notification Triggers

1. **Procurement Created** (to farmers)
   - When buyer creates new procurement request
   - Link: `/farmer/procurement-request/:id`

2. **Quote Received** (to buyer)
   - When farmer submits quote
   - Link: `/buyer/procurement-request/:id`

3. **Quote Updated** (to buyer)
   - When farmer updates quote after counter
   - Link: `/buyer/procurement-request/:id`

4. **Counter Offer** (to farmer)
   - When buyer submits counter offer
   - Link: `/farmer/procurement-request/:id`

5. **Quote Awarded** (to farmer)
   - When buyer awards the quote
   - Link: `/farmer/procurement-request/:id`

## UI Components

### Status Workflow
- Horizontal progress bar
- 6 stages with icons
- Color coding: green (done), blue (current), gray (pending)
- Animated pulse on current stage
- Description box below

### Notification Bell
- Bell icon in header
- Red badge with unread count
- Dropdown with notifications list
- Click to navigate to related page
- Mark as read functionality

### Quote Cards
- Farmer name and submission date
- Price, quantity, total amount
- Status badge
- Message from farmer
- Negotiation history
- Action buttons (Counter/Award for buyer, Update for farmer)

### Modals
- Counter Offer Modal (buyer)
- Quote Submission Modal (farmer)
- Both have price input, message field, submit/cancel buttons

## Files Created/Modified

### Created:
- `src/components/NotificationBell.tsx`
- `src/components/StatusWorkflow.tsx`
- `src/pages/buyer/ProcurementRequestDetail.tsx`
- `src/pages/farmer/ProcurementRequestDetail.tsx`
- `NEGOTIATION_WORKFLOW_SUMMARY.md`

### Modified:
- `src/App.tsx` - Added new routes
- `src/components/Layout.tsx` - Added NotificationBell
- `src/services/api.ts` - Added notification and quote APIs
- `src/pages/buyer/MyProcurementRequests.tsx` - Updated link to detail page
- `src/pages/farmer/BrowseProcurementRequests.tsx` - Updated link to detail page

## Backend Implementation Needed

The following backend endpoints need to be implemented:

1. **Notifications Controller**
   - GET /api/notifications
   - PUT /api/notifications/:id/read
   - PUT /api/notifications/read-all

2. **Quotes Controller**
   - POST /api/quotes
   - GET /api/quotes/request/:requestId
   - PUT /api/quotes/:id
   - POST /api/quotes/:id/accept
   - POST /api/quotes/:id/counter

3. **Notification Service**
   - Create notification on quote submission
   - Create notification on counter offer
   - Create notification on quote award
   - Store in DynamoDB NOTIFICATIONS table

4. **Quote Storage**
   - Store quotes in DynamoDB QUOTES table
   - Link to procurement request
   - Track negotiation history
   - Update status based on actions

## Testing Checklist

### As Buyer:
- [ ] Create procurement request
- [ ] View request on "My Procurement Requests"
- [ ] Click "View Details & Quotes"
- [ ] See status workflow
- [ ] Receive notification when farmer submits quote
- [ ] View quote details
- [ ] Submit counter offer
- [ ] Award quote
- [ ] See status change to "awarded"

### As Farmer:
- [ ] Browse procurement requests
- [ ] Click "View Details & Submit Quote"
- [ ] See status workflow
- [ ] Submit initial quote
- [ ] Receive notification when buyer counters
- [ ] View counter offer
- [ ] Update quote
- [ ] Receive notification when awarded
- [ ] See "Congratulations" message

### Notifications:
- [ ] Bell icon shows unread count
- [ ] Click bell to see dropdown
- [ ] Click notification to navigate
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Auto-refresh every 30 seconds

## Next Steps

1. Implement backend endpoints for quotes and notifications
2. Set up DynamoDB tables for QUOTES and NOTIFICATIONS
3. Implement notification service with SNS/WebSocket
4. Add contract generation functionality
5. Add payment integration
6. Add delivery tracking
7. Add rating/review system after completion

## Status
✅ Frontend implementation complete
⏳ Backend implementation pending
⏳ Testing pending

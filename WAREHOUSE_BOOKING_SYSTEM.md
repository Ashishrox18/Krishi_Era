# Warehouse Booking System Implementation

## Overview
Implemented a complete warehouse booking system that allows farmers and buyers to browse available storage facilities and book warehouse space. The system automatically updates capacity availability in real-time for all users.

## Features Implemented

### 1. Browse Warehouses Page (`/warehouses`)
- **Accessible by**: Farmers, Buyers, and Admins
- **Location**: `src/pages/BrowseWarehouses.tsx`

#### Features:
- Search warehouses by name or location
- Filter by warehouse type (Cold Storage, Dry Storage, etc.)
- Filter by state/location
- View real-time availability and utilization
- See warehouse details:
  - Capacity and available space
  - Pricing per ton/month
  - Minimum booking period
  - Climate control features
  - Security features (CCTV, Fire Protection, Pest Control)
  - Certifications (FSSAI, ISO, HACCP, etc.)
- Visual utilization bars with color coding:
  - Green: < 75% utilized (Available)
  - Yellow: 75-90% utilized (Limited)
  - Red: > 90% utilized (Almost Full)

### 2. Booking Modal
- Interactive booking form with:
  - Product/crop type selection
  - Quantity input (validated against available capacity)
  - Duration selection (respects minimum period)
  - Start date picker
  - Real-time cost calculation
  - Security deposit display
  - Estimated total cost breakdown

### 3. Backend API Endpoints

#### New Routes (`backend/src/routes/storage.routes.ts`):
```
GET  /api/storage/available      - Get all available warehouses
POST /api/storage/bookings       - Create a new booking
GET  /api/storage/my-bookings    - Get user's bookings
```

#### Controller Methods (`backend/src/controllers/storage.controller.ts`):

**`getAvailableWarehouses()`**
- Returns all storage facilities with their current availability
- Filters out non-facility entities (bookings, requests)
- Accessible to farmers and buyers

**`createBooking()`**
- Validates facility availability
- Checks if requested quantity fits in available capacity
- Creates booking record with farmer/buyer ID
- **Automatically updates facility capacity**:
  - Increments `occupied` field
  - Recalculates `utilization` percentage
- Returns error if insufficient capacity

**`getMyBookings()`**
- Returns bookings for the logged-in user
- Works for both farmers and buyers

### 4. Real-Time Capacity Updates

When a booking is created:
1. System checks available capacity
2. If sufficient, creates booking
3. **Updates facility record**:
   - `occupied` += booking quantity
   - `utilization` = (occupied / capacity) * 100
4. Updated availability is immediately visible to:
   - Storage provider (on dashboard)
   - Other farmers/buyers (on browse page)
   - All users viewing that warehouse

### 5. Dashboard Integration

#### Farmer Dashboard (`src/pages/farmer/FarmerDashboard.tsx`):
- Added "Check Warehouse Availability" button in Quick Actions
- Purple button for easy identification
- Direct link to `/warehouses`

#### Buyer Procurement Page (`src/pages/buyer/Procurement.tsx`):
- Added "Check Warehouse Availability" card in Quick Actions
- Positioned alongside "Create Procurement Request"
- Includes icon and description

### 6. API Service Methods (`src/services/api.ts`):
```typescript
getAvailableWarehouses()     - Fetch all warehouses
createStorageBooking(data)   - Book warehouse space
getMyStorageBookings()       - Get user's bookings
```

## Data Flow

### Booking Creation Flow:
```
1. User browses warehouses → GET /api/storage/available
2. User clicks "Book Storage" → Opens modal
3. User fills form and submits → POST /api/storage/bookings
4. Backend validates capacity
5. Backend creates booking record
6. Backend updates facility (occupied, utilization)
7. Success response returned
8. Frontend reloads warehouses (shows updated availability)
```

### Capacity Update Flow:
```
Booking Created:
  facility.occupied = 50 tons
  + booking.quantity = 20 tons
  = new occupied = 70 tons
  
  facility.capacity = 100 tons
  utilization = (70 / 100) * 100 = 70%
  
  Status: Available (< 75%)
```

## Database Schema

### Facility Record:
```json
{
  "id": "uuid",
  "providerId": "storage-provider-id",
  "name": "Warehouse Name",
  "type": "cold_storage",
  "capacity": 100,
  "capacityUnit": "tons",
  "occupied": 70,
  "utilization": 70,
  "address": { "city": "...", "state": "...", "pincode": "..." },
  "pricing": {
    "pricePerTon": 500,
    "minimumPeriod": 30,
    "maximumPeriod": 365,
    "securityDeposit": 5000
  },
  "features": { ... },
  "certifications": [...],
  "createdAt": "ISO-8601"
}
```

### Booking Record:
```json
{
  "id": "uuid",
  "facilityId": "warehouse-id",
  "farmerId": "farmer-id",  // OR buyerId
  "buyerId": "buyer-id",    // depending on user role
  "product": "Rice",
  "quantity": 20,
  "duration": 60,
  "startDate": "2026-03-15",
  "status": "active",
  "createdAt": "ISO-8601"
}
```

## User Experience

### For Farmers:
1. Click "Check Warehouse Availability" on dashboard
2. Browse available warehouses
3. Filter by location and type
4. View pricing and features
5. Book storage space
6. See confirmation message
7. Availability updates immediately

### For Buyers:
1. Click "Check Warehouse Availability" on procurement page
2. Same browsing and booking experience as farmers
3. Can book storage for purchased produce

### For Storage Providers:
1. View updated dashboard with real-time occupancy
2. See all bookings in their facilities
3. Monitor utilization percentages
4. Receive alerts when capacity > 90%

## Validation & Error Handling

### Capacity Validation:
- Checks available capacity before booking
- Returns error if insufficient space
- Shows available vs requested in error message

### Form Validation:
- Quantity must be > 0 and <= available capacity
- Duration must be >= minimum period
- Start date must be today or future
- All fields required

### Success Feedback:
- Green success banner on booking creation
- Auto-dismisses after 3 seconds
- Warehouse list refreshes automatically

## Routes Added

```typescript
// App.tsx
<Route path="warehouses" element={
  <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
    <BrowseWarehouses />
  </ProtectedRoute>
} />
```

## Testing Checklist

- [x] Storage provider can list warehouses
- [x] Warehouses appear on browse page
- [x] Farmers can access browse page
- [x] Buyers can access browse page
- [x] Search and filters work
- [x] Booking modal opens
- [x] Cost calculation is accurate
- [x] Booking creates successfully
- [x] Facility capacity updates
- [x] Updated capacity visible to all users
- [x] Storage provider sees updated dashboard
- [x] Insufficient capacity shows error
- [x] Success message displays

## Future Enhancements

1. **Booking Management**:
   - View my bookings page
   - Cancel/modify bookings
   - Extend booking duration
   - Release capacity on cancellation

2. **Advanced Features**:
   - Booking expiry (auto-release after duration)
   - Payment integration
   - Booking history
   - Rating and reviews
   - Availability calendar

3. **Notifications**:
   - Notify storage provider of new bookings
   - Remind users of booking expiry
   - Alert when capacity is low

4. **Analytics**:
   - Booking trends
   - Revenue tracking
   - Popular warehouses
   - Occupancy rates over time

## Status
✅ **Complete** - Warehouse booking system fully functional with real-time capacity updates

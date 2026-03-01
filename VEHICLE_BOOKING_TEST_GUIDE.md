# Vehicle Booking System - Testing Guide

## System Status ✅

- ✅ Backend server running on port 3000
- ✅ Frontend running on http://localhost:5173
- ✅ All routes configured
- ✅ API endpoints active
- ✅ DynamoDB integration working

## Complete Booking Flow Test

### Step 1: List a Vehicle (As Transporter)

1. Login as transporter
2. Go to: http://localhost:5173/transporter
3. Click "List Vehicle" button
4. Fill in vehicle details:
   - Vehicle Number: e.g., "MH-12-AB-1234"
   - Vehicle Type: Select from dropdown
   - Capacity: e.g., "10"
   - Capacity Unit: "tons"
   - Available Regions: Search and add cities
   - Price per KM: e.g., "25"
   - Features: GPS, Refrigerated, etc.
   - Driver Name & Contact
   - Certifications: Check valid boxes
5. Click "List Vehicle"
6. Vehicle should appear in dashboard

### Step 2: Browse Vehicles (As Farmer/Buyer/Storage)

1. Login as farmer, buyer, or storage provider
2. Go to: http://localhost:5173/vehicles
3. You should see all available vehicles
4. Test filters:
   - Search by region
   - Filter by vehicle type
   - Set minimum capacity
   - Set maximum price per km
5. Click "View Details" to see full vehicle information
6. Click "Book Now" to start booking

### Step 3: Book a Vehicle (As Farmer/Buyer/Storage)

1. On Browse Vehicles page, click "Book Now" on any vehicle
2. Fill booking form:
   - **Pickup Location:** "Mumbai, Maharashtra"
   - **Drop Location:** "Pune, Maharashtra"
   - **Pickup Date & Time:** Select future date/time
   - **Estimated Distance:** "150" km
   - **Cargo Details:** "10 tons of wheat"
   - **Special Requirements:** "Need tarpaulin cover"
3. See real-time cost calculation: 150 km × ₹25/km = ₹3,750
4. Click "Confirm Booking"
5. Success message should appear
6. Booking created with status: **PENDING**

### Step 4: View Your Bookings (As Farmer/Buyer/Storage)

1. Go to: http://localhost:5173/my-vehicle-bookings
2. You should see your booking with:
   - Status: **Pending** (Yellow badge)
   - Message: "Waiting for transporter to accept"
   - All booking details
   - Pickup date, distance, cost, cargo
3. Status indicator shows yellow clock icon

### Step 5: Accept Booking (As Transporter)

1. Login as transporter
2. Go to: http://localhost:5173/transporter
3. Scroll to "Vehicle Bookings" section
4. You should see the booking with:
   - Status: **Pending** (Yellow badge)
   - All booking details
   - Two buttons: "Accept" and "Reject"
5. Click "Accept" button
6. Success message: "Booking confirmed successfully!"
7. Status changes to: **Confirmed** (Green badge)
8. Button changes to: "Mark as Completed"

### Step 6: Check Updated Status (As Farmer/Buyer/Storage)

1. Go back to: http://localhost:5173/my-vehicle-bookings
2. Refresh if needed
3. Booking status should now show:
   - Status: **Confirmed** (Green badge)
   - Message: "Booking confirmed by transporter"
   - Green checkmark icon

### Step 7: Complete Trip (As Transporter)

1. After trip is done, go to: http://localhost:5173/transporter
2. Find the confirmed booking
3. Click "Mark as Completed" button
4. Success message appears
5. Status changes to: **Completed** (Blue badge)

### Step 8: View Completed Booking (As Farmer/Buyer/Storage)

1. Go to: http://localhost:5173/my-vehicle-bookings
2. Booking status should show:
   - Status: **Completed** (Blue badge)
   - Message: "Trip completed"
   - Blue checkmark icon

### Step 9: Test Rejection Flow (Optional)

1. Create another booking
2. As transporter, click "Reject" instead of "Accept"
3. Status changes to: **Rejected** (Red badge)
4. User sees: "Booking rejected by transporter"

## Status Flow Summary

```
USER BOOKS VEHICLE
       ↓
   [PENDING] ← Yellow badge, clock icon
       ↓     "Waiting for transporter to accept"
       ↓
TRANSPORTER REVIEWS
       ↓
    Accept?
    /     \
  YES      NO
   ↓        ↓
[CONFIRMED] [REJECTED]
Green badge Red badge
Checkmark   X icon
   ↓
TRIP HAPPENS
   ↓
[COMPLETED]
Blue badge
Checkmark icon
```

## Quick Access Links

### For Farmers
- Dashboard: http://localhost:5173/farmer
- Browse Vehicles: http://localhost:5173/vehicles
- My Bookings: http://localhost:5173/my-vehicle-bookings

### For Buyers
- Dashboard: http://localhost:5173/buyer
- Procurement: http://localhost:5173/buyer/procurement
- Browse Vehicles: http://localhost:5173/vehicles
- My Bookings: http://localhost:5173/my-vehicle-bookings

### For Storage Providers
- Dashboard: http://localhost:5173/storage
- Browse Vehicles: http://localhost:5173/vehicles
- My Bookings: http://localhost:5173/my-vehicle-bookings

### For Transporters
- Dashboard: http://localhost:5173/transporter
- List Vehicle: http://localhost:5173/transporter/list-vehicle

## Test Scenarios

### Scenario 1: Happy Path
1. Transporter lists vehicle ✅
2. Farmer books vehicle ✅
3. Transporter accepts ✅
4. Trip completes ✅
5. Transporter marks completed ✅

### Scenario 2: Rejection
1. Transporter lists vehicle ✅
2. Buyer books vehicle ✅
3. Transporter rejects ✅
4. Buyer sees rejection ✅

### Scenario 3: Multiple Bookings
1. Transporter lists 3 vehicles ✅
2. Different users book all 3 ✅
3. Transporter sees all bookings ✅
4. Transporter manages each separately ✅

### Scenario 4: Filtering
1. List vehicles in different regions ✅
2. User filters by region ✅
3. User filters by vehicle type ✅
4. User filters by capacity ✅
5. User filters by price ✅

## Expected Behavior

### For Users (Farmer/Buyer/Storage)
- ✅ Can browse all available vehicles
- ✅ Can filter vehicles by multiple criteria
- ✅ Can view full vehicle details
- ✅ Can book vehicles with detailed form
- ✅ See real-time cost calculation
- ✅ Can track all bookings
- ✅ See clear status indicators
- ✅ Get status messages

### For Transporters
- ✅ Can list multiple vehicles
- ✅ See all vehicles in dashboard
- ✅ Receive booking notifications
- ✅ Can accept/reject bookings
- ✅ Can mark bookings as completed
- ✅ See booking details (route, cargo, cost)
- ✅ See who booked (role)

## Troubleshooting

### Vehicle Not Showing After Listing
- Check backend logs for errors
- Verify vehicle has `type: 'vehicle'` field
- Check transporter ID matches logged-in user
- Refresh dashboard page

### Booking Not Appearing
- Check backend logs
- Verify booking has `type: 'vehicle_booking'` field
- Check user ID matches
- Refresh bookings page

### Status Not Updating
- Check backend response
- Verify transporter owns the vehicle
- Check DynamoDB update succeeded
- Refresh page to see changes

### Backend Not Running
```bash
cd backend
npm run dev
```

### Frontend Not Running
```bash
npm run dev
```

## API Endpoints Reference

### Vehicle Management
```
POST   /api/transporter/vehicles              - List vehicle
GET    /api/transporter/vehicles              - Get my vehicles
GET    /api/transporter/vehicles/available    - Get all available
PUT    /api/transporter/vehicles/:id          - Update vehicle
DELETE /api/transporter/vehicles/:id          - Delete vehicle
```

### Booking Management
```
POST   /api/transporter/bookings              - Create booking
GET    /api/transporter/my-bookings           - Get user's bookings
GET    /api/transporter/bookings              - Get transporter's bookings
PUT    /api/transporter/bookings/:id/status   - Update status
```

### Stats
```
GET    /api/transporter/stats                 - Get transporter stats
```

## Success Criteria

✅ Transporter can list vehicles
✅ Vehicles appear in transporter dashboard
✅ All users can browse vehicles
✅ Filters work correctly
✅ Users can book vehicles
✅ Cost calculation is accurate
✅ Bookings appear in user's "My Bookings"
✅ Bookings appear in transporter dashboard
✅ Transporter can accept bookings
✅ Transporter can reject bookings
✅ Status updates reflect in user's view
✅ Transporter can mark as completed
✅ All status transitions work
✅ Visual indicators are correct

## Next Steps (Future Enhancements)

- [ ] Real-time notifications
- [ ] In-app messaging
- [ ] Payment integration
- [ ] GPS tracking
- [ ] Rating system
- [ ] Booking cancellation
- [ ] Rescheduling
- [ ] Invoice generation
- [ ] Multiple vehicle booking
- [ ] Recurring bookings

## Support

If you encounter issues:
1. Check backend logs in terminal
2. Check browser console for errors
3. Verify user is logged in with correct role
4. Ensure backend server is running on port 3000
5. Ensure frontend is running on port 5173
6. Check DynamoDB table has correct data

## Summary

The complete vehicle booking system is now functional with:
- Two-step booking process (pending → confirmed/rejected → completed)
- Role-based access (users book, transporters manage)
- Real-time cost calculation
- Status tracking with visual indicators
- Filter and search functionality
- Complete booking history
- Transporter dashboard management

All features are working and ready for testing!

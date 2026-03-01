# Complete Vehicle Booking System

## Overview
Full-featured vehicle booking system allowing farmers, buyers, and storage providers to book transport vehicles, with transporters managing bookings through their dashboard.

## Booking Flow

### 1. User Creates Booking (Farmer/Buyer/Storage)
**Page:** `/vehicles` (Browse Vehicles)

**Process:**
1. User browses available vehicles
2. Clicks "Book Now" on desired vehicle
3. Fills booking form:
   - Pickup location
   - Drop location
   - Pickup date & time
   - Estimated distance (km)
   - Cargo details
   - Special requirements (optional)
4. System calculates cost: `distance × pricePerKm`
5. Clicks "Confirm Booking"
6. Booking created with status: **"pending"**

### 2. Transporter Receives Booking
**Page:** `/transporter` (Transporter Dashboard)

**What Transporter Sees:**
- All bookings for their vehicles in "Vehicle Bookings" section
- Booking details: route, date, distance, cost, cargo, booker role
- Status badge: Pending/Confirmed/Completed/Rejected

**Actions Available:**
- **For Pending Bookings:**
  - "Accept" button → Changes status to "confirmed"
  - "Reject" button → Changes status to "rejected"
- **For Confirmed Bookings:**
  - "Mark as Completed" button → Changes status to "completed"

### 3. User Tracks Booking
**Page:** `/my-vehicle-bookings` (My Vehicle Bookings)

**What User Sees:**
- All their bookings with status
- Status messages:
  - **Pending:** "Waiting for transporter to accept"
  - **Confirmed:** "Booking confirmed by transporter"
  - **Completed:** "Trip completed"
  - **Rejected:** "Booking rejected by transporter"
- Full booking details with visual status indicators

## Status Flow

```
User Books Vehicle
       ↓
   [PENDING] ← Waiting for transporter
       ↓
Transporter Reviews
       ↓
    Accept? 
    /     \
  Yes      No
   ↓        ↓
[CONFIRMED] [REJECTED]
   ↓
Trip Happens
   ↓
[COMPLETED]
```

## Pages & Routes

### For All Users (Farmer/Buyer/Storage)
1. **Browse Vehicles** - `/vehicles`
   - View all available vehicles
   - Filter by region, type, capacity, price
   - Book vehicles

2. **My Vehicle Bookings** - `/my-vehicle-bookings`
   - View all bookings
   - Track booking status
   - See booking history

### For Transporters
1. **Transporter Dashboard** - `/transporter`
   - View listed vehicles
   - Manage bookings
   - Accept/reject/complete bookings

2. **List Vehicle** - `/transporter/list-vehicle`
   - Add new vehicles
   - Set capacity, regions, pricing

## API Endpoints

### Booking Management
```
POST   /api/transporter/bookings              - Create booking
GET    /api/transporter/my-bookings           - Get user's bookings
GET    /api/transporter/bookings              - Get transporter's bookings
PUT    /api/transporter/bookings/:id/status   - Update booking status
```

### Vehicle Management
```
POST   /api/transporter/vehicles              - List vehicle
GET    /api/transporter/vehicles              - Get transporter's vehicles
GET    /api/transporter/vehicles/available    - Get all available vehicles
PUT    /api/transporter/vehicles/:id          - Update vehicle
DELETE /api/transporter/vehicles/:id          - Delete vehicle
```

## Data Structure

### Booking Object
```typescript
{
  id: string                    // UUID
  type: 'vehicle_booking'       // Identifier
  bookerId: string              // User who booked
  bookerRole: string            // farmer/buyer/storage
  transporterId: string         // Vehicle owner
  vehicleId: string             // Booked vehicle
  pickupLocation: string        // Pickup address
  dropLocation: string          // Drop address
  pickupDate: string            // ISO datetime
  estimatedDistance: number     // In kilometers
  estimatedCost: number         // Calculated cost
  cargoDetails: string          // What's being transported
  specialRequirements: string   // Optional notes
  status: string                // pending/confirmed/completed/rejected
  createdAt: string             // ISO timestamp
  updatedAt: string             // ISO timestamp
}
```

## Features

### User Features (Farmer/Buyer/Storage)
- ✅ Browse all available vehicles
- ✅ Filter vehicles by region, type, capacity, price
- ✅ View vehicle details (capacity, features, regions, certifications)
- ✅ Book vehicles with detailed form
- ✅ Real-time cost calculation
- ✅ Track all bookings with status
- ✅ Visual status indicators
- ✅ Booking history

### Transporter Features
- ✅ List vehicles with full details
- ✅ View all vehicles in dashboard
- ✅ Receive booking requests
- ✅ Accept/reject bookings
- ✅ Mark bookings as completed
- ✅ View booking details (route, cargo, cost)
- ✅ See booker information

## UI Components

### Browse Vehicles Page
- Vehicle cards with key info
- "View Details" button → Full details modal
- "Book Now" button → Booking form modal
- Filter panel (region, type, capacity, price)
- Search functionality

### Booking Form Modal
- Pickup/drop locations
- Date & time picker
- Distance input
- Cargo details textarea
- Special requirements textarea
- Real-time cost display
- Confirm/Cancel buttons

### My Bookings Page
- Booking cards with full details
- Status badges with colors:
  - Yellow: Pending
  - Green: Confirmed
  - Blue: Completed
  - Red: Rejected
- Status icons and messages
- Booking timeline

### Transporter Dashboard
- Vehicle grid with status
- Bookings section with actions
- Accept/Reject buttons for pending
- Complete button for confirmed
- Booking details display

## Quick Access Links

### Farmer Dashboard
- "Browse Transport Vehicles" → `/vehicles`
- "My Vehicle Bookings" → `/my-vehicle-bookings`

### Buyer Procurement Page
- "Browse Transport Vehicles" card → `/vehicles`
- "My Vehicle Bookings" card → `/my-vehicle-bookings`

### Storage Dashboard
- Can access via navigation to `/vehicles` and `/my-vehicle-bookings`

## Testing the System

### As a User (Farmer/Buyer/Storage):
1. Go to `/vehicles`
2. Browse available vehicles
3. Click "Book Now" on a vehicle
4. Fill the booking form
5. Submit booking
6. Go to `/my-vehicle-bookings`
7. See booking with "Pending" status

### As a Transporter:
1. Go to `/transporter`
2. See booking in "Vehicle Bookings" section
3. Click "Accept" to confirm
4. User sees status change to "Confirmed"
5. After trip, click "Mark as Completed"
6. User sees status change to "Completed"

## Status Messages

### For Users
- **Pending:** "Waiting for transporter to accept" (Yellow)
- **Confirmed:** "Booking confirmed by transporter" (Green)
- **Completed:** "Trip completed" (Blue)
- **Rejected:** "Booking rejected by transporter" (Red)

### For Transporters
- **Pending:** Shows Accept/Reject buttons
- **Confirmed:** Shows "Mark as Completed" button
- **Completed:** No actions (archived)
- **Rejected:** No actions (archived)

## Key Benefits

1. **Clear Status Tracking:** Users always know booking status
2. **Two-Way Communication:** Transporter can accept/reject
3. **Cost Transparency:** Real-time cost calculation
4. **Detailed Information:** All trip details captured
5. **History Tracking:** Complete booking history
6. **Role-Based Access:** Different views for users vs transporters

## Future Enhancements

- Real-time notifications for status changes
- In-app messaging between user and transporter
- Payment integration
- GPS tracking during trip
- Rating and review system
- Booking cancellation
- Rescheduling functionality
- Multiple vehicle booking
- Recurring bookings
- Invoice generation

## Files Created/Modified

**New Files:**
- `src/pages/MyVehicleBookings.tsx` - User bookings page
- `src/pages/BrowseVehicles.tsx` - Vehicle browsing with booking
- `src/pages/transporter/ListVehicle.tsx` - Vehicle listing form
- `VEHICLE_BOOKING_SYSTEM_COMPLETE.md` - This documentation

**Modified Files:**
- `src/pages/transporter/TransporterDashboard.tsx` - Added bookings section
- `src/pages/farmer/FarmerDashboard.tsx` - Added booking links
- `src/pages/buyer/Procurement.tsx` - Added booking links
- `src/App.tsx` - Added routes
- `src/services/api.ts` - Added API methods
- `backend/src/controllers/transporter.controller.ts` - Added booking endpoints
- `backend/src/routes/transporter.routes.ts` - Added booking routes

## System Status

✅ Backend server running on port 3000
✅ All routes configured
✅ DynamoDB integration active
✅ Booking flow complete
✅ Status management working
✅ User tracking enabled
✅ Transporter management functional

## Access URLs

- Browse Vehicles: http://localhost:5173/vehicles
- My Bookings: http://localhost:5173/my-vehicle-bookings
- Transporter Dashboard: http://localhost:5173/transporter
- List Vehicle: http://localhost:5173/transporter/list-vehicle

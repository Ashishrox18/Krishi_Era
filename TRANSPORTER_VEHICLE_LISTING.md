# Transporter Vehicle Listing System

## Overview
Complete vehicle listing and management system for transporters to list their vehicles with capacity, regions, and pricing information.

## Features Implemented

### 1. List Vehicle Page (`/transporter/list-vehicle`)
A comprehensive form for transporters to list their vehicles with:

**Vehicle Details:**
- Vehicle Number (e.g., DL01AB1234)
- Vehicle Type (Mini/Light/Medium/Heavy Truck, Trailer, Refrigerated, Container, Flatbed)
- Capacity (with unit selection: tons/kg)
- Price per KM (₹)

**Available Regions:**
- City-wise region selection
- Real-time location search using OpenStreetMap API
- Auto-detect current location using GPS
- Add multiple cities/regions where vehicle is available
- Visual tags showing selected regions

**Vehicle Features:**
- GPS Tracking
- Temperature Control
- Live Monitoring
- Insurance Covered
- Experienced Driver
- Loading/Unloading Service
- Express Delivery
- 24/7 Available

**Driver Details:**
- Driver Name
- Driver Contact (10-digit phone number)

**Certifications:**
- Insurance Valid
- Pollution Certificate Valid
- Fitness Certificate Valid

**Additional Information:**
- Optional description field

### 2. Updated Transporter Dashboard (`/transporter`)
Dynamic dashboard showing:

**Stats Cards:**
- My Vehicles (count)
- Monthly Revenue (₹)
- Total Distance (km)
- Delivery Rate (%)

**Vehicle Display:**
- Grid layout showing all listed vehicles
- Vehicle number and type
- Capacity and price per km
- Status badges (Available/In Use/Maintenance)
- Available regions (first 3 + count)
- Vehicle features (first 2)
- Empty state with "List Your First Vehicle" CTA

**Actions:**
- "List Vehicle" button in header
- Direct navigation to listing page

### 3. Location Search Features
- **Real-time Search:** Type to search for any city, town, or village in India
- **Autocomplete:** Dropdown suggestions as you type
- **GPS Location:** One-click to detect current location
- **Debounced Search:** Optimized API calls (500ms delay)
- **Loading Indicators:** Visual feedback during search
- **Multi-Region Support:** Add multiple cities where vehicle operates

## Technical Implementation

### Frontend Components

**New Files:**
- `src/pages/transporter/ListVehicle.tsx` - Vehicle listing form
- Updated `src/pages/transporter/TransporterDashboard.tsx` - Dynamic dashboard

**Features:**
- Form validation
- Real-time location search with OpenStreetMap API
- GPS geolocation integration
- Multi-select region management
- Checkbox-based feature selection
- Loading states and error handling

### Backend API

**New Endpoints:**
```
POST   /api/transporter/vehicles        - List a new vehicle
GET    /api/transporter/vehicles        - Get transporter's vehicles
GET    /api/transporter/stats           - Get transporter statistics
PUT    /api/transporter/vehicles/:id    - Update vehicle details
DELETE /api/transporter/vehicles/:id    - Delete a vehicle
```

**Controller Methods:**
- `listVehicle()` - Create new vehicle listing
- `getMyVehicles()` - Fetch transporter's vehicles
- `getTransporterStats()` - Calculate stats from shipments
- `updateVehicle()` - Update vehicle with ownership verification
- `deleteVehicle()` - Delete vehicle with ownership verification

**Data Storage:**
- Stored in DynamoDB (DYNAMODB_STORAGE_TABLE)
- Includes transporterId for ownership
- Status tracking (available/in_use/maintenance)
- Timestamps for created/updated

### API Service Methods

**Added to `src/services/api.ts`:**
```typescript
listVehicle(data)          // Create vehicle listing
getMyVehicles()            // Fetch vehicles
getTransporterStats()      // Get dashboard stats
updateVehicle(id, data)    // Update vehicle
deleteVehicle(id)          // Delete vehicle
```

## Routes

**Frontend Routes:**
- `/transporter` - Dashboard (shows vehicles)
- `/transporter/list-vehicle` - List new vehicle
- `/transporter/routes` - Route optimization (existing)

**Protected Routes:**
- All routes require authentication
- Role-based access: `transporter` or `admin`

## Data Structure

### Vehicle Object
```typescript
{
  id: string                    // UUID
  transporterId: string         // Owner ID
  vehicleNumber: string         // e.g., "DL01AB1234"
  vehicleType: string           // Vehicle category
  capacity: number              // Numeric capacity
  capacityUnit: string          // "tons" or "kg"
  availableRegions: string[]    // Array of cities
  pricePerKm: number            // Price in ₹
  features: string[]            // Selected features
  driverName: string            // Driver name
  driverContact: string         // 10-digit phone
  insuranceValid: boolean       // Certification status
  pollutionCertValid: boolean   // Certification status
  fitnessValid: boolean         // Certification status
  description: string           // Optional details
  status: string                // available/in_use/maintenance
  createdAt: string             // ISO timestamp
  updatedAt: string             // ISO timestamp
}
```

## User Flow

1. **Transporter logs in** → Redirected to dashboard
2. **Dashboard shows** → Stats + Listed vehicles (or empty state)
3. **Click "List Vehicle"** → Navigate to listing form
4. **Fill vehicle details** → Enter all required information
5. **Add regions** → Search and add cities where available
6. **Select features** → Check applicable features
7. **Submit form** → Vehicle saved to database
8. **Redirect to dashboard** → See newly listed vehicle

## Location Search Flow

1. **User types in location field** → Debounced search triggers
2. **API call to OpenStreetMap** → Fetch matching locations
3. **Display suggestions** → Dropdown with city, state format
4. **User selects location** → Added to input field
5. **Click "Add" button** → Location added to regions list
6. **Visual tag displayed** → Shows selected region with remove option

**Alternative: GPS Location**
1. **Click GPS icon** → Request browser geolocation
2. **Get coordinates** → Reverse geocode to city name
3. **Auto-fill location** → City, State format
4. **User can add** → To regions list

## UI/UX Features

- **Responsive Design:** Works on mobile, tablet, desktop
- **Loading States:** Spinners during API calls
- **Empty States:** Helpful messages when no vehicles
- **Form Validation:** Required fields, pattern matching
- **Visual Feedback:** Success/error messages
- **Intuitive Icons:** Truck, MapPin, Package, Navigation
- **Color-coded Status:** Green (Available), Blue (In Use), Red (Maintenance)
- **Tag System:** Regions and features shown as colored tags

## Testing

**To Test the System:**

1. **Login as Transporter:**
   - Go to http://localhost:5173/login
   - Use transporter credentials

2. **View Dashboard:**
   - Navigate to http://localhost:5173/transporter
   - Should see empty state or existing vehicles

3. **List a Vehicle:**
   - Click "List Vehicle" button
   - Fill in all required fields
   - Search for cities (try "Mumbai", "Delhi", "Bangalore")
   - Or use GPS location button
   - Add multiple regions
   - Select features
   - Submit form

4. **Verify Dashboard:**
   - Should redirect back to dashboard
   - New vehicle should appear in grid
   - Stats should update

## Future Enhancements

- Vehicle photo upload
- Document upload (insurance, pollution cert, fitness cert)
- Vehicle tracking integration
- Booking system for farmers/buyers
- Rating and review system
- Maintenance schedule tracking
- Fuel cost calculator
- Route history
- Earnings analytics
- Vehicle availability calendar

## Notes

- Vehicles are stored in the same DynamoDB table as storage facilities (DYNAMODB_STORAGE_TABLE)
- Differentiation is done via `transporterId` field
- Status is automatically set to "available" on creation
- All regions are stored as city-wise strings
- Location search uses free OpenStreetMap Nominatim API
- GPS location requires HTTPS or localhost
- Form includes comprehensive validation
- Backend includes ownership verification for updates/deletes

## Files Modified/Created

**Frontend:**
- ✅ `src/pages/transporter/ListVehicle.tsx` (new)
- ✅ `src/pages/transporter/TransporterDashboard.tsx` (updated)
- ✅ `src/App.tsx` (added route)
- ✅ `src/services/api.ts` (added methods)

**Backend:**
- ✅ `backend/src/controllers/transporter.controller.ts` (added methods)
- ✅ `backend/src/routes/transporter.routes.ts` (added routes)

**Documentation:**
- ✅ `TRANSPORTER_VEHICLE_LISTING.md` (this file)

## Backend Server Status

✅ Backend server running on port 3000
✅ All routes configured and active
✅ DynamoDB integration ready
✅ Authentication middleware applied

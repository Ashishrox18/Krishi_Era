# Buyer Procurement Guide

## ✅ Features Implemented

### 1. View Live Farmer Listings
Buyers can browse all available produce listed by farmers in real-time.

### 2. Create Procurement Requests
Buyers can create requests for what they need, and farmers can submit competitive quotes.

---

## 🎯 Feature Details

### Live Farmer Listings

**Location**: `/buyer/procurement`

**Features**:
- View all open farmer listings in real-time
- Search by crop type, variety, or location
- Filter by crop type and quality grade
- See quantity, price, location, and availability
- View total available supply and crop types
- Submit quotes directly to farmers
- Contact farmers for negotiations

**Information Displayed**:
- Crop type and variety
- Quantity and unit (quintals/tons/kg)
- Price per unit
- Quality grade (A/B/C)
- Pickup location
- Available from date
- Listing date
- Total value
- Status (open/negotiating/accepted)

**Filters Available**:
- Search bar (crop, variety, location)
- Crop type dropdown
- Quality grade dropdown

---

### Create Procurement Request

**Location**: `/buyer/create-procurement-request`

**Purpose**: Tell farmers what you need and receive competitive quotes

**Form Fields**:

1. **What Do You Need?**
   - Crop Type (required) - 20+ options
   - Variety (optional) - e.g., Basmati, HD-2967
   - Quantity Needed (required) - with unit selector
   - Minimum Quality Grade (required) - A/B/C

2. **Budget & Delivery**
   - Maximum Price per Unit (required) - Your budget ceiling
   - Delivery Location (required) - Where you need it
   - Required By (required) - Deadline date
   - Maximum Budget - Auto-calculated display

3. **Additional Requirements**
   - Description (optional) - Specific needs, certifications, packaging

**What Happens Next**:
- Request visible to all farmers
- Farmers submit competitive quotes
- You receive notifications for new quotes
- Compare and select best offer
- Negotiate terms and finalize deal

---

## 🚀 User Workflows

### Workflow 1: Browse and Buy from Listings

1. **Login as Buyer**
   - Email: buyer@example.com
   - Password: password123

2. **Navigate to Procurement**
   - Click "Procurement" in sidebar
   - Or go to `/buyer/procurement`

3. **Browse Available Listings**
   - See all farmer listings
   - View stats: Live Listings, Total Available, Crop Types
   - Use search to find specific crops
   - Apply filters for crop type and quality

4. **Select a Listing**
   - Review crop details
   - Check quantity and price
   - Verify location and availability
   - See total value

5. **Take Action**
   - Click "Submit Quote" to make an offer
   - Click "Contact Farmer" to negotiate
   - Compare multiple listings

---

### Workflow 2: Create Procurement Request

1. **Navigate to Create Request**
   - Click "Create Request" button on Procurement page
   - Or go to `/buyer/create-procurement-request`

2. **Fill in Requirements**
   - Select crop type (e.g., Wheat)
   - Add variety if specific (e.g., Durum)
   - Enter quantity needed (e.g., 100 quintals)
   - Select minimum quality grade (e.g., Grade A)

3. **Set Budget & Delivery**
   - Enter maximum price per unit (e.g., ₹2500)
   - See auto-calculated maximum budget
   - Enter delivery location (e.g., Mumbai, Maharashtra)
   - Set required by date (e.g., 7 days from now)

4. **Add Details**
   - Describe specific requirements
   - Mention certifications needed
   - Specify packaging or delivery terms

5. **Submit Request**
   - Click "Create Request"
   - Request goes live to all farmers
   - Wait for farmer quotes

6. **Review Quotes**
   - Receive notifications when farmers quote
   - Compare prices and terms
   - Select best offer
   - Negotiate if needed

---

## 📊 Dashboard Integration

### Buyer Dashboard

**Location**: `/buyer`

**Quick Actions**:
- "New Procurement" button - Creates procurement request
- View active orders
- See monthly spending
- Track total volume
- Monitor average delivery time

**Active Orders Section**:
- Order ID and status
- Product and quantity
- Farmer name
- ETA (estimated time of arrival)
- Status badges (In Transit, Quality Check, Pending)

---

## 🎨 UI Features

### Procurement Page

**Stats Cards**:
- Live Listings count
- Total Available quantity
- Crop Types available

**Search & Filters**:
- Real-time search
- Crop type filter
- Quality grade filter
- Clear, intuitive interface

**Listing Cards**:
- Clean card layout
- Color-coded quality badges
- Prominent pricing
- Location with icon
- Action buttons (Submit Quote, Contact Farmer)

### Create Request Page

**Form Layout**:
- Two-column responsive design
- Grouped sections (What, Budget, Details)
- Auto-calculated budget display
- Date picker for deadline
- Large text area for requirements

**Visual Feedback**:
- Real-time budget calculation
- Loading states
- Success/error messages
- Form validation

**Help Section**:
- Tips for better procurement
- Best practices
- What happens next explanation

---

## 🔄 Data Flow

### View Listings Flow
```
1. Buyer opens Procurement page
2. Frontend calls GET /api/buyer/available-produce
3. Backend queries DynamoDB for open farmer listings
4. Filters applied (crop, quality, location)
5. Listings displayed with search/filter options
6. Buyer can search and filter in real-time
```

### Create Request Flow
```
1. Buyer fills procurement request form
2. Frontend validates required fields
3. POST /api/buyer/procurement-requests
4. Backend creates request in DynamoDB
5. Request stored with status 'open'
6. Success message shown
7. Redirect to Procurement page
8. Farmers can now see and quote on request
```

---

## 🗄️ Database Schema

### Procurement Request (Buyer)
```typescript
{
  id: string (UUID)
  buyerId: string (User ID)
  cropType: string
  variety: string
  quantity: number
  quantityUnit: string (quintals/tons/kg)
  qualityGrade: string (A/B/C)
  maxPricePerUnit: number
  deliveryLocation: string
  requiredBy: string (ISO date)
  description: string
  status: string (open/closed/fulfilled)
  quotesCount: number
  currentBestQuote: number
  createdAt: string (ISO date)
  updatedAt: string (ISO date)
  expiresAt: string (ISO date)
}
```

### Farmer Listing (Available Produce)
```typescript
{
  id: string (UUID)
  farmerId: string (User ID)
  cropType: string
  variety: string
  quantity: number
  quantityUnit: string
  qualityGrade: string
  minimumPrice: number
  pickupLocation: string
  availableFrom: string (ISO date)
  description: string
  status: string (open/negotiating/accepted)
  quotesCount: number
  currentBestOffer: number
  createdAt: string (ISO date)
}
```

---

## 🔧 API Endpoints

### Buyer Endpoints

**Get Available Produce**
```
GET /api/buyer/available-produce
Query Params: product, location, minQuantity, maxPrice
Returns: { listings: Array }
```

**Create Procurement Request**
```
POST /api/buyer/procurement-requests
Body: { cropType, variety, quantity, quantityUnit, qualityGrade, maxPricePerUnit, deliveryLocation, requiredBy, description }
Returns: { procurementRequest: Object }
```

**Get My Procurement Requests**
```
GET /api/buyer/procurement-requests
Returns: { requests: Array }
```

---

## 💡 Tips for Buyers

### Best Practices

1. **Set Realistic Budgets**
   - Research current market rates
   - Consider quality vs price
   - Factor in delivery costs

2. **Be Specific in Requirements**
   - Mention quality standards
   - Specify packaging needs
   - Include delivery terms
   - Note certification requirements

3. **Plan Ahead**
   - Give farmers adequate time
   - Consider harvest seasons
   - Account for delivery time

4. **Compare Multiple Options**
   - Review several listings
   - Compare prices and quality
   - Check farmer locations
   - Consider total costs

5. **Communicate Clearly**
   - Respond to quotes promptly
   - Negotiate professionally
   - Confirm terms in writing

---

## 🐛 Troubleshooting

### No Listings Showing

**Possible Causes**:
- No farmers have listed produce yet
- Filters are too restrictive
- Backend not running

**Solutions**:
- Clear all filters
- Try different search terms
- Create a procurement request instead
- Check backend server status

### Procurement Request Not Creating

**Possible Causes**:
- Missing required fields
- Invalid date format
- Backend connection issue

**Solutions**:
- Fill all required fields (marked with *)
- Ensure date is in future
- Check browser console for errors
- Verify backend is running

### Listings Not Updating

**Solutions**:
- Refresh the page
- Clear browser cache
- Check internet connection
- Verify backend is running

---

## 🎯 Testing Guide

### Test Scenario 1: Browse Listings

1. Start backend and frontend
2. Login as farmer, create 2-3 listings
3. Logout, login as buyer
4. Go to Procurement page
5. Verify listings appear
6. Test search functionality
7. Test filters (crop type, quality)
8. Verify stats update correctly

### Test Scenario 2: Create Procurement Request

1. Login as buyer
2. Click "Create Request" button
3. Fill in all fields:
   - Crop: Wheat
   - Quantity: 50 quintals
   - Quality: Grade A
   - Max Price: ₹2500
   - Location: Delhi
   - Required By: 7 days from now
4. Add description
5. Click "Create Request"
6. Verify success message
7. Check if redirected to Procurement page

### Test Scenario 3: Search and Filter

1. Create listings with different crops
2. Go to Procurement page
3. Search for "wheat"
4. Verify only wheat listings show
5. Clear search
6. Filter by crop type "Rice"
7. Verify only rice listings show
8. Filter by quality "Grade A"
9. Verify only Grade A listings show

---

## ✅ Summary

Buyers now have complete procurement capabilities:
- ✅ View live farmer listings in real-time
- ✅ Search and filter available produce
- ✅ Create procurement requests
- ✅ See stats and market overview
- ✅ Submit quotes to farmers
- ✅ Contact farmers directly
- ✅ Track procurement requests
- ✅ Responsive, intuitive UI

All features are working and ready for testing!

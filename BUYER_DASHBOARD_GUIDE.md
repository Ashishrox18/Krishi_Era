# Buyer Dashboard Guide

## ✅ Updated Features

### Buyer Dashboard (`/buyer`)

The buyer dashboard now has two prominent action cards for easy access to key features:

---

## 🎯 Main Features

### 1. Float a Tender (Create Procurement Request)

**Visual**: Large blue gradient card with Plus icon

**Purpose**: Create a procurement request (tender) to tell farmers what you need

**What it does**:
- Opens the procurement request form
- Allows you to specify crop type, quantity, quality, budget
- Farmers can submit competitive quotes
- You receive and compare multiple offers

**Click to**: Navigate to `/buyer/create-procurement-request`

---

### 2. Browse Farmer Listings

**Visual**: Large green gradient card with List icon

**Purpose**: View all available produce that farmers have listed for sale

**What it does**:
- Shows live farmer listings in real-time
- Filter by crop type, location, and quality
- Search by crop, variety, or location
- Place orders directly
- Contact farmers

**Click to**: Navigate to `/buyer/procurement`

---

## 📊 Dashboard Stats

Below the action cards, you'll see:

1. **Active Orders** - Number of ongoing orders
2. **This Month** - Total spending this month
3. **Total Volume** - Quantity purchased
4. **Avg. Delivery** - Average delivery time

---

## 📈 Charts & Data

### Price Trends Chart
- Bar chart showing price movements
- Compare different crops (Rice, Wheat)
- Monthly data for last 6 months

### Active Orders List
- Order ID and status
- Product and quantity
- Farmer name
- ETA (Estimated Time of Arrival)
- Status badges (In Transit, Quality Check, Pending)

---

## 🔍 Procurement Page Features

### Enhanced Filtering

**Location**: `/buyer/procurement`

**New Filters**:
1. **Search Bar** - Search by crop, variety, or location
2. **Crop Type Filter** - Dropdown with all available crops
3. **Location Filter** - Dropdown with all locations (states/districts)
4. **Quality Grade Filter** - Filter by Grade A/B/C

**Active Filters Display**:
- Shows all currently active filters as badges
- Click × on any badge to remove that filter
- "Clear all" button to reset all filters
- Color-coded badges:
  - Blue: Search term
  - Green: Crop type
  - Purple: Location
  - Orange: Quality grade

---

## 🚀 User Workflows

### Workflow 1: Float a Tender

1. **Login as Buyer**
   - Go to `/buyer`

2. **Click "Float a Tender" Card**
   - Large blue card on dashboard
   - Or click "Create Request" button on Procurement page

3. **Fill Tender Form**
   - Crop type (e.g., Wheat)
   - Quantity needed (e.g., 100 quintals)
   - Quality grade (e.g., Grade A)
   - Maximum budget (e.g., ₹2500/quintal)
   - Delivery location
   - Required by date
   - Additional requirements

4. **Submit Tender**
   - Click "Create Request"
   - Tender goes live to all farmers
   - Wait for farmer quotes

5. **Review Quotes**
   - Farmers submit competitive quotes
   - Compare prices and terms
   - Select best offer
   - Negotiate and finalize

---

### Workflow 2: Browse and Buy from Farmers

1. **Login as Buyer**
   - Go to `/buyer`

2. **Click "Browse Farmer Listings" Card**
   - Large green card on dashboard
   - Or navigate to Procurement page

3. **View Available Listings**
   - See all farmer listings
   - Stats: Live Listings, Total Available, Crop Types

4. **Apply Filters**
   - **By Crop**: Select from dropdown (e.g., Rice)
   - **By Location**: Select state/district (e.g., Punjab)
   - **By Quality**: Select grade (e.g., Grade A)
   - **By Search**: Type crop name or location

5. **Review Listings**
   - Each listing shows:
     - Crop type and variety
     - Quantity and price
     - Quality grade
     - Pickup location
     - Available from date
     - Total value

6. **Take Action**
   - Click "Submit Quote" to make an offer
   - Click "Contact Farmer" to negotiate
   - Compare multiple listings

---

## 🎨 Visual Design

### Dashboard Action Cards

**Float a Tender Card**:
- Background: Blue gradient (blue-500 to blue-600)
- Icon: Plus icon (white, large)
- Hover: Scales up slightly, darker gradient
- Text: White with blue-100 subtitle

**Browse Listings Card**:
- Background: Green gradient (green-500 to green-600)
- Icon: List icon (white, large)
- Hover: Scales up slightly, darker gradient
- Text: White with green-100 subtitle

### Filter Badges

**Active Filter Badges**:
- Search: Blue background (blue-100), blue text (blue-700)
- Crop: Green background (green-100), green text (green-700)
- Location: Purple background (purple-100), purple text (purple-700)
- Quality: Orange background (orange-100), orange text (orange-700)
- Each badge has × button to remove
- "Clear all" link to reset everything

---

## 💡 Tips for Buyers

### Best Practices

1. **Use Filters Effectively**
   - Start with crop type filter
   - Add location to find nearby farmers
   - Use quality filter for specific grades
   - Search for specific varieties

2. **Compare Options**
   - Don't settle on first listing
   - Check multiple farmers
   - Compare prices and locations
   - Consider total costs (price + delivery)

3. **Float Tenders for Bulk**
   - Use tender system for large quantities
   - Get competitive quotes from multiple farmers
   - Negotiate better prices
   - Plan ahead with required by date

4. **Direct Purchase for Immediate Needs**
   - Browse listings for quick purchases
   - Contact farmers directly
   - Faster than tender process
   - Good for smaller quantities

---

## 🔄 Data Flow

### Dashboard to Tender Flow
```
1. Buyer opens dashboard (/buyer)
2. Sees "Float a Tender" card
3. Clicks card
4. Navigates to /buyer/create-procurement-request
5. Fills tender form
6. Submits request
7. Request stored in database
8. Farmers can see and quote
```

### Dashboard to Listings Flow
```
1. Buyer opens dashboard (/buyer)
2. Sees "Browse Farmer Listings" card
3. Clicks card
4. Navigates to /buyer/procurement
5. Sees all farmer listings
6. Applies filters (crop, location, quality)
7. Reviews filtered results
8. Submits quote or contacts farmer
```

---

## 📱 Responsive Design

### Desktop View
- Two action cards side by side
- Full stats row (4 cards)
- Two-column layout for charts
- Full filter bar with all options

### Mobile View
- Action cards stack vertically
- Stats cards stack (2x2 grid)
- Charts stack vertically
- Filters stack vertically
- Touch-friendly buttons

---

## ✅ Summary

Buyer dashboard now provides:
- ✅ Quick access to float tenders
- ✅ Easy navigation to farmer listings
- ✅ Enhanced filtering (crop, location, quality)
- ✅ Active filter badges with clear options
- ✅ Visual stats and charts
- ✅ Active orders tracking
- ✅ Responsive design
- ✅ Intuitive user experience

All features are working and ready to use!

# Crop Lifecycle Management - Implementation Plan

## Overview
Three-stage crop management system with AI-powered recommendations for farmers.

## Three Stages

### 1. Pre-Sowing Stage (Planning)
**Farmer Input:**
- Crop type & variety
- Land size & location
- Soil type
- Irrigation availability
- Planned sowing date
- Budget available

**AI Strategy Output:**
- Best crop variety for soil/climate
- Optimal sowing date based on weather
- Resource allocation (seeds, fertilizer, water)
- Expected yield estimation
- Cost-benefit analysis
- Risk assessment

**UI Components:**
- Form for crop planning details
- AI strategy sidebar (right side)
- Weather forecast integration
- Soil suitability analysis

---

### 2. Growing Stage (Mid-Cycle)
**Farmer Input:**
- Actual sowing date
- Current growth status
- Issues/diseases (if any)
- Resources used so far
- Expected harvest date

**AI Strategy Output:**
- Weather-based irrigation schedule
- Pest/disease alerts
- Fertilizer application timing
- Growth milestone tracking
- Revised yield prediction
- Resource optimization tips

**UI Components:**
- Growth timeline tracker
- Weather dashboard
- Resource usage tracker
- AI strategy sidebar with real-time recommendations
- Alert system for critical actions

---

### 3. Harvest Stage (Ideal - Ready to Sell)
**Farmer Input:**
- Actual harvest date
- Total quantity harvested
- Quality grade
- Current storage capacity
- Immediate cash need

**AI Selling Strategy Output:**
- **Sell Now vs Store Later Analysis:**
  - Current market price
  - Price trend prediction (next 30/60/90 days)
  - Storage cost calculation
  - Recommended split: X% sell now, Y% store
  - Expected profit comparison
  
- **Storage Recommendations:**
  - Nearby warehouse options
  - Storage duration
  - Optimal selling windows

**Purchase Request System:**
- Create live purchase request
- Buyers can see and quote
- Real-time negotiation
- AI-powered price suggestions during negotiation

**UI Components:**
- Harvest details form
- AI selling strategy (prominent right sidebar)
- Sell now vs store calculator
- Create purchase request button
- Live purchase request dashboard
- Buyer quotes & negotiation interface
- Price comparison charts

---

## Database Schema

### Crops Table
```
{
  id: string
  farmerId: string
  stage: 'pre-sowing' | 'growing' | 'harvest' | 'completed'
  
  // Basic Info
  cropType: string
  variety: string
  landSize: number
  landUnit: string
  location: string
  soilType: string
  irrigationType: string
  
  // Dates
  plannedSowingDate: date
  actualSowingDate: date
  expectedHarvestDate: date
  actualHarvestDate: date
  
  // Harvest Data
  quantity: number
  quantityUnit: string
  qualityGrade: string
  
  // Financial
  investmentCost: number
  expectedRevenue: number
  actualRevenue: number
  
  // AI Recommendations
  aiRecommendations: object
  
  // Status
  status: 'active' | 'completed' | 'cancelled'
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Purchase Requests Table
```
{
  id: string
  cropId: string
  farmerId: string
  
  // Product Details
  cropType: string
  variety: string
  quantity: number
  quantityUnit: string
  qualityGrade: string
  
  // Pricing
  minimumPrice: number
  expectedPrice: number
  currentBestOffer: number
  
  // Location & Logistics
  pickupLocation: string
  availableFrom: date
  availableTill: date
  
  // Status
  status: 'open' | 'negotiating' | 'accepted' | 'completed' | 'cancelled'
  
  // Timestamps
  createdAt: timestamp
  expiresAt: timestamp
  updatedAt: timestamp
}
```

### Purchase Quotes Table
```
{
  id: string
  purchaseRequestId: string
  buyerId: string
  
  // Quote Details
  offeredPrice: number
  quantity: number
  paymentTerms: string
  deliveryTerms: string
  
  // Status
  status: 'pending' | 'countered' | 'accepted' | 'rejected'
  
  // Negotiation
  farmerCounter: number
  buyerCounter: number
  negotiationHistory: array
  
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## API Endpoints

### Crop Management
- `POST /api/farmer/crops` - Create new crop
- `GET /api/farmer/crops` - List all crops
- `GET /api/farmer/crops/:id` - Get crop details
- `PUT /api/farmer/crops/:id` - Update crop
- `PUT /api/farmer/crops/:id/stage` - Move to next stage
- `DELETE /api/farmer/crops/:id` - Delete crop

### AI Recommendations
- `POST /api/ai/pre-sowing-strategy` - Get planning recommendations
- `POST /api/ai/growing-strategy` - Get growing recommendations
- `POST /api/ai/selling-strategy` - Get selling strategy (sell now vs store)
- `POST /api/ai/price-prediction` - Get price trend prediction

### Purchase Requests
- `POST /api/farmer/purchase-requests` - Create purchase request
- `GET /api/farmer/purchase-requests` - List farmer's requests
- `GET /api/farmer/purchase-requests/:id` - Get request details
- `PUT /api/farmer/purchase-requests/:id` - Update request
- `DELETE /api/farmer/purchase-requests/:id` - Cancel request

### Buyer Side (Purchase Requests)
- `GET /api/buyer/purchase-requests` - Browse available requests
- `POST /api/buyer/quotes` - Submit quote
- `GET /api/buyer/quotes` - List buyer's quotes
- `PUT /api/buyer/quotes/:id` - Update/counter quote
- `POST /api/buyer/quotes/:id/accept` - Accept farmer's counter

---

## AI Integration (AWS Bedrock)

### Pre-Sowing AI Prompt
```
Analyze and provide crop planning recommendations:
- Crop: {cropType}
- Location: {location}
- Soil: {soilType}
- Land Size: {landSize} {unit}
- Planned Sowing: {date}
- Budget: {budget}

Provide:
1. Variety recommendation
2. Optimal sowing date
3. Resource requirements
4. Expected yield
5. Cost-benefit analysis
6. Risk factors
```

### Growing Stage AI Prompt
```
Provide growing strategy for:
- Crop: {cropType} at {stage}
- Sown: {sowingDate}
- Current Weather: {weather}
- Issues: {issues}

Recommend:
1. Irrigation schedule
2. Fertilizer timing
3. Pest/disease prevention
4. Growth milestones
5. Yield prediction update
```

### Harvest/Selling AI Prompt
```
Analyze selling strategy:
- Crop: {cropType}
- Quantity: {quantity} {unit}
- Quality: {grade}
- Current Price: {currentPrice}
- Storage Capacity: {storage}
- Cash Need: {urgency}

Provide:
1. Sell now vs store analysis
2. Recommended split percentage
3. Price trend (30/60/90 days)
4. Storage cost calculation
5. Profit comparison scenarios
6. Optimal selling windows
```

---

## Implementation Priority

### Phase 1 (Current Sprint)
1. ✅ Crop lifecycle overview page
2. ✅ Crop detail page structure
3. ⏳ Pre-sowing form & AI strategy
4. ⏳ Backend API for crops CRUD

### Phase 2
1. Growing stage form & tracking
2. Weather integration
3. Growing AI recommendations
4. Resource tracking

### Phase 3
1. Harvest stage form
2. Selling strategy AI
3. Sell now vs store calculator
4. Purchase request creation

### Phase 4
1. Live purchase request marketplace
2. Buyer quote system
3. Negotiation interface
4. AI-powered negotiation tips

---

## UI/UX Guidelines

### AI Strategy Sidebar
- Always visible on right side (desktop)
- Collapsible on mobile
- Color-coded by stage:
  - Pre-sowing: Blue gradient
  - Growing: Green gradient
  - Harvest: Orange gradient
- Real-time updates
- Confidence scores
- Action buttons

### Purchase Request Interface
- Card-based layout
- Real-time quote updates
- Price comparison charts
- Negotiation chat interface
- Accept/Counter/Reject buttons
- AI price suggestions during negotiation

### Responsive Design
- Mobile-first approach
- Touch-friendly buttons
- Swipe gestures for navigation
- Bottom sheets for mobile AI strategy

---

## Next Steps
1. Complete pre-sowing form implementation
2. Integrate AWS Bedrock for AI recommendations
3. Build backend APIs
4. Test with real farmer data
5. Iterate based on feedback

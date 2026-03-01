# AI-Powered Crop Recommendations Guide

## Overview
Implemented AI-powered crop recommendations using Groq (free AI service) that analyzes farmer input data and provides personalized crop suggestions with market insights.

## Features Implemented

### 1. AI Integration with Groq
**File**: `backend/src/services/ai/groq.service.ts`

- Uses Groq SDK with Llama 3.1 70B model (fast and capable)
- Free API access (no cost)
- Analyzes multiple factors:
  - Land size
  - Soil type
  - Location
  - Water availability
  - Budget
  - Season (optional)

### 2. Intelligent Fallback System
If Groq API is not configured or fails:
- Provides rule-based recommendations
- Considers soil type and water availability
- Returns sensible defaults based on agricultural best practices

### 3. Updated Crop Planning Page
**File**: `src/pages/farmer/CropPlanning.tsx`

#### New Features:
- Dynamic form with validation
- Real-time AI analysis
- Loading states with spinner
- Error handling
- Empty states
- AI-generated insights display

#### Form Fields:
- Land Size (acres) - Required
- Soil Type - Required (Clay, Loam, Sandy, Silt, Peat)
- Location - Required
- Water Availability - Required (Abundant, Moderate, Limited, Scarce)
- Budget (₹) - Required
- Season - Optional (Kharif, Rabi, Zaid)

### 4. AI Response Structure

```json
{
  "recommendations": [
    {
      "name": "Rice",
      "suitability": 90,
      "expectedYield": "4.5 tons/acre",
      "revenue": "₹1.8L/acre",
      "duration": "120 days",
      "waterNeed": "High",
      "marketDemand": "High",
      "riskLevel": "Low",
      "reasoning": "Excellent match for your soil type and water availability"
    }
  ],
  "insights": {
    "priceTrend": "Rising",
    "priceTrendPercentage": "+12%",
    "bestPlantingTime": "Current season is suitable",
    "demandForecast": "High",
    "additionalTips": [
      "Consider crop rotation",
      "Monitor weather forecasts",
      "Ensure proper irrigation"
    ]
  }
}
```

## Setup Instructions

### Option 1: Use Groq (Recommended - Free & Fast)

1. **Get Groq API Key** (Free):
   - Visit https://console.groq.com
   - Sign up for free account
   - Generate API key

2. **Configure Backend**:
   ```bash
   # In backend/.env
   USE_GROQ=true
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Restart Backend**:
   ```bash
   cd backend
   npm run dev
   ```

### Option 2: Use Fallback (No Setup Required)

If you don't configure Groq, the system automatically uses intelligent fallback recommendations based on:
- Soil type compatibility
- Water requirement matching
- Agricultural best practices

## API Endpoint

**POST** `/api/farmer/crop-recommendations`

**Request Body**:
```json
{
  "landSize": 5,
  "soilType": "loam",
  "location": "Punjab, India",
  "waterAvailability": "moderate",
  "budget": 100000,
  "season": "kharif"
}
```

**Response**: See AI Response Structure above

## User Experience

### 1. Initial State
- Empty form
- Placeholder message: "Fill in your farm details to get personalized recommendations"

### 2. Form Submission
- Validation ensures all required fields filled
- Button shows loading spinner: "Analyzing..."
- Disabled during processing

### 3. AI Analysis
- Loading card with spinner
- Message: "Analyzing your farm data..."
- Subtitle: "Our AI is considering soil type, water availability, market trends, and more"

### 4. Results Display
- 4-5 crop recommendations sorted by suitability
- Each recommendation shows:
  - Crop name with icon
  - Suitability percentage (visual bar)
  - Expected revenue (highlighted)
  - Expected yield
  - Duration
  - Water needs
  - Market demand
  - Risk level (color-coded badge)
  - AI reasoning (blue info box)
  - "Select & Plan" button

### 5. Market Insights
- Price trend card (Rising/Stable/Falling)
- Best planting time
- Demand forecast
- Additional tips list

## AI Prompt Engineering

The system uses a carefully crafted prompt that:
1. Sets context as agricultural expert
2. Provides all farm data
3. Requests structured JSON response
4. Specifies exact format needed
5. Lists factors to consider:
   - Soil compatibility
   - Water requirements
   - Budget constraints
   - Market prices
   - Seasonal suitability
   - Risk factors
   - Expected ROI

## Fallback Logic

### Rice Recommendation:
- Soil: Clay or Loam
- Water: Abundant or Moderate
- Suitability: 90%

### Wheat Recommendation:
- Soil: Loam, Clay, or Silt
- Water: Any
- Suitability: 85%

### Cotton Recommendation:
- Water: Moderate or Limited
- Suitability: 80%

### Pearl Millet Recommendation:
- Soil: Sandy
- Water: Limited or Scarce
- Suitability: 88%

### Chickpea Recommendation:
- Always included (good for rotation)
- Suitability: 75%

## Benefits

### For Farmers:
1. **Data-Driven Decisions**: AI analyzes multiple factors
2. **Personalized**: Based on their specific farm conditions
3. **Market Aware**: Considers current demand and prices
4. **Risk Assessment**: Shows risk level for each crop
5. **Actionable**: Clear reasoning for each recommendation

### Technical Benefits:
1. **Free AI**: No cost for Groq API
2. **Fast**: Llama 3.1 70B is optimized for speed
3. **Reliable**: Fallback ensures always works
4. **Scalable**: Can handle many requests
5. **Maintainable**: Clean separation of concerns

## Error Handling

1. **API Failure**: Automatically uses fallback
2. **Invalid Input**: Form validation prevents submission
3. **Network Error**: Shows error message with retry option
4. **Timeout**: Graceful degradation to fallback

## Future Enhancements

1. **Historical Data**: Learn from past recommendations
2. **Weather Integration**: Real-time weather consideration
3. **Market Prices**: Live price data integration
4. **Crop Calendar**: Automated planting reminders
5. **Success Tracking**: Monitor recommendation outcomes
6. **Multi-language**: Support regional languages
7. **Voice Input**: Speak farm details
8. **Image Analysis**: Upload field photos for soil analysis

## Testing

### Test Scenarios:

1. **High Water + Clay Soil**:
   - Should recommend Rice (high suitability)
   - Should recommend Wheat

2. **Low Water + Sandy Soil**:
   - Should recommend Pearl Millet
   - Should recommend Chickpea

3. **Moderate Everything**:
   - Should get balanced recommendations
   - Should include Cotton

4. **No API Key**:
   - Should use fallback
   - Should still provide good recommendations

## Status
✅ **Complete** - AI-powered crop recommendations with Groq integration and intelligent fallback system

## Quick Start

1. Fill in farm details in the form
2. Click "Get AI Recommendations"
3. Review AI-generated crop suggestions
4. Read AI reasoning for each crop
5. Check market insights
6. Select a crop and plan your season

No API key needed to start - fallback system provides intelligent recommendations!

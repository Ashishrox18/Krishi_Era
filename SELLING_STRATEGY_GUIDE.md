# AI Selling Strategy - User Guide

## Overview
The AI Selling Strategy feature helps farmers make data-driven decisions about when and how much of their harvest to sell for maximum profit.

## How It Works

### 1. Farmer Input
Farmers provide simple information about their crop:
- **Crop Type**: Select from 15+ common crops (Wheat, Rice, Maize, etc.)
- **Expected Yield**: Enter quantity with unit (Quintals/Tons/Kg)
- **Harvest Month**: When they expect to harvest
- **Current Market Price** (Optional): Helps improve accuracy
- **Storage Available**: Yes/No
- **Location** (Optional): For region-specific recommendations

### 2. AI Analysis
The system uses AWS Bedrock (Claude 3.5 Sonnet v2) to analyze:
- Historical price trends for the crop
- Seasonal patterns and market cycles
- Supply-demand dynamics
- Storage costs vs price appreciation
- Regional market conditions

### 3. AI Recommendations
Farmers receive:

#### A. Sell Now vs Store Split
- **Percentage to sell immediately** (e.g., 60%)
- **Percentage to store for later** (e.g., 40%)
- Exact quantities for each portion
- Visual progress bars

#### B. Price Predictions
- 1-month forecast
- 2-month forecast
- 3-month forecast
- Percentage change indicators

#### C. Profit Comparison
- Revenue if selling all now
- Revenue if following AI strategy
- Additional profit from strategy
- Clear financial impact

#### D. Key Insights
- 3-4 actionable insights about:
  - Market conditions
  - Timing recommendations
  - Risk factors
  - Storage considerations

#### E. Confidence Score
- 0-100% confidence in the recommendation
- Based on data quality and market stability

## Access the Feature

### For Farmers:
1. Login to your account
2. Go to: `/farmer/selling-strategy`
3. Or navigate: Dashboard → Selling Strategy

### Direct URL:
```
http://localhost:5173/farmer/selling-strategy
```

## Example Scenario

**Input:**
- Crop: Wheat
- Expected Yield: 100 quintals
- Harvest Month: April
- Current Price: ₹2,200/quintal
- Storage: Yes

**AI Output:**
- **Sell Now**: 40% (40 quintals) = ₹88,000
- **Store**: 60% (60 quintals) for 2 months
- **Expected Price in 2 months**: ₹2,500/quintal
- **Revenue from stored**: ₹1,50,000
- **Total Revenue**: ₹2,38,000
- **vs Sell All Now**: ₹2,20,000
- **Additional Profit**: ₹18,000 (+8.2%)

## Technical Implementation

### Frontend
- **Component**: `src/pages/farmer/SellingStrategy.tsx`
- **Route**: `/farmer/selling-strategy`
- **Features**:
  - Responsive two-column layout
  - Real-time AI analysis
  - Visual progress bars
  - Print/save functionality

### Backend
- **Endpoint**: `POST /api/ai/selling-strategy`
- **Controller**: `backend/src/controllers/ai.controller.ts`
- **Service**: `backend/src/services/aws/bedrock.service.ts`
- **Authentication**: Required (JWT token)

### API Request Format
```json
{
  "cropType": "Wheat",
  "expectedYield": 100,
  "yieldUnit": "quintals",
  "harvestMonth": "April",
  "currentMarketPrice": 2200,
  "storageAvailable": true,
  "location": "Punjab"
}
```

### API Response Format
```json
{
  "summary": "Based on market analysis...",
  "sellNowPercentage": 40,
  "storeLaterPercentage": 60,
  "pricePredictions": [
    {"period": "1 month", "price": 2300, "change": 4.5},
    {"period": "2 months", "price": 2500, "change": 13.6},
    {"period": "3 months", "price": 2400, "change": 9.1}
  ],
  "profitComparison": {
    "sellAllNow": 220000,
    "followStrategy": 238000,
    "additionalProfit": 18000
  },
  "insights": [
    "Wheat prices typically rise 10-15% post-harvest",
    "Storage costs are minimal compared to price gains",
    "Demand peaks in June-July for wheat"
  ],
  "confidence": 85
}
```

## AI Prompt Strategy

The system sends a detailed prompt to Claude 3.5 Sonnet v2 that includes:
1. Crop details and context
2. Request for specific data points
3. JSON format specification
4. Emphasis on realistic, India-specific recommendations

The AI considers:
- Historical price patterns for the specific crop
- Seasonal demand cycles
- Storage economics
- Regional market dynamics
- Risk factors

## Benefits

### For Farmers:
1. **Maximize Profits**: Data-driven selling decisions
2. **Reduce Risk**: Diversify selling timeline
3. **Better Planning**: Know when to sell what quantity
4. **Market Insights**: Understand price trends
5. **Storage Optimization**: Use storage capacity effectively

### Business Value:
1. **Farmer Retention**: High-value feature
2. **Data Collection**: Build price prediction models
3. **Storage Integration**: Connect with warehouse partners
4. **Premium Feature**: Monetization opportunity

## Future Enhancements

1. **Historical Tracking**: Save and compare past strategies
2. **Alerts**: Notify when optimal selling time arrives
3. **Market Integration**: Real-time price feeds
4. **Storage Booking**: Direct warehouse reservation
5. **Buyer Matching**: Connect with buyers at predicted prices
6. **Multi-Crop**: Analyze portfolio of crops together

## Testing

### Test the Feature:
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Login as farmer
4. Navigate to Selling Strategy
5. Fill form and click "Get AI Strategy"

### Sample Test Data:
```
Crop: Rice
Yield: 50 quintals
Month: November
Price: ₹1,800/quintal
Storage: Yes
Location: Haryana
```

## Troubleshooting

### "Failed to get AI recommendations"
- Check backend is running
- Verify AWS Bedrock is enabled
- Check AWS credentials in backend/.env
- Ensure Claude 3.5 Sonnet v2 model access

### Empty or Invalid Response
- Check backend logs
- Verify Bedrock service is working
- Test with different crop/values

### Slow Response
- Normal: AI analysis takes 3-5 seconds
- Check AWS region latency
- Consider caching common scenarios

## Cost Considerations

### AWS Bedrock Pricing:
- Claude 3.5 Sonnet v2: ~$3 per 1M input tokens
- Average request: ~500 tokens input, ~800 tokens output
- Cost per request: ~$0.004 (less than 1 cent)
- 1000 requests: ~$4

### Optimization:
- Cache results for same crop/month/price
- Batch similar requests
- Use cheaper models for simple cases

## Security

- Authentication required (JWT)
- Rate limiting recommended
- Input validation on backend
- Sanitize user inputs
- No PII in AI prompts

## Compliance

- Recommendations are suggestions, not guarantees
- Disclaimer about market volatility
- Farmers make final decisions
- No liability for price changes


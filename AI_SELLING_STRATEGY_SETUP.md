# AI Selling Strategy - Setup Guide

## Overview
The Selling Strategy page now uses Groq AI to provide intelligent recommendations on when and how much to sell for maximum profit.

## Features

### AI-Powered Analysis
- **Market Trend Analysis**: Analyzes historical price patterns for your crop
- **Optimal Selling Split**: Recommends what % to sell now vs store for later
- **Price Predictions**: Forecasts prices for next 1, 2, and 3 months
- **Profit Comparison**: Shows potential additional profit from strategic selling
- **Key Insights**: Provides 3-4 actionable market insights
- **Confidence Score**: Shows how confident the AI is in its recommendations

### Input Parameters
1. **Crop Type**: Select from 15+ common crops
2. **Expected Yield**: Enter quantity with unit (quintals/tons/kg)
3. **Harvest Month**: When you'll harvest
4. **Current Market Price**: Optional but improves accuracy
5. **Storage Available**: Yes/No - affects recommendations
6. **Location**: Optional - helps with regional pricing

## How It Works

### With Groq AI (Recommended - Free!)

1. **Get Free API Key**:
   - Visit: https://console.groq.com/keys
   - Sign up for free account
   - Create new API key
   - Copy the key

2. **Configure Backend**:
   ```bash
   cd backend
   nano .env
   ```

3. **Add Configuration**:
   ```env
   USE_GROQ=true
   GROQ_API_KEY=your_actual_groq_api_key_here
   ```

4. **Restart Backend**:
   ```bash
   # Backend will auto-restart if using nodemon
   # Or manually restart:
   npm run dev
   ```

5. **Test It**:
   - Go to: http://localhost:5173/farmer/selling-strategy
   - Fill in crop details
   - Click "Get AI Strategy"
   - See AI-powered recommendations!

### Without Groq AI (Fallback)

If Groq is not configured, the system uses intelligent fallback logic:

**With Storage Available:**
- Recommends selling 30% immediately
- Store 70% for better prices
- Predicts 5-10% price increase over 3 months
- Calculates potential additional profit

**Without Storage:**
- Recommends selling 100% immediately
- Provides tips on storage partnerships
- Suggests warehouse receipt schemes
- Focuses on getting best immediate price

## Example Recommendations

### Wheat with Storage
```json
{
  "summary": "Based on market trends for Wheat, we recommend selling 40% immediately to cover costs and storing 60% for better prices. Expected price increase of 12-15% over next 2-3 months.",
  "sellNowPercentage": 40,
  "storeLaterPercentage": 60,
  "pricePredictions": [
    {"period": "1 month", "price": 2100, "change": 5.0},
    {"period": "2 months", "price": 2300, "change": 15.0},
    {"period": "3 months", "price": 2200, "change": 10.0}
  ],
  "profitComparison": {
    "sellAllNow": 200000,
    "followStrategy": 224000,
    "additionalProfit": 24000
  },
  "insights": [
    "Wheat prices typically rise 10-15% in the 2-3 months post-harvest",
    "Government procurement starts in April, creating upward price pressure",
    "Ensure proper storage conditions to prevent moisture damage",
    "Monitor market prices weekly to identify optimal selling windows"
  ],
  "confidence": 85
}
```

### Rice without Storage
```json
{
  "summary": "Without storage facilities, we recommend selling your entire harvest immediately. Consider investing in storage for future harvests to maximize profits.",
  "sellNowPercentage": 100,
  "storeLaterPercentage": 0,
  "pricePredictions": [
    {"period": "1 month", "price": 2100, "change": 5.0},
    {"period": "2 months", "price": 2200, "change": 10.0},
    {"period": "3 months", "price": 2160, "change": 8.0}
  ],
  "profitComparison": {
    "sellAllNow": 180000,
    "followStrategy": 180000,
    "additionalProfit": 0
  },
  "insights": [
    "Without storage, immediate sale is the safest option",
    "Consider partnering with local warehouses for future harvests",
    "Government-backed warehouse receipt schemes can provide better prices",
    "Negotiate with multiple buyers to get the best immediate price"
  ],
  "confidence": 85
}
```

## UI Features

### Visual Elements
- **Progress Bars**: Show sell now vs store later split
- **Price Trend Chart**: Display predicted prices over time
- **Profit Comparison**: Highlight additional profit potential
- **Confidence Meter**: Visual confidence score indicator
- **Color-Coded Insights**: Easy-to-scan recommendations

### Actions
- **Get AI Strategy**: Generate recommendations
- **Try Another Crop**: Reset form for new analysis
- **Save Strategy**: Print/save recommendations

## Benefits

### For Farmers
1. **Maximize Profits**: Know when to sell for best prices
2. **Reduce Risk**: Make data-driven decisions
3. **Plan Better**: Understand market trends
4. **Save Time**: No need to manually track prices
5. **Confidence**: AI-backed recommendations

### Strategic Advantages
- **Market Timing**: Sell at optimal times
- **Storage Planning**: Know how long to store
- **Cash Flow**: Balance immediate vs future income
- **Risk Management**: Understand market volatility
- **Competitive Edge**: Access to market intelligence

## Technical Details

### AI Service Priority
1. **Groq AI** (if USE_GROQ=true and API key set)
2. **Ollama** (if USE_OLLAMA=true and running locally)
3. **AWS Bedrock** (if AWS configured)
4. **Fallback Logic** (always available)

### API Endpoint
```
POST /api/ai/selling-strategy
```

### Request Body
```json
{
  "cropType": "Wheat",
  "expectedYield": 100,
  "yieldUnit": "quintals",
  "harvestMonth": "April",
  "currentMarketPrice": 2000,
  "storageAvailable": true,
  "location": "Punjab"
}
```

### Response Structure
```json
{
  "summary": "string",
  "sellNowPercentage": number,
  "storeLaterPercentage": number,
  "pricePredictions": [
    {
      "period": "string",
      "price": number,
      "change": number
    }
  ],
  "profitComparison": {
    "sellAllNow": number,
    "followStrategy": number,
    "additionalProfit": number
  },
  "insights": ["string"],
  "confidence": number
}
```

## Troubleshooting

### "Failed to get AI recommendations"
- Check if backend is running
- Verify Groq API key is correct
- Check backend logs for errors
- Ensure USE_GROQ=true in .env

### Fallback Recommendations Showing
- This means Groq AI is not configured
- Follow setup steps above to enable AI
- Fallback still provides useful recommendations

### Slow Response
- Groq AI typically responds in 2-5 seconds
- Check internet connection
- Verify API key is valid
- Try again if timeout occurs

## Best Practices

### For Accurate Recommendations
1. **Provide Current Price**: Helps AI calibrate predictions
2. **Specify Location**: Regional prices vary significantly
3. **Be Realistic**: Enter accurate yield estimates
4. **Update Regularly**: Market conditions change

### Using Recommendations
1. **Don't Follow Blindly**: Use as guidance, not gospel
2. **Monitor Markets**: Track actual prices weekly
3. **Adjust Strategy**: Be flexible based on conditions
4. **Consider Costs**: Factor in storage costs
5. **Diversify**: Don't put all eggs in one basket

## Future Enhancements

- [ ] Historical price charts
- [ ] Real-time market data integration
- [ ] SMS/email price alerts
- [ ] Multiple crop comparison
- [ ] Regional price variations
- [ ] Weather impact analysis
- [ ] Demand forecasting
- [ ] Contract farming recommendations

## Support

### Getting Help
- Check backend logs: `cd backend && npm run dev`
- Verify configuration: `cat backend/.env`
- Test API directly: Use Postman/curl
- Check Groq dashboard: https://console.groq.com

### Common Issues
1. **API Key Invalid**: Get new key from Groq
2. **Rate Limit**: Free tier has limits, wait and retry
3. **Network Error**: Check internet connection
4. **Parse Error**: Backend will use fallback

## Summary

The AI Selling Strategy feature is now fully integrated with Groq AI support! 

**To enable AI:**
1. Get free Groq API key
2. Add to backend/.env
3. Set USE_GROQ=true
4. Restart backend
5. Start getting AI recommendations!

**Without AI:**
- Intelligent fallback logic still works
- Provides useful recommendations
- Based on agricultural best practices

Access at: http://localhost:5173/farmer/selling-strategy

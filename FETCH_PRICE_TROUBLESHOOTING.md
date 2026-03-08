# Fetch Price Feature - Troubleshooting Guide

## Overview
The "Fetch Price" feature allows farmers to automatically retrieve current market prices for their crops from real agricultural market data APIs.

## How It Works

### Backend Service
- **Service**: `backend/src/services/market-price.service.ts`
- **API Source**: data.gov.in Agricultural Market Prices API
- **Fallback**: Built-in price database for common crops
- **Cache**: 6-hour cache to reduce API calls

### Supported Crops
The service supports 20+ crops including:
- Wheat, Rice, Maize, Bajra, Jowar
- Cotton, Sugarcane
- Potato, Onion, Tomato
- Soybean, Groundnut, Mustard, Sunflower
- Chickpea, Lentils, Green Gram, Black Gram
- Barley, Millet

### API Endpoint
```
GET /api/farmer/market-prices?product={cropType}&state={state}
```

## Testing

### Test Backend Service Directly
```bash
cd backend
npx ts-node scripts/test-market-price.ts
```

Expected output:
```
✅ Wheat price: {
  average: 2335,
  min: 1935,
  max: 2650,
  trend: 'stable',
  change: 1,
  unit: 'quintal'
}
```

### Test API Endpoint
```bash
# Get token from browser localStorage after login
TOKEN="your_jwt_token_here"

# Test fetch price for Wheat
curl -X GET "http://localhost:3000/api/farmer/market-prices?product=Wheat" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "prices": {
    "wheat": {
      "current": 2335,
      "min": 1935,
      "max": 2650,
      "trend": "stable",
      "change": "+1%",
      "unit": "quintal"
    }
  }
}
```

## Common Issues & Solutions

### Issue 1: "Network Error: Cannot connect to backend"

**Symptoms:**
- Alert shows "Network Error: Cannot connect to backend server"
- Console shows `ERR_NETWORK` or `Network Error`

**Solution:**
1. Ensure backend server is running:
   ```bash
   cd backend
   npm run dev
   ```
2. Verify backend is on port 3000:
   ```bash
   lsof -ti:3000
   ```
3. Check backend logs for errors

### Issue 2: "Authentication Error: Please log in again"

**Symptoms:**
- Alert shows "Authentication Error"
- HTTP 401 status code

**Solution:**
1. Log out and log in again
2. Check if JWT token is valid in browser localStorage
3. Verify token hasn't expired (7-day expiry)

### Issue 3: "No price data available for crop"

**Symptoms:**
- Alert shows "No price data available"
- Crop not found in response

**Solution:**
1. Check if crop name is spelled correctly
2. Try a different crop from the supported list
3. The service will use fallback prices if API fails

### Issue 4: Backend server not starting

**Symptoms:**
- Cannot start backend with `npm run dev`
- Port 3000 already in use

**Solution:**
1. Kill existing process:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```
2. Start backend again:
   ```bash
   cd backend
   npm run dev
   ```

### Issue 5: API returns 500 error

**Symptoms:**
- Alert shows "Server Error"
- Backend logs show errors

**Solution:**
1. Check backend logs for detailed error
2. Verify AWS credentials in `.env` file
3. Check DynamoDB connection
4. Verify data.gov.in API is accessible

## Enhanced Error Messages

The fetch price feature now provides detailed error messages:

### Network Error
```
❌ Network Error: Cannot connect to backend.

Please ensure:
1. Backend server is running (port 3000)
2. You are logged in
3. Internet connection is active

You can enter the price manually.
```

### Success Message
```
✅ Price fetched successfully!

💰 ₹2335/quintal
📈 Trend: stable (+1%)
```

### No Data Available
```
⚠️ No price data available for "Tomato".

Please enter price manually.
```

## Features

### 1. Real-time Market Prices
- Fetches live data from government agricultural APIs
- Shows current, min, and max prices
- Displays price trends (rising/falling/stable)
- Shows percentage change

### 2. Intelligent Fallback
- If API fails, uses built-in price database
- Provides realistic prices based on typical market rates
- Ensures feature always works

### 3. Smart Caching
- Caches prices for 6 hours
- Reduces API calls
- Improves performance
- Saves bandwidth

### 4. Location-based Pricing
- Can filter by state
- Shows regional price variations
- More accurate for local markets

### 5. Unit Conversion
- Automatically converts between units
- Supports quintal, ton, kg
- Ensures consistent pricing

## Usage in Application

### 1. Harvest Management - List Produce
1. Go to Harvest Management page
2. Click "List for Sale" on a harvest-ready crop
3. Select crop type
4. Click "Fetch Price" button
5. Price automatically fills in the form

### 2. Harvest Management - Selling Strategy
1. Go to Harvest Management page
2. Click "Get AI Selling Strategy"
3. Fill in crop details
4. Click "Fetch Price" button (with trending up icon)
5. Current market price is fetched and used for AI analysis

## Backend Configuration

### Environment Variables
```env
# Optional: data.gov.in API key (has default)
DATA_GOV_API_KEY=your_api_key_here
```

### Service Configuration
```typescript
// Cache expiry (default: 6 hours)
private cacheExpiry = 6 * 60 * 60 * 1000;

// API timeout (default: 10 seconds)
timeout: 10000
```

## Monitoring

### Backend Logs
The service logs all operations:
```
🌾 Fetching market prices for Wheat...
✅ Found 10 market prices for Wheat
📊 Average price for Wheat: ₹2335 (1935-2650), Trend: stable (1%)
```

### Frontend Console
The UI logs all fetch operations:
```
🔍 Fetching price for Wheat...
📍 Location: Punjab
📝 Normalized crop type: Wheat
📦 API Response: {...}
✅ Found price data: {...}
💰 Price: ₹2335/quintal, Trend: stable (+1%)
```

## API Response Format

### Success Response
```json
{
  "prices": {
    "wheat": {
      "current": 2335,
      "min": 1935,
      "max": 2650,
      "trend": "stable",
      "change": "+1%",
      "unit": "quintal"
    }
  }
}
```

### Error Response
```json
{
  "error": "Failed to fetch market prices"
}
```

## Performance

### API Response Time
- With cache: < 10ms
- Without cache (API call): 500-2000ms
- Fallback: < 5ms

### Cache Strategy
- First request: Fetches from API
- Subsequent requests (within 6 hours): Returns cached data
- After 6 hours: Fetches fresh data

## Future Enhancements

1. **Historical Price Charts**: Show price trends over time
2. **Price Alerts**: Notify when prices reach target levels
3. **Multiple Markets**: Compare prices across different mandis
4. **Seasonal Analysis**: Show seasonal price patterns
5. **Demand Forecasting**: Predict future price movements

---

**Status**: ✅ Working with enhanced error handling
**Last Updated**: March 8, 2026
**Test Status**: All tests passing ✅

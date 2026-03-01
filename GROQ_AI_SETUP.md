# Groq AI Setup for Crop Recommendations

## Current Status
The crop recommendation system is currently using **hardcoded fallback data** because the Groq AI service is disabled (no API key configured).

## Why Use Groq AI?
- **100% Free** - No credit card required
- **Fast responses** - Powered by LPU (Language Processing Unit)
- **Smart recommendations** - Uses Llama 3.1 70B model
- **Real-time analysis** - Considers your specific farm conditions
- **Better than fallback** - Provides reasoning and market insights

## How to Enable AI Recommendations

### Step 1: Get Your Free Groq API Key (Takes 1 minute)

1. Visit: https://console.groq.com/keys
2. Sign up with your email (or use Google/GitHub login)
3. Click "Create API Key"
4. Copy the API key (starts with `gsk_...`)

### Step 2: Add API Key to Your Backend

1. Open `backend/.env` file
2. Find the line: `GROQ_API_KEY=your_groq_api_key_here`
3. Replace `your_groq_api_key_here` with your actual API key
4. Make sure `USE_GROQ=true` is set

Example:
```env
USE_GROQ=true
GROQ_API_KEY=gsk_abc123xyz456...
```

### Step 3: Restart Backend Server

The backend server needs to be restarted to load the new API key:

```bash
# Stop the current server (Ctrl+C in the terminal)
# Or if running in background, stop it from the process list

# Start it again
cd backend
npm run dev
```

### Step 4: Test AI Recommendations

1. Go to: http://localhost:5173/farmer/crop-planning
2. Fill in the form:
   - Land Size: 5 acres
   - Soil Type: Loam
   - Location: Any village/city
   - Water Availability: Moderate
   - Budget: ₹50,000
   - Season: Kharif
3. Click "Get AI Recommendations"
4. You should see AI-generated recommendations with reasoning!

## What Changes with AI Enabled?

### Before (Hardcoded Fallback):
- Generic recommendations based on simple rules
- Same suggestions for similar inputs
- Basic reasoning
- Limited market insights

### After (Groq AI):
- Personalized recommendations for your specific location
- Considers current market trends
- Detailed reasoning for each crop
- Real-time analysis of soil, water, budget constraints
- Better revenue estimates
- Seasonal suitability analysis

## Troubleshooting

### "Groq AI service disabled" in console
- Check that `USE_GROQ=true` in `.env`
- Verify API key is correct (starts with `gsk_`)
- Restart backend server

### Still seeing hardcoded recommendations
- Check browser console for errors
- Verify backend server restarted successfully
- Check backend logs for "Groq AI service initialized"

### API Key Invalid
- Make sure you copied the entire key
- No extra spaces before/after the key
- Get a new key from https://console.groq.com/keys

## Free Tier Limits

Groq's free tier is very generous:
- **14,400 requests per day**
- **30 requests per minute**
- More than enough for development and testing

## Alternative: Keep Using Fallback

If you prefer not to use AI, the system will continue working with the hardcoded fallback recommendations. They're based on agricultural best practices and will provide reasonable suggestions.

To use fallback only:
```env
USE_GROQ=false
```

## Need Help?

If you encounter any issues:
1. Check the backend console logs
2. Verify the API key is correct
3. Make sure the backend server restarted
4. Test with a simple request first

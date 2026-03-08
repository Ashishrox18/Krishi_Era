# AI Selling Strategy Improvements

## Issues Fixed

### 1. Location Input - Manual Entry Not Working
**Problem:** Users couldn't manually type and search for locations like in crop planning

**Solution:** Added searchable location dropdown with auto-suggestions
- Type 3+ characters to trigger location search
- Uses OpenStreetMap Nominatim API to search Indian locations
- Shows dropdown with city, district, state format
- Click to select from suggestions
- Still supports "Detect" button for GPS location
- Can also type manually without selecting from dropdown

**Implementation:**
- Added `locationSuggestions`, `showLocationSuggestions`, `searchingLocations` state
- Added `fetchLocationSuggestions()` function to search locations
- Added `selectLocation()` function to select from dropdown
- Updated `updateStrategyField()` to trigger search when typing location
- Added dropdown UI with loading indicator

### 2. AI Strategy Always Showing 40/60 Split
**Problem:** AI recommendations weren't personalized - always showing 40% sell now, 60% store later

**Root Cause Investigation:**
- Need to verify if Bedrock AI is actually being called or using fallback
- Fallback strategy has hardcoded 40/60 split for storage available
- AI prompt didn't explicitly ask for varied percentages

**Solution:**
- Added extensive logging to track:
  - Whether Bedrock is enabled
  - Input data being sent
  - Prompt being used
  - Response structure received
  - Actual sell/store percentages returned
- Updated AI prompt to explicitly request varied percentages:
  - "VARY the sellNowPercentage and storeLaterPercentage based on market conditions (not always 40/60)"
  - "Consider seasonal factors, current demand, and price trends for ${data.location}"
- Logs will show if using fallback vs real AI

## Changes Made

### Frontend - HarvestManagement.tsx

**New State Variables:**
```typescript
const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
const [searchingLocations, setSearchingLocations] = useState(false);
```

**New Functions:**
```typescript
// Fetch location suggestions from OpenStreetMap
const fetchLocationSuggestions = async (query: string) => {
  // Search Indian locations
  // Format as "City, District, State"
  // Show in dropdown
}

// Select location from dropdown
const selectLocation = (location: string) => {
  updateStrategyField('location', location);
  setShowLocationSuggestions(false);
}
```

**Updated Functions:**
```typescript
// Trigger location search when typing
const updateStrategyField = (field: string, value: string) => {
  // ... existing code ...
  
  if (field === 'location' && value.length > 2) {
    setSearchingLocations(true);
    fetchLocationSuggestions(value);
  }
}

// Close suggestions when detecting location
const detectLocation = async () => {
  setShowLocationSuggestions(false); // Added
  // ... rest of code ...
}
```

**Updated UI:**
```tsx
<div className="flex-1 relative">
  <input
    type="text"
    required
    value={strategyForm.location}
    onChange={(e) => updateStrategyField('location', e.target.value)}
    className="input-field w-full"
    placeholder="e.g., Bangalore, Karnataka"
    disabled={detectingLocation}
  />
  
  {/* Loading indicator */}
  {searchingLocations && (
    <div className="absolute right-3 top-1/2 -translate-y-1/2">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
    </div>
  )}
  
  {/* Dropdown suggestions */}
  {showLocationSuggestions && locationSuggestions.length > 0 && (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {locationSuggestions.map((location, index) => (
        <button
          key={index}
          type="button"
          onClick={() => selectLocation(location)}
          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
        >
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{location}</span>
        </button>
      ))}
    </div>
  )}
</div>
```

### Backend - bedrock.service.ts

**Enhanced Logging:**
```typescript
console.log('🔍 Bedrock Service - getSellingStrategy called');
console.log('📊 Input data:', JSON.stringify(data, null, 2));
console.log('⚙️ Bedrock enabled:', this.enabled);
console.log('🔑 AWS credentials configured:', !!this.client);
console.log('📤 Sending prompt to Bedrock (length:', prompt.length, 'chars)');
console.log('✅ Bedrock AI selling strategy received');
console.log('📊 Response structure:', JSON.stringify(response, null, 2));
console.log('📈 Sell/Store split:', response.sellNowPercentage, '/', response.storeLaterPercentage);
```

**Updated AI Prompt:**
Added explicit instructions to vary percentages:
```
CRITICAL RULES:
- VARY the sellNowPercentage and storeLaterPercentage based on market conditions (not always 40/60)
- Consider seasonal factors, current demand, and price trends for ${data.location}
```

## Testing Instructions

### Test Location Search:
1. Go to AI Selling Strategy tab
2. Click in Location field
3. Type "bang" - should show Bangalore suggestions
4. Type "pune" - should show Pune suggestions
5. Click on a suggestion - should fill the field
6. Clear and type manually - should still work
7. Click "Detect" button - should auto-fill with GPS location

### Test AI Strategy Personalization:
1. Fill in crop details with different scenarios:
   - Scenario A: Wheat, 100 quintals, January, ₹2500, Storage: Yes, Location: Punjab
   - Scenario B: Rice, 50 quintals, June, ₹3000, Storage: No, Location: Tamil Nadu
   - Scenario C: Cotton, 200 quintals, October, ₹5000, Storage: Yes, Location: Gujarat
2. Check backend logs for:
   - "🤖 Using Amazon Bedrock AI" (not fallback)
   - Input data logged
   - Response structure logged
   - Different sell/store percentages for different scenarios
3. Verify frontend shows:
   - Different percentages (not always 40/60)
   - Location-specific insights
   - Personalized recommendations

## Expected Behavior

### Location Input:
- ✅ Type to search locations
- ✅ See dropdown with suggestions
- ✅ Click to select
- ✅ Auto-detect with GPS
- ✅ Manual entry still works

### AI Strategy:
- ✅ Should use real Bedrock AI (not fallback)
- ✅ Should vary percentages based on:
  - Crop type
  - Location
  - Harvest month
  - Storage availability
  - Market price
- ✅ Should provide location-specific insights
- ✅ Should show different recommendations for different scenarios

## Next Steps

If AI strategy is still showing 40/60:
1. Check backend logs to see if Bedrock is being called
2. If using fallback, check AWS credentials and Bedrock configuration
3. If using Bedrock but still 40/60, the AI model may need more explicit instructions
4. Consider adding more context about market conditions in the prompt

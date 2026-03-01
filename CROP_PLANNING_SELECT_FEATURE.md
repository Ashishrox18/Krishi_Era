# Crop Planning "Select & Plan" Feature

## Overview
Implemented functionality for the "Select & Plan" button that allows farmers to save recommended crops to their crop management system.

## Feature Implementation

### What Happens When Farmer Clicks "Select & Plan"

1. **Data Collection**:
   - Takes the selected crop recommendation
   - Uses the farmer's input data (land size, soil type, location, etc.)
   - Calculates total expected yield and revenue based on land size

2. **Crop Record Creation**:
   - Creates a new crop entry in the database
   - Includes all relevant information:
     - Crop type
     - Area (land size)
     - Soil type
     - Location
     - Water availability
     - Season
     - Expected yield (calculated)
     - Expected revenue (calculated)
     - Duration
     - Market demand
     - Risk level
     - Status: "Planned"
     - Planting date (current date)
     - Estimated harvest date (calculated)
     - AI reasoning notes

3. **User Feedback**:
   - Shows loading spinner while saving
   - Displays success message
   - Automatically redirects to farmer dashboard after 2 seconds

4. **Dashboard Integration**:
   - Saved crop appears in "Current Crops" section
   - Contributes to dashboard statistics
   - Can be managed from harvest management page

## Calculations

### Expected Yield:
```
Yield per acre (from recommendation) × Land size = Total expected yield
Example: 4.5 tons/acre × 5 acres = 22.5 tons
```

### Expected Revenue:
```
Revenue per acre (from recommendation) × Land size = Total expected revenue
Example: ₹1.8L/acre × 5 acres = ₹9L
```

### Harvest Date:
```
Current date + Duration (days) = Estimated harvest date
Example: Today + 120 days = Harvest date
```

## User Experience Flow

### Step 1: Get Recommendations
1. Farmer fills in farm details
2. Clicks "Get AI Recommendations"
3. Receives 4-5 crop suggestions

### Step 2: Review Options
1. Reviews each crop's details
2. Checks suitability percentage
3. Reads AI reasoning
4. Compares expected revenue

### Step 3: Select Crop
1. Clicks "Select & Plan" on chosen crop
2. Button shows "Saving..." with spinner
3. Success message appears: "{Crop Name} has been added to your crop plan!"
4. Automatically redirected to dashboard

### Step 4: View in Dashboard
1. Crop appears in "Current Crops" section
2. Shows in dashboard statistics
3. Can track progress over time

## Data Structure

### Saved Crop Object:
```json
{
  "cropType": "Rice",
  "area": 5,
  "soilType": "loam",
  "location": "Punjab, India",
  "waterAvailability": "moderate",
  "season": "kharif",
  "expectedYield": 22.5,
  "expectedRevenue": 900000,
  "estimatedPrice": 40000,
  "duration": 120,
  "waterNeed": "High",
  "marketDemand": "High",
  "riskLevel": "Low",
  "status": "Planned",
  "plantingDate": "2026-03-01T06:30:00.000Z",
  "harvestDate": "2026-06-29T06:30:00.000Z",
  "notes": "Excellent match for your soil type and water availability"
}
```

## Button States

### Default State:
- Icon: Check mark
- Text: "Select & Plan"
- Color: Primary blue
- Enabled: Yes

### Loading State:
- Icon: Spinning loader
- Text: "Saving..."
- Color: Primary blue (dimmed)
- Enabled: No (disabled)

### After Success:
- Success banner appears
- Button remains disabled
- Page redirects to dashboard

## Error Handling

### If Save Fails:
1. Shows error message: "Failed to save crop plan. Please try again."
2. Button returns to default state
3. Farmer can retry

### Validation:
- All form fields must be filled before getting recommendations
- Can only select crops after recommendations are loaded
- Prevents duplicate saves with disabled state

## Integration Points

### Frontend:
- **File**: `src/pages/farmer/CropPlanning.tsx`
- **Function**: `handleSelectCrop(crop)`
- **Navigation**: Uses React Router to redirect

### Backend:
- **Endpoint**: `POST /api/farmer/crops`
- **Controller**: `FarmerController.createCrop()`
- **Database**: Stores in DynamoDB crops table

### Dashboard:
- **File**: `src/pages/farmer/FarmerDashboard.tsx`
- **Display**: Shows in "Current Crops" section
- **Stats**: Updates total land, active crops, expected yield/revenue

## Benefits

### For Farmers:
1. **Quick Action**: One click to save crop plan
2. **Data Preservation**: All recommendation details saved
3. **Progress Tracking**: Can monitor crop from planning to harvest
4. **Dashboard Integration**: Immediate visibility of planned crops
5. **AI Insights Saved**: Reasoning preserved for future reference

### For System:
1. **Data Collection**: Builds historical crop planning data
2. **Success Tracking**: Can measure recommendation accuracy
3. **User Engagement**: Encourages farmers to act on recommendations
4. **Workflow Completion**: Connects planning to execution

## Future Enhancements

1. **Edit Crop Plan**: Modify saved crop details
2. **Multiple Crops**: Select and save multiple crops at once
3. **Calendar View**: Visual timeline of planting/harvest dates
4. **Reminders**: Notifications for planting and harvest times
5. **Progress Updates**: Track actual vs expected yield
6. **Cost Tracking**: Add input costs and calculate profit
7. **Weather Alerts**: Notify about weather affecting crops
8. **Market Price Updates**: Real-time price tracking for planned crops

## Testing Checklist

- [x] Button saves crop to database
- [x] Success message displays
- [x] Redirects to dashboard
- [x] Crop appears in dashboard
- [x] Loading state works
- [x] Error handling works
- [x] Calculations are correct
- [x] All crop data saved properly
- [x] No duplicate saves possible

## Status
✅ **Complete** - "Select & Plan" button now saves crops and redirects to dashboard

## Quick Test

1. Go to http://localhost:5173/farmer/crop-planning
2. Fill in farm details
3. Click "Get AI Recommendations"
4. Click "Select & Plan" on any crop
5. See success message
6. Get redirected to dashboard
7. See crop in "Current Crops" section

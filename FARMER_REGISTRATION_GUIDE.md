# Farmer Registration Guide

## Complete Profile Registration for Farmers

The Krishi Era AI platform provides a comprehensive 5-step registration process for farmers to create their complete profile with all necessary details for accessing government schemes, subsidies, and platform features.

## Registration Steps

### Step 1: Basic Details
- Full Name (required)
- Email Address (required)
- Mobile Number (required) - 10-digit Indian mobile number
- Date of Birth (optional)
- Gender (optional)
- Password (required) - Minimum 6 characters
- Confirm Password (required)

**Validation:**
- Valid email format
- 10-digit mobile number starting with 6-9
- Password must be at least 6 characters
- Passwords must match

### Step 2: Address Details
- Complete Address (required) - House/Plot number, Street name
- Village/Town (required)
- District (required)
- State (required) - Select from dropdown of all Indian states
- Pincode (required) - 6-digit pincode

**Validation:**
- All fields are mandatory
- Pincode must be exactly 6 digits

### Step 3: Farm Details
- Farm Size (required) - Numeric value
- Unit (required) - Acres, Hectares, or Bigha
- Land Ownership (required) - Owned, Leased, or Shared
- Soil Type (optional) - Alluvial, Black, Red, Laterite, Desert, Mountain
- Irrigation Type (optional) - Drip, Sprinkler, Canal, Well/Borewell, Rainfed

**Purpose:** Helps in providing crop recommendations and resource planning

### Step 4: Bank Details
Required for receiving payments and government subsidies:

- Bank Name (required)
- Branch Name (required)
- Account Holder Name (required) - As per bank records
- Account Number (required)
- IFSC Code (required) - 11-character code (e.g., SBIN0001234)

**Validation:**
- IFSC Code format: 4 letters + 0 + 6 alphanumeric characters
- Example: SBIN0001234

### Step 5: Government Identification
Required for verification and accessing government schemes:

- **Aadhaar Number (required)** - 12-digit unique identification number
- **PAN Number (optional)** - 10-character alphanumeric (e.g., ABCDE1234F)
- **Farmer ID Number (optional)** - State-issued farmer identification
- **Kisan Credit Card (optional)** - KCC number if available

**Validation:**
- Aadhaar: Exactly 12 digits
- PAN: Format ABCDE1234F (5 letters + 4 digits + 1 letter)

## How to Access

### Option 1: Direct Link
Go to: `http://localhost:5173/register/farmer`

### Option 2: From Login Page
1. Go to `http://localhost:5173/login`
2. Click on "Quick Register" tab
3. Click on the blue notification: "Farmers: For complete profile registration... click here"

## Features

✅ **Multi-step Form** - Easy to complete in stages
✅ **Progress Indicator** - Visual progress bar showing completed steps
✅ **Validation** - Real-time validation for all fields
✅ **Indian Context** - All Indian states, soil types, and ID formats
✅ **Secure** - Passwords are hashed, data is encrypted
✅ **Auto-redirect** - Automatically redirects to Farmer Dashboard after registration

## Data Storage

All profile data is securely stored in DynamoDB with the following structure:

```json
{
  "id": "uuid",
  "email": "farmer@example.com",
  "name": "Farmer Name",
  "role": "farmer",
  "phone": "+919876543210",
  "profile": {
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": {
      "street": "House/Plot details",
      "village": "Village Name",
      "district": "District Name",
      "state": "State Name",
      "pincode": "123456"
    },
    "farmDetails": {
      "size": "5",
      "sizeUnit": "acres",
      "ownership": "owned",
      "soilType": "alluvial",
      "irrigationType": "drip"
    },
    "bankDetails": {
      "bankName": "State Bank of India",
      "accountNumber": "1234567890",
      "ifscCode": "SBIN0001234",
      "accountHolderName": "Farmer Name",
      "branchName": "Branch Name"
    },
    "governmentIds": {
      "aadhaar": "123456789012",
      "pan": "ABCDE1234F",
      "farmerId": "FARM123456",
      "kisanCreditCard": "KCC123456"
    }
  },
  "createdAt": "2026-02-28T...",
  "updatedAt": "2026-02-28T..."
}
```

## Benefits of Complete Registration

1. **Government Schemes** - Access to PM-KISAN, crop insurance, and subsidies
2. **Direct Payments** - Receive payments directly to your bank account
3. **Personalized Recommendations** - AI-powered crop and resource recommendations
4. **Credit Access** - Easier access to agricultural credit
5. **Market Access** - Connect with buyers and get better prices
6. **Weather Alerts** - Location-based weather and advisory alerts

## Quick Registration vs Complete Registration

### Quick Registration (Login Page)
- Basic details only (name, email, phone, role, password)
- Fast registration
- Can update profile later
- Suitable for buyers, transporters, storage providers

### Complete Registration (Farmer Registration)
- All details in one flow
- Farm details, bank info, government IDs
- Ready to access all features immediately
- Recommended for farmers

## Security & Privacy

- All sensitive data is encrypted
- Passwords are hashed using bcrypt
- Government IDs are stored securely
- Data is used only for verification and accessing schemes
- Compliant with data protection regulations

## Support

If you face any issues during registration:
1. Check that all required fields are filled
2. Verify format of Aadhaar, PAN, IFSC codes
3. Ensure mobile number is 10 digits
4. Check browser console for detailed error messages

## Next Steps After Registration

After successful registration, you'll be redirected to the Farmer Dashboard where you can:
- Plan your crops with AI recommendations
- Manage harvest and inventory
- Connect with buyers
- Track market prices
- Access weather forecasts
- Apply for government schemes

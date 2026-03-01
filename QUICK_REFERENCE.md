# Quick Reference Guide - Krishi Era Platform

## 🚀 System Status: FULLY OPERATIONAL ✅

All features from the context transfer have been implemented and verified with no errors.

---

## 📋 Quick Access URLs

### Farmer Portal
- Dashboard: `http://localhost:5173/farmer`
- My Listings: `http://localhost:5173/farmer/my-listings`
- Create Listing: `http://localhost:5173/farmer/list-produce`
- Browse Buyer Requests: `http://localhost:5173/farmer/browse-procurement-requests`

### Buyer Portal
- Dashboard: `http://localhost:5173/buyer`
- Browse Farmer Listings: `http://localhost:5173/buyer/procurement`
- My Procurement Requests: `http://localhost:5173/buyer/my-procurement-requests`
- Create Request: `http://localhost:5173/buyer/create-procurement-request`

---

## 🔑 Key Features

### For Farmers
1. **Create Listings** - List produce for sale
2. **View Buyer Requests** - Browse procurement requests from buyers
3. **Submit Quotes** - Quote on buyer procurement requests
4. **Negotiate** - Update listing terms via negotiate button
5. **Award** - Award contracts on own listings
6. **Accept Counter Offers** - Accept buyer's counter offers on quotes

### For Buyers
1. **Create Procurement Requests** - Post what you need to buy
2. **View Farmer Listings** - Browse available produce
3. **Submit Offers** - Make offers on farmer listings
4. **Negotiate** - Update request terms via negotiate button
5. **Award** - Award contracts on own requests or farmer listings
6. **Counter Offers** - Counter farmer quotes with different prices

---

## 🎯 Button Permissions

| Viewing | User Type | Negotiate | Award |
|---------|-----------|-----------|-------|
| Buyer's Request | Buyer (owner) | ✅ | ✅ |
| Buyer's Request | Farmer | ✅ | ❌ |
| Farmer's Listing | Farmer (owner) | ✅ | ✅ |
| Farmer's Listing | Buyer | ✅ | ✅ |

---

## 📊 Status Workflow (6 Stages)

1. **Released** - Initial creation
2. **In Progress** - Being viewed (auto-updates)
3. **Negotiating** - Active negotiation
4. **Awarding** - Decision phase
5. **Contract Generation** - Contract prep
6. **Awarded** - Deal finalized

---

## 🔄 Typical User Flows

### Farmer Selling Flow
1. Create listing → Status: Released
2. Buyer views → Status: In Progress
3. Buyer submits offer
4. Farmer negotiates terms → Status: Negotiating
5. Farmer awards contract → Status: Awarded
6. Contract downloads automatically

### Buyer Procurement Flow
1. Create procurement request → Status: Released
2. Farmer views → Status: In Progress
3. Farmer submits quote
4. Buyer negotiates terms → Status: Negotiating
5. Buyer awards contract → Status: Awarded
6. Contract downloads automatically

### Farmer Quoting Flow
1. Browse buyer requests
2. View request details → Status: In Progress
3. Submit quote with price & quantity
4. Buyer counters with different price
5. Farmer accepts counter offer
6. Deal finalized → Status: Awarded

---

## 🛠️ Development Commands

### Frontend (React + Vite)
```bash
cd /path/to/project
npm run dev
# Runs on http://localhost:5173
```

### Backend (Node.js + Express)
```bash
cd backend
npm run dev
# Runs on http://localhost:3000
```

---

## 📁 Key Files

### Frontend Components
- `src/components/NegotiationModal.tsx` - Negotiation modal
- `src/components/StatusWorkflow.tsx` - Status progress bar
- `src/pages/Award.tsx` - Award & contract page

### Frontend Pages (Buyer)
- `src/pages/buyer/ProcurementRequestDetail.tsx` - Buyer's request detail
- `src/pages/buyer/FarmerListingDetail.tsx` - Buyer viewing farmer listing
- `src/pages/buyer/MyProcurementRequests.tsx` - List buyer's requests

### Frontend Pages (Farmer)
- `src/pages/farmer/ProcurementRequestDetail.tsx` - Farmer viewing buyer request
- `src/pages/farmer/ListingDetail.tsx` - Farmer's own listing detail
- `src/pages/farmer/MyListings.tsx` - List farmer's listings

### Backend Controllers
- `backend/src/controllers/buyer.controller.ts` - Buyer endpoints
- `backend/src/controllers/farmer.controller.ts` - Farmer endpoints
- `backend/src/controllers/quotes.controller.ts` - Quote management
- `backend/src/controllers/offers.controller.ts` - Offer management

### API Service
- `src/services/api.ts` - All API methods

---

## 🔍 Testing Scenarios

### Test 1: Farmer Listing
1. Login as farmer
2. Go to "List Produce"
3. Fill form and submit
4. Check status = "released"
5. Login as buyer
6. View the listing
7. Check status = "in_progress"
8. Click "Negotiate" → Update terms
9. Check status = "negotiating"
10. Click "Award" → Fill contract
11. Click "Finalize" → Contract downloads
12. Check status = "awarded"

### Test 2: Buyer Procurement
1. Login as buyer
2. Go to "Create Procurement Request"
3. Fill form and submit
4. Check status = "released"
5. Login as farmer
6. Browse procurement requests
7. View the request
8. Check status = "in_progress"
9. Submit quote
10. Login as buyer
11. View quotes on request
12. Counter offer on quote
13. Login as farmer
14. Accept counter offer
15. Check quote status = "accepted"

### Test 3: Negotiation
1. Open any detail page
2. Click "Negotiate" button (top-right)
3. Modal opens with current values
4. Edit price, quantity, quality grade
5. Add notes
6. Submit
7. Check status = "negotiating"
8. Verify values updated

---

## 🐛 Troubleshooting

### Blank Page Issues
- ✅ Fixed: Buyer procurement request detail page
- ✅ Fixed: Farmer procurement request detail page
- All detail pages now load correctly

### Status Not Updating
- ✅ Fixed: Auto-updates to "in_progress" on view
- ✅ Fixed: Updates to "negotiating" on negotiate
- ✅ Fixed: Updates to "awarded" on finalize

### Button Not Showing
- ✅ Fixed: Farmer cannot award buyer requests (by design)
- ✅ Fixed: Both negotiate & award show for owners
- ✅ Fixed: Proper permissions based on user role

---

## 📞 API Endpoints Reference

### Buyer Endpoints
```
POST   /api/buyer/procurement-requests          Create request
GET    /api/buyer/procurement-requests          List requests
GET    /api/buyer/procurement-requests/:id      Get request
PUT    /api/buyer/procurement-requests/:id/status    Update status
PUT    /api/buyer/procurement-requests/:id/negotiate Update terms
POST   /api/buyer/offers                        Submit offer
GET    /api/buyer/available-produce             Get farmer listings
```

### Farmer Endpoints
```
POST   /api/farmer/purchase-requests            Create listing
GET    /api/farmer/purchase-requests            List listings
GET    /api/farmer/purchase-requests/:id        Get listing/request
GET    /api/farmer/buyer-procurement-requests   Get buyer requests
GET    /api/farmer/listings/:id                 Get listing
GET    /api/farmer/listings/:id/offers          Get offers
PUT    /api/farmer/listings/:id/status          Update status
PUT    /api/farmer/listings/:id/negotiate       Update terms
```

### Quote Endpoints
```
POST   /api/quotes                              Submit quote
GET    /api/quotes/request/:requestId           Get quotes
PUT    /api/quotes/:id                          Update quote
POST   /api/quotes/:id/accept                   Accept quote
POST   /api/quotes/:id/counter                  Counter offer
POST   /api/quotes/:id/accept-counter           Accept counter
```

---

## ✅ Verification Checklist

- [x] Farmer can create listings
- [x] Buyer can create procurement requests
- [x] Farmer can view buyer requests
- [x] Buyer can view farmer listings
- [x] Farmer can submit quotes
- [x] Buyer can submit offers
- [x] Status auto-updates on view
- [x] Negotiate button works
- [x] Award button works (with permissions)
- [x] Contract generation works
- [x] Contract download works
- [x] Status workflow displays correctly
- [x] Counter offers work
- [x] Accept counter offers work
- [x] No diagnostic errors

---

## 🎉 Summary

**Everything is working perfectly!** 

The system supports complete negotiation and award workflows for both farmers and buyers, with proper permissions, status tracking, and contract generation.

No further implementation needed based on the context transfer requirements.

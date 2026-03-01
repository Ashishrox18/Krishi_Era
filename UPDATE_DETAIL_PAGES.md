# Update Detail Pages - Implementation Guide

## Pages to Update

1. ✅ `src/pages/buyer/FarmerListingDetail.tsx` - DONE
2. ⏳ `src/pages/buyer/ProcurementRequestDetail.tsx`
3. ⏳ `src/pages/farmer/ListingDetail.tsx`
4. ⏳ `src/pages/farmer/ProcurementRequestDetail.tsx`

## Changes Needed for Each Page

### 1. Add Imports
```typescript
import NegotiationModal from '../../components/NegotiationModal'
```

### 2. Add State
```typescript
const [showNegotiateModal, setShowNegotiateModal] = useState(false)
```

### 3. Add Status Update on Load
```typescript
const updateStatusToInProgress = async () => {
  try {
    // For buyer procurement request
    await apiService.updateProcurementStatus(id!, 'in_progress')
    // OR for farmer listing
    await apiService.updateListingStatus(id!, 'in_progress')
  } catch (error) {
    console.error('Failed to update status:', error)
  }
}

useEffect(() => {
  loadData()
  updateStatusToInProgress()
}, [id])
```

### 4. Add Handler Functions
```typescript
const handleNegotiate = async (updates: any) => {
  try {
    // For buyer procurement
    await apiService.negotiateProcurement(id!, updates)
    // OR for farmer listing
    await apiService.negotiateListing(id!, updates)
    await loadData()
    alert('Updated successfully!')
  } catch (error) {
    console.error('Negotiation failed:', error)
    throw error
  }
}

const handleAward = () => {
  // For listing
  navigate(`/award/listing/${id}`)
  // OR for procurement
  navigate(`/award/procurement/${id}`)
}
```

### 5. Add Buttons in Header
```typescript
{/* Negotiate & Award Buttons */}
{data.status !== 'awarded' && (
  <div className="flex space-x-3">
    <button
      onClick={() => setShowNegotiateModal(true)}
      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
    >
      <MessageSquare className="h-4 w-4" />
      <span>Negotiate</span>
    </button>
    <button
      onClick={handleAward}
      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
    >
      <Award className="h-4 w-4" />
      <span>Award</span>
    </button>
  </div>
)}
```

### 6. Add Modal Before Closing Div
```typescript
{/* Negotiation Modal */}
<NegotiationModal
  isOpen={showNegotiateModal}
  onClose={() => setShowNegotiateModal(false)}
  onSubmit={handleNegotiate}
  data={data}
  type="listing" // or "procurement"
/>
```

## Specific Details for Each Page

### Buyer Procurement Request Detail
- Status update: `updateProcurementStatus`
- Negotiate: `negotiateProcurement`
- Award route: `/award/procurement/${id}`
- Modal type: `"procurement"`
- Data variable: `request`

### Farmer Listing Detail
- Status update: `updateListingStatus`
- Negotiate: `negotiateListing`
- Award route: `/award/listing/${id}`
- Modal type: `"listing"`
- Data variable: `listing`

### Farmer Procurement Request Detail
- Status update: `updateProcurementStatus` (viewing buyer's request)
- Negotiate: `negotiateProcurement`
- Award route: `/award/procurement/${id}`
- Modal type: `"procurement"`
- Data variable: `request`
- Note: Farmer is viewing buyer's request, so they can negotiate on behalf of viewing

## Implementation Status

- ✅ Backend endpoints created
- ✅ API methods added
- ✅ NegotiationModal component created
- ✅ Award page created
- ✅ Award route added to App.tsx
- ✅ Buyer FarmerListingDetail updated
- ⏳ Buyer ProcurementRequestDetail - needs update
- ⏳ Farmer ListingDetail - needs update
- ⏳ Farmer ProcurementRequestDetail - needs update

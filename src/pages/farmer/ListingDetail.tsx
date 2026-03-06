import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Package, MessageSquare, Award, X, User } from 'lucide-react'
import { apiService } from '../../services/api'
import StatusWorkflow from '../../components/StatusWorkflow'
import NegotiationModal from '../../components/NegotiationModal'

const ListingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCounterModal, setShowCounterModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [counterPrice, setCounterPrice] = useState('')
  const [counterMessage, setCounterMessage] = useState('')
  const [showNegotiateModal, setShowNegotiateModal] = useState(false)

  useEffect(() => {
    loadData()
    updateStatusToInProgress()
  }, [id])

  const updateStatusToInProgress = async () => {
    try {
      await apiService.updateListingStatus(id!, 'in_progress')
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const loadData = async () => {
    try {
      const [listingRes, offersRes] = await Promise.all([
        apiService.getFarmerListing(id!),
        apiService.getOffersForListing(id!)
      ])
      setListing(listingRes.listing)
      setOffers(offersRes.offers || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCounterOffer = async () => {
    if (!selectedOffer || !counterPrice) return

    try {
      await apiService.counterOfferFromFarmer(selectedOffer.id, {
        pricePerUnit: parseFloat(counterPrice),
        message: counterMessage
      })
      setShowCounterModal(false)
      setSelectedOffer(null)
      setCounterPrice('')
      setCounterMessage('')
      await loadData()
    } catch (error) {
      console.error('Failed to submit counter offer:', error)
      alert('Failed to submit counter offer')
    }
  }

  const handleAcceptOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to accept this offer? This will finalize the deal.')) {
      return
    }

    try {
      await apiService.acceptOffer(offerId)
      await loadData()
      alert('Offer accepted successfully!')
    } catch (error) {
      console.error('Failed to accept offer:', error)
      alert('Failed to accept offer')
    }
  }

  const handleNegotiate = async (updates: any) => {
    try {
      await apiService.negotiateListing(id!, updates)
      await loadData()
      alert('Listing updated successfully!')
    } catch (error) {
      console.error('Negotiation failed:', error)
      throw error
    }
  }

  const handleAward = () => {
    // Check if user is authorized to award
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    // Only the farmer (owner) can award their listing
    if (listing?.farmerId !== user.id) {
      alert('Only the listing owner can award this listing')
      return
    }

    // Check if already awarded
    if (listing?.status === 'awarded') {
      alert('This listing has already been awarded')
      return
    }

    navigate(`/award/listing/${id}`)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading...</p>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Listing not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/farmer/my-listings')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to My Listings
        </button>

        {/* Negotiate & Award Buttons */}
        {listing.status !== 'awarded' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNegotiateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Negotiate</span>
            </button>
            {/* Only show award button to listing owner */}
            {listing.farmerId === JSON.parse(localStorage.getItem('user') || '{}').id && (
              <button
                onClick={handleAward}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Award className="h-4 w-4" />
                <span>Award</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Listing Details */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {listing.cropType} {listing.variety && `(${listing.variety})`}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Listing ID: {listing.id}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            listing.status === 'open' ? 'bg-green-100 text-green-800' :
            listing.status === 'negotiating' ? 'bg-yellow-100 text-yellow-800' :
            listing.status === 'awarded' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {listing.status?.replace('_', ' ').toUpperCase() || 'OPEN'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600">Available Quantity</p>
            <p className="font-semibold text-gray-900">{listing.quantity} {listing.quantityUnit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Minimum Price</p>
            <p className="font-semibold text-green-600">₹{listing.minimumPrice}/{listing.quantityUnit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Total Value</p>
            <p className="font-semibold text-gray-900">₹{(listing.quantity * listing.minimumPrice).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Quality Grade</p>
            <p className="font-semibold text-purple-600">Grade {listing.qualityGrade}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">Pickup from: {listing.pickupLocation}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">
              Available from {new Date(listing.availableFrom).toLocaleDateString()}
            </span>
          </div>
        </div>

        {listing.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
            <p className="text-sm text-gray-700">{listing.description}</p>
          </div>
        )}
      </div>

      {/* Status Workflow */}
      <StatusWorkflow currentStatus={listing.status || 'open'} type="listing" />

      {/* Offers Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Received Offers ({offers.length})
          </h2>
          <Package className="h-6 w-6 text-blue-600" />
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No offers received yet</p>
            <p className="text-sm text-gray-500 mt-2">Buyers will see your listing and can make offers</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <h3 className="font-semibold text-gray-900">Buyer: {offer.buyerName || 'Anonymous'}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Submitted {new Date(offer.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    offer.status === 'countered' ? 'bg-orange-100 text-orange-800' :
                    offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {offer.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Offered Price</p>
                    <p className="font-semibold text-blue-600">₹{offer.pricePerUnit}/{listing.quantityUnit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Quantity</p>
                    <p className="font-semibold text-gray-900">{offer.quantity} {listing.quantityUnit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Amount</p>
                    <p className="font-semibold text-gray-900">₹{(offer.pricePerUnit * offer.quantity).toLocaleString()}</p>
                  </div>
                </div>

                {/* Price Comparison */}
                <div className="mb-3 p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Your minimum price:</span>
                    <span className="font-medium text-gray-900">₹{listing.minimumPrice}/{listing.quantityUnit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Buyer's offer:</span>
                    <span className={`font-medium ${offer.pricePerUnit >= listing.minimumPrice ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{offer.pricePerUnit}/{listing.quantityUnit}
                      {offer.pricePerUnit >= listing.minimumPrice ? ' ✓' : ' (Below minimum)'}
                    </span>
                  </div>
                </div>

                {offer.message && (
                  <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs font-medium text-blue-900 mb-1">Buyer's Message:</p>
                    <p className="text-sm text-blue-700">{offer.message}</p>
                  </div>
                )}

                {/* Negotiation History */}
                {offer.negotiationHistory && offer.negotiationHistory.length > 0 && (
                  <div className="mb-3 p-3 bg-orange-50 rounded border border-orange-200">
                    <p className="text-xs font-medium text-orange-900 mb-2">Negotiation History:</p>
                    {offer.negotiationHistory.map((item: any, idx: number) => (
                      <div key={idx} className="text-xs text-orange-700 mb-1">
                        • {item.by === 'farmer' ? 'You' : 'Buyer'} countered: ₹{item.price} - {item.message}
                      </div>
                    ))}
                  </div>
                )}

                {offer.status !== 'accepted' && listing.status !== 'awarded' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedOffer(offer)
                        setCounterPrice(offer.pricePerUnit.toString())
                        setShowCounterModal(true)
                      }}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center justify-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Counter Offer
                    </button>
                    <button
                      onClick={() => handleAcceptOffer(offer.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Accept Offer
                    </button>
                  </div>
                )}

                {offer.status === 'accepted' && (
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm font-medium text-green-900">✓ This offer has been accepted</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Counter Offer Modal */}
      {showCounterModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Counter Offer</h3>
              <button
                onClick={() => {
                  setShowCounterModal(false)
                  setSelectedOffer(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Buyer's Offer: ₹{selectedOffer.pricePerUnit}/{listing.quantityUnit}</p>
                <p className="text-sm text-gray-600 mb-2">Your Minimum: ₹{listing.minimumPrice}/{listing.quantityUnit}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Counter Price (₹/{listing.quantityUnit})
                </label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="input"
                  placeholder="Enter your counter price"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suggest a price between buyer's offer and your minimum
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="Explain your counter offer..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCounterOffer}
                  disabled={!counterPrice}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                >
                  Submit Counter Offer
                </button>
                <button
                  onClick={() => {
                    setShowCounterModal(false)
                    setSelectedOffer(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation Modal */}
      <NegotiationModal
        isOpen={showNegotiateModal}
        onClose={() => setShowNegotiateModal(false)}
        onSubmit={handleNegotiate}
        data={listing}
        type="listing"
      />
    </div>
  )
}

export default ListingDetail

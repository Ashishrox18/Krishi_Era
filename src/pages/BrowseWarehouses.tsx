import { useState, useEffect } from 'react'
import { Search, MapPin, Warehouse, ThermometerSun, Shield, Calendar, DollarSign, Package } from 'lucide-react'
import { apiService } from '../services/api'

interface BookingModalProps {
  facility: any
  onClose: () => void
  onBook: (bookingData: any) => void
}

const BookingModal = ({ facility, onClose, onBook }: BookingModalProps) => {
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    duration: '',
    startDate: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onBook({
      facilityId: facility.id,
      ...formData,
      quantity: parseFloat(formData.quantity),
      duration: parseInt(formData.duration),
    })
  }

  const availableCapacity = facility.capacity - (facility.occupied || 0)
  const estimatedCost = parseFloat(formData.quantity || '0') * 
    (facility.pricing?.pricePerTon || 0) * 
    (parseInt(formData.duration || '0') / 30)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Book Storage</h2>
              <p className="text-gray-600 mt-1">{facility.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="text-2xl">×</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product/Crop Type
              </label>
              <input
                type="text"
                required
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="e.g., Rice, Wheat, Vegetables"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity ({facility.capacityUnit})
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  max={availableCapacity}
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: {availableCapacity} {facility.capacityUnit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (days)
                </label>
                <input
                  type="number"
                  required
                  min={facility.pricing?.minimumPeriod || 1}
                  max={facility.pricing?.maximumPeriod || 365}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Enter days"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Min: {facility.pricing?.minimumPeriod || 1} days
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
              />
            </div>

            {/* Cost Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900">Cost Breakdown</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Rate:</span>
                  <span className="font-medium">₹{facility.pricing?.pricePerTon || 0}/{facility.capacityUnit}/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{formData.quantity || 0} {facility.capacityUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{formData.duration || 0} days</span>
                </div>
                {facility.pricing?.securityDeposit > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit:</span>
                    <span className="font-medium">₹{facility.pricing.securityDeposit}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Estimated Total:</span>
                  <span className="font-bold text-green-600">
                    ₹{(estimatedCost + (facility.pricing?.securityDeposit || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const BrowseWarehouses = () => {
  const [facilities, setFacilities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedFacility, setSelectedFacility] = useState<any>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    loadFacilities()
  }, [])

  const loadFacilities = async () => {
    try {
      const response = await apiService.getAvailableWarehouses()
      setFacilities(response.facilities || [])
    } catch (error) {
      console.error('Failed to load warehouses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async (bookingData: any) => {
    try {
      await apiService.createStorageBooking(bookingData)
      setBookingSuccess(true)
      setSelectedFacility(null)
      setTimeout(() => setBookingSuccess(false), 3000)
      loadFacilities() // Reload to get updated availability
    } catch (error) {
      console.error('Failed to create booking:', error)
      alert('Failed to create booking. Please try again.')
    }
  }

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = !searchTerm || 
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !selectedType || facility.type === selectedType
    const matchesLocation = !selectedLocation || 
      facility.address?.state?.toLowerCase().includes(selectedLocation.toLowerCase())
    
    return matchesSearch && matchesType && matchesLocation
  })

  const uniqueTypes = Array.from(new Set(facilities.map(f => f.type).filter(Boolean)))
  const uniqueStates = Array.from(new Set(facilities.map(f => f.address?.state).filter(Boolean)))

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cold_storage: 'Cold Storage',
      dry_storage: 'Dry Storage',
      controlled_atmosphere: 'Controlled Atmosphere',
      refrigerated: 'Refrigerated',
      general: 'General Warehouse',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Warehouses</h1>
        <p className="text-gray-600 mt-1">Find and book storage facilities for your produce</p>
      </div>

      {bookingSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✓ Booking created successfully!</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or location..."
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <select 
              className="input"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              {uniqueTypes.map((type, index) => (
                <option key={`type-${type}-${index}`} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <select 
              className="input"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All States</option>
              {uniqueStates.map((state, index) => (
                <option key={`state-${state}-${index}`} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Warehouses List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading warehouses...</p>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="card text-center py-12">
          <Warehouse className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Warehouses Available</h3>
          <p className="text-gray-600">
            {searchTerm || selectedType || selectedLocation
              ? 'Try adjusting your filters' 
              : 'No storage facilities are currently listed'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFacilities.map((facility) => {
            const availableCapacity = facility.capacity - (facility.occupied || 0)
            const utilizationPercent = ((facility.occupied || 0) / facility.capacity) * 100

            return (
              <div key={facility.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{facility.name}</h3>
                    <p className="text-sm text-gray-600">{getTypeLabel(facility.type)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    utilizationPercent < 75 ? 'bg-green-100 text-green-800' :
                    utilizationPercent < 90 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {utilizationPercent < 75 ? 'Available' : utilizationPercent < 90 ? 'Limited' : 'Almost Full'}
                  </span>
                </div>

                {facility.address && (
                  <div className="flex items-start space-x-2 mb-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {facility.address.city}, {facility.address.state} - {facility.address.pincode}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Total Capacity</p>
                    <p className="font-semibold text-gray-900">
                      {facility.capacity} {facility.capacityUnit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Available</p>
                    <p className="font-semibold text-green-600">
                      {availableCapacity.toFixed(1)} {facility.capacityUnit}
                    </p>
                  </div>
                  {facility.pricing && (
                    <>
                      <div>
                        <p className="text-xs text-gray-600">Price</p>
                        <p className="font-semibold text-blue-600">
                          ₹{facility.pricing.pricePerTon}/{facility.capacityUnit}/month
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Min Period</p>
                        <p className="font-semibold text-gray-900">
                          {facility.pricing.minimumPeriod} days
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Utilization Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Utilization</span>
                    <span>{utilizationPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        utilizationPercent < 75 ? 'bg-green-600' :
                        utilizationPercent < 90 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>
                </div>

                {/* Features */}
                {facility.features && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {facility.features.temperatureRange && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          <ThermometerSun className="h-3 w-3" />
                          <span>{facility.features.temperatureRange}</span>
                        </span>
                      )}
                      {facility.features.pestControl && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                          Pest Control
                        </span>
                      )}
                      {facility.features.cctvSurveillance && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                          <Shield className="h-3 w-3" />
                          <span>CCTV</span>
                        </span>
                      )}
                      {facility.features.fireProtection && (
                        <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">
                          Fire Protection
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {facility.certifications && facility.certifications.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2">Certifications:</p>
                    <div className="flex flex-wrap gap-2">
                      {facility.certifications.slice(0, 3).map((cert: string) => (
                        <span key={cert} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {cert}
                        </span>
                      ))}
                      {facility.certifications.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{facility.certifications.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedFacility(facility)}
                  disabled={availableCapacity <= 0}
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    availableCapacity > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {availableCapacity > 0 ? 'Book Storage' : 'Fully Booked'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {selectedFacility && (
        <BookingModal
          facility={selectedFacility}
          onClose={() => setSelectedFacility(null)}
          onBook={handleBooking}
        />
      )}
    </div>
  )
}

export default BrowseWarehouses


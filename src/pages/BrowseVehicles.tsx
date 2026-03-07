import { useState, useEffect } from 'react'
import { Truck, MapPin, Package, DollarSign, Phone, User, Search, Filter, X } from 'lucide-react'
import { apiService } from '../services/api'

const BrowseVehicles = () => {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    region: '',
    vehicleType: '',
    minCapacity: '',
    maxPricePerKm: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingData, setBookingData] = useState({
    pickupLocation: '',
    dropLocation: '',
    pickupDate: '',
    estimatedDistance: '',
    cargoDetails: '',
    specialRequirements: ''
  })

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [vehicles, filters])

  const loadVehicles = async () => {
    try {
      const response = await apiService.getAvailableVehicles()
      setVehicles(response.vehicles || [])
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...vehicles]

    if (filters.region) {
      filtered = filtered.filter(v =>
        v.availableRegions?.some((r: string) =>
          r.toLowerCase().includes(filters.region.toLowerCase())
        )
      )
    }

    if (filters.vehicleType) {
      filtered = filtered.filter(v =>
        v.vehicleType?.toLowerCase().includes(filters.vehicleType.toLowerCase())
      )
    }

    if (filters.minCapacity) {
      filtered = filtered.filter(v =>
        parseFloat(v.capacity) >= parseFloat(filters.minCapacity)
      )
    }

    if (filters.maxPricePerKm) {
      filtered = filtered.filter(v =>
        parseFloat(v.pricePerKm) <= parseFloat(filters.maxPricePerKm)
      )
    }

    setFilteredVehicles(filtered)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      region: '',
      vehicleType: '',
      minCapacity: '',
      maxPricePerKm: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  const handleBookVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle)
    setShowBookingModal(true)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const estimatedCost = parseFloat(bookingData.estimatedDistance) * selectedVehicle.pricePerKm
      
      await apiService.bookVehicle({
        vehicleId: selectedVehicle.id,
        transporterId: selectedVehicle.transporterId,
        ...bookingData,
        estimatedCost
      })
      
      alert('Vehicle booked successfully!')
      setShowBookingModal(false)
      setBookingData({
        pickupLocation: '',
        dropLocation: '',
        pickupDate: '',
        estimatedDistance: '',
        cargoDetails: '',
        specialRequirements: ''
      })
      setSelectedVehicle(null)
    } catch (error) {
      console.error('Failed to book vehicle:', error)
      alert('Failed to book vehicle. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading available vehicles...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Transport Vehicles</h1>
          <p className="text-gray-600 mt-1">Find vehicles for your transportation needs</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-primary flex items-center"
        >
          <Filter className="h-5 w-5 mr-2" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Region/City</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  className="input pl-10"
                  placeholder="Search by region"
                />
              </div>
            </div>

            <div>
              <label className="label">Vehicle Type</label>
              <select
                value={filters.vehicleType}
                onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="Mini Truck">Mini Truck</option>
                <option value="Light Truck">Light Truck</option>
                <option value="Medium Truck">Medium Truck</option>
                <option value="Heavy Truck">Heavy Truck</option>
                <option value="Trailer">Trailer</option>
                <option value="Refrigerated">Refrigerated</option>
                <option value="Container">Container</option>
                <option value="Flatbed">Flatbed</option>
              </select>
            </div>

            <div>
              <label className="label">Min Capacity (tons)</label>
              <input
                type="number"
                value={filters.minCapacity}
                onChange={(e) => handleFilterChange('minCapacity', e.target.value)}
                className="input"
                placeholder="e.g., 5"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="label">Max Price/KM (₹)</label>
              <input
                type="number"
                value={filters.maxPricePerKm}
                onChange={(e) => handleFilterChange('maxPricePerKm', e.target.value)}
                className="input"
                placeholder="e.g., 50"
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredVehicles.length} of {vehicles.length} vehicles
        </p>
        {hasActiveFilters && (
          <p className="text-sm text-blue-600">Filters applied</p>
        )}
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="card text-center py-12">
          <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {vehicles.length === 0 ? 'No Vehicles Available' : 'No Vehicles Match Your Filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {vehicles.length === 0 
              ? 'Check back later for available transport vehicles'
              : 'Try adjusting your filters to see more results'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-primary">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedVehicle(vehicle)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.vehicleNumber}</h3>
                    <p className="text-sm text-gray-600">{vehicle.vehicleType}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  Available
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacity:</span>
                  <span className="font-semibold text-gray-900">
                    {vehicle.capacity} {vehicle.capacityUnit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price/km:</span>
                  <span className="font-semibold text-green-600">₹{vehicle.pricePerKm}</span>
                </div>
              </div>

              {vehicle.availableRegions && vehicle.availableRegions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-2 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Available in:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {vehicle.availableRegions.slice(0, 2).map((region: string, idx: number) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {region}
                      </span>
                    ))}
                    {vehicle.availableRegions.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        +{vehicle.availableRegions.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {vehicle.features && vehicle.features.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {vehicle.features.slice(0, 3).map((feature: string, idx: number) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleBookVehicle(vehicle)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Book Vehicle</h2>
                  <p className="text-gray-600">{selectedVehicle.vehicleNumber} - {selectedVehicle.vehicleType}</p>
                </div>
                <button
                  onClick={() => {
                    setShowBookingModal(false)
                    setBookingData({
                      pickupLocation: '',
                      dropLocation: '',
                      pickupDate: '',
                      estimatedDistance: '',
                      cargoDetails: '',
                      specialRequirements: ''
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Pickup Location</label>
                    <input
                      type="text"
                      value={bookingData.pickupLocation}
                      onChange={(e) => setBookingData({...bookingData, pickupLocation: e.target.value})}
                      className="input"
                      placeholder="Enter pickup location"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Drop Location</label>
                    <input
                      type="text"
                      value={bookingData.dropLocation}
                      onChange={(e) => setBookingData({...bookingData, dropLocation: e.target.value})}
                      className="input"
                      placeholder="Enter drop location"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Pickup Date & Time</label>
                    <input
                      type="datetime-local"
                      value={bookingData.pickupDate}
                      onChange={(e) => setBookingData({...bookingData, pickupDate: e.target.value})}
                      className="input"
                      required
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div>
                    <label className="label">Estimated Distance (km)</label>
                    <input
                      type="number"
                      value={bookingData.estimatedDistance}
                      onChange={(e) => setBookingData({...bookingData, estimatedDistance: e.target.value})}
                      className="input"
                      placeholder="Enter distance"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Cargo Details</label>
                  <textarea
                    value={bookingData.cargoDetails}
                    onChange={(e) => setBookingData({...bookingData, cargoDetails: e.target.value})}
                    rows={3}
                    className="input"
                    placeholder="Describe what you're transporting..."
                    required
                  />
                </div>

                <div>
                  <label className="label">Special Requirements (Optional)</label>
                  <textarea
                    value={bookingData.specialRequirements}
                    onChange={(e) => setBookingData({...bookingData, specialRequirements: e.target.value})}
                    rows={2}
                    className="input"
                    placeholder="Any special handling or requirements..."
                  />
                </div>

                {bookingData.estimatedDistance && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Estimated Cost:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{(parseFloat(bookingData.estimatedDistance) * selectedVehicle.pricePerKm).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {bookingData.estimatedDistance} km × ₹{selectedVehicle.pricePerKm}/km
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Confirm Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false)
                      setBookingData({
                        pickupLocation: '',
                        dropLocation: '',
                        pickupDate: '',
                        estimatedDistance: '',
                        cargoDetails: '',
                        specialRequirements: ''
                      })
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Detail Modal */}
      {selectedVehicle && !showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedVehicle.vehicleNumber}</h2>
                  <p className="text-gray-600">{selectedVehicle.vehicleType}</p>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">Capacity</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedVehicle.capacity} {selectedVehicle.capacityUnit}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 mb-2" />
                  <p className="text-sm text-gray-600">Price per KM</p>
                  <p className="text-xl font-bold text-green-600">₹{selectedVehicle.pricePerKm}</p>
                </div>
              </div>

              {selectedVehicle.availableRegions && selectedVehicle.availableRegions.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Available Regions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVehicle.availableRegions.map((region: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedVehicle.features && selectedVehicle.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedVehicle.features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Driver Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{selectedVehicle.driverName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${selectedVehicle.driverContact}`} className="text-sm text-blue-600 hover:text-blue-700">
                      {selectedVehicle.driverContact}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Certifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Insurance</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedVehicle.insuranceValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedVehicle.insuranceValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Pollution Certificate</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedVehicle.pollutionCertValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedVehicle.pollutionCertValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Fitness Certificate</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedVehicle.fitnessValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedVehicle.fitnessValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedVehicle.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Additional Information</h3>
                  <p className="text-sm text-gray-700">{selectedVehicle.description}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => handleBookVehicle(selectedVehicle)}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-medium"
                >
                  Book Vehicle
                </button>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrowseVehicles


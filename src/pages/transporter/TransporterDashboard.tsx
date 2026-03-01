import { Truck, MapPin, Clock, DollarSign, Plus, Calendar, User, Package } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'

const TransporterDashboard = () => {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [stats, setStats] = useState({
    activeShipments: 0,
    monthlyRevenue: 0,
    totalDistance: 0,
    deliveryRate: 0
  })
  const [loading, setLoading] = useState(true)
  const userName = localStorage.getItem('userName') || 'Transporter'

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [vehiclesData, statsData, bookingsData] = await Promise.all([
        apiService.getMyVehicles(),
        apiService.getTransporterStats(),
        apiService.getTransporterBookings()
      ])
      
      setVehicles(vehiclesData.vehicles || [])
      setStats(statsData || stats)
      setBookings(bookingsData.bookings || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, status)
      await loadDashboardData()
      alert(`Booking ${status} successfully!`)
    } catch (error) {
      console.error('Failed to update booking:', error)
      alert('Failed to update booking status')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transporter Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {userName}</p>
        </div>
        <Link to="/transporter/list-vehicle" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          List Vehicle
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₹{(stats.monthlyRevenue / 100000).toFixed(1)}L</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Distance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDistance.toLocaleString()} km</p>
            </div>
            <MapPin className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate}%</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">My Vehicles</h2>
          {vehicles.length === 0 && (
            <Link to="/transporter/list-vehicle" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              + Add Vehicle
            </Link>
          )}
        </div>
        
        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles Listed</h3>
            <p className="text-gray-600 mb-6">Start by listing your first vehicle</p>
            <Link to="/transporter/list-vehicle" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              List Your First Vehicle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{vehicle.vehicleNumber}</p>
                    <p className="text-sm text-gray-600">{vehicle.vehicleType}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                    vehicle.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {vehicle.status === 'available' ? 'Available' :
                     vehicle.status === 'in_use' ? 'In Use' : 
                     vehicle.status === 'maintenance' ? 'Maintenance' : vehicle.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium text-gray-900">{vehicle.capacity} {vehicle.capacityUnit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Price/km:</span>
                    <span className="font-medium text-green-600">₹{vehicle.pricePerKm}</span>
                  </div>
                </div>

                {vehicle.availableRegions && vehicle.availableRegions.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Available in:</p>
                    <div className="flex flex-wrap gap-1">
                      {vehicle.availableRegions.slice(0, 3).map((region: string, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {region}
                        </span>
                      ))}
                      {vehicle.availableRegions.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          +{vehicle.availableRegions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {vehicle.features && vehicle.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {vehicle.features.slice(0, 2).map((feature: string, idx: number) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookings Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Bookings</h2>
        
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {booking.pickupLocation} → {booking.dropLocation}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.pickupDate).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Distance</p>
                    <p className="font-medium text-gray-900">{booking.estimatedDistance} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Cost</p>
                    <p className="font-medium text-green-600">₹{booking.estimatedCost?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Booked By</p>
                    <p className="font-medium text-gray-900 capitalize">{booking.bookerRole}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Cargo</p>
                    <p className="font-medium text-gray-900 truncate">{booking.cargoDetails}</p>
                  </div>
                </div>

                {booking.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TransporterDashboard

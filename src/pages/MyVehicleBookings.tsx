import { useState, useEffect } from 'react'
import { Truck, MapPin, Calendar, Package, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { apiService } from '../services/api'

const MyVehicleBookings = () => {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const response = await apiService.getMyVehicleBookings()
      setBookings(response.bookings || [])
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting for transporter to accept'
      case 'confirmed':
        return 'Booking confirmed by transporter'
      case 'completed':
        return 'Trip completed'
      case 'rejected':
        return 'Booking rejected by transporter'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading your bookings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Vehicle Bookings</h1>
        <p className="text-gray-600 mt-1">Track your transport bookings</p>
      </div>

      {bookings.length === 0 ? (
        <div className="card text-center py-12">
          <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
          <p className="text-gray-600 mb-6">You haven't booked any vehicles</p>
          <a href="/vehicles" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Browse Vehicles
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {booking.pickupLocation} → {booking.dropLocation}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Booking ID: {booking.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(booking.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-xs text-gray-600">Pickup Date</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    {new Date(booking.pickupDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(booking.pickupDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="text-xs text-gray-600">Distance</p>
                  </div>
                  <p className="font-medium text-gray-900">{booking.estimatedDistance} km</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <p className="text-xs text-gray-600">Estimated Cost</p>
                  </div>
                  <p className="font-medium text-green-600">₹{booking.estimatedCost?.toLocaleString()}</p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="h-4 w-4 text-gray-400" />
                    <p className="text-xs text-gray-600">Cargo</p>
                  </div>
                  <p className="font-medium text-gray-900 truncate">{booking.cargoDetails}</p>
                </div>
              </div>

              {booking.specialRequirements && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Special Requirements:</p>
                  <p className="text-sm text-gray-900">{booking.specialRequirements}</p>
                </div>
              )}

              <div className={`p-3 rounded-lg flex items-start space-x-2 ${
                booking.status === 'pending' ? 'bg-yellow-50' :
                booking.status === 'confirmed' ? 'bg-green-50' :
                booking.status === 'completed' ? 'bg-blue-50' :
                'bg-red-50'
              }`}>
                <AlertCircle className={`h-5 w-5 mt-0.5 ${
                  booking.status === 'pending' ? 'text-yellow-600' :
                  booking.status === 'confirmed' ? 'text-green-600' :
                  booking.status === 'completed' ? 'text-blue-600' :
                  'text-red-600'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    booking.status === 'pending' ? 'text-yellow-900' :
                    booking.status === 'confirmed' ? 'text-green-900' :
                    booking.status === 'completed' ? 'text-blue-900' :
                    'text-red-900'
                  }`}>
                    {getStatusMessage(booking.status)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Booked on {new Date(booking.createdAt).toLocaleDateString()} at {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyVehicleBookings

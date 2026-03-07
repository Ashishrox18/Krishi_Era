import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Calendar, Package, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, X, Phone, Mail, User } from 'lucide-react';
import { apiService } from '../services/api';

export default function MyVehicleBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'rejected'>('all');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching vehicle bookings...');
      const response = await apiService.getMyVehicleBookings();
      console.log('Vehicle bookings response:', response);
      setBookings(response.bookings || []);
    } catch (error: any) {
      console.error('Failed to load vehicle bookings:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status?.toLowerCase() === filter;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status?.toLowerCase() === 'pending').length,
    confirmed: bookings.filter(b => b.status?.toLowerCase() === 'confirmed').length,
    completed: bookings.filter(b => b.status?.toLowerCase() === 'completed').length,
    rejected: bookings.filter(b => b.status?.toLowerCase() === 'rejected' || b.status?.toLowerCase() === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Vehicle Bookings</h1>
          <p className="text-gray-600 mt-1">View and manage your transport bookings</p>
        </div>
        <Link to="/vehicles" className="btn-primary">
          Browse Vehicles
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            filter === 'pending'
              ? 'border-yellow-600 text-yellow-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({stats.pending})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            filter === 'confirmed'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Confirmed ({stats.confirmed})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            filter === 'completed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed ({stats.completed})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            filter === 'rejected'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Rejected ({stats.rejected})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your bookings...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 card">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Bookings</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={loadBookings} className="btn-primary inline-block">
            Try Again
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 card">
          <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Start by browsing available vehicles and make your first booking'
              : `You don't have any ${filter} bookings at the moment`
            }
          </p>
          {filter === 'all' && (
            <Link to="/vehicles" className="btn-primary inline-block">
              Browse Vehicles
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="card hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.pickupLocation} → {booking.dropLocation}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Booking ID: {booking.id?.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
                {getStatusIcon(booking.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Pickup Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(booking.pickupDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(booking.pickupDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="font-medium text-gray-900">{booking.estimatedDistance || 'N/A'} km</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Cargo</p>
                    <p className="font-medium text-gray-900">{booking.cargoDetails || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Estimated Cost</p>
                    <p className="font-medium text-gray-900">₹{booking.estimatedCost?.toLocaleString('en-IN') || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {booking.specialRequirements && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Special Requirements:</span> {booking.specialRequirements}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Booked on {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                </p>
                <div className="flex space-x-2">
                  {booking.status?.toLowerCase() === 'confirmed' && (
                    <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                      Track Vehicle
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedBooking(booking)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedBooking.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  ID: {selectedBooking.id?.substring(0, 8)}
                </p>
              </div>

              {/* Route Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Route Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Pickup Location</p>
                    <p className="font-medium text-gray-900">{selectedBooking.pickupLocation}</p>
                  </div>
                  <div className="border-l-2 border-blue-300 pl-4 ml-2">
                    <p className="text-xs text-gray-600">Drop Location</p>
                    <p className="font-medium text-gray-900">{selectedBooking.dropLocation}</p>
                  </div>
                  {selectedBooking.estimatedDistance && (
                    <div className="pt-2 border-t border-blue-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Distance:</span> {selectedBooking.estimatedDistance} km
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                    Pickup Schedule
                  </h3>
                  <p className="text-sm text-gray-700">
                    {new Date(selectedBooking.pickupDate).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {new Date(selectedBooking.pickupDate).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
                    Cost Estimate
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{selectedBooking.estimatedCost?.toLocaleString('en-IN') || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Estimated total cost</p>
                </div>
              </div>

              {/* Cargo Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-gray-600" />
                  Cargo Information
                </h3>
                <p className="text-sm text-gray-700">{selectedBooking.cargoDetails || 'No cargo details provided'}</p>
                {selectedBooking.specialRequirements && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Special Requirements</p>
                    <p className="text-sm text-gray-700">{selectedBooking.specialRequirements}</p>
                  </div>
                )}
              </div>

              {/* Vehicle Details */}
              {selectedBooking.vehicle && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-gray-600" />
                    Vehicle Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Type</p>
                      <p className="font-medium text-gray-900">{selectedBooking.vehicle.type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Capacity</p>
                      <p className="font-medium text-gray-900">{selectedBooking.vehicle.capacity || 'N/A'}</p>
                    </div>
                    {selectedBooking.vehicle.registrationNumber && (
                      <div>
                        <p className="text-gray-600">Registration</p>
                        <p className="font-medium text-gray-900">{selectedBooking.vehicle.registrationNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transporter Details */}
              {selectedBooking.transporter && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2 text-gray-600" />
                    Transporter Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium text-gray-900">{selectedBooking.transporter.name || 'N/A'}</span>
                    </div>
                    {selectedBooking.transporter.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <a href={`tel:${selectedBooking.transporter.phone}`} className="text-blue-600 hover:underline">
                          {selectedBooking.transporter.phone}
                        </a>
                      </div>
                    )}
                    {selectedBooking.transporter.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <a href={`mailto:${selectedBooking.transporter.email}`} className="text-blue-600 hover:underline">
                          {selectedBooking.transporter.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Booking Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking Created</span>
                    <span className="font-medium text-gray-900">
                      {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </span>
                  </div>
                  {selectedBooking.updatedAt && selectedBooking.updatedAt !== selectedBooking.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="font-medium text-gray-900">
                        {new Date(selectedBooking.updatedAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                Close
              </button>
              {selectedBooking.status?.toLowerCase() === 'confirmed' && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Track Vehicle
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

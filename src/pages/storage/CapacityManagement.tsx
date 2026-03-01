import { Package, Calendar, AlertCircle } from 'lucide-react'

const CapacityManagement = () => {
  const bookings = [
    {
      id: 'BKG-001',
      product: 'Rice',
      quantity: '50 tons',
      farmer: 'Rajesh Kumar',
      facility: 'Warehouse B',
      startDate: '2026-03-01',
      endDate: '2026-04-15',
      duration: '45 days',
      status: 'active',
      conditions: { temp: '25°C', humidity: '60%' },
    },
    {
      id: 'BKG-002',
      product: 'Wheat',
      quantity: '30 tons',
      farmer: 'Priya Sharma',
      facility: 'Warehouse B',
      startDate: '2026-02-20',
      endDate: '2026-03-20',
      duration: '30 days',
      status: 'active',
      conditions: { temp: '25°C', humidity: '55%' },
    },
    {
      id: 'BKG-003',
      product: 'Vegetables',
      quantity: '20 tons',
      farmer: 'Amit Patel',
      facility: 'Cold Storage A',
      startDate: '2026-03-05',
      endDate: '2026-03-12',
      duration: '7 days',
      status: 'pending',
      conditions: { temp: '4°C', humidity: '85%' },
    },
  ]

  const requests = [
    {
      id: 'REQ-001',
      product: 'Cotton',
      quantity: '40 tons',
      farmer: 'Suresh Reddy',
      duration: '60 days',
      requirements: 'Dry storage, pest control',
      matchScore: 95,
    },
    {
      id: 'REQ-002',
      product: 'Fruits',
      quantity: '15 tons',
      farmer: 'Lakshmi Iyer',
      duration: '10 days',
      requirements: 'Cold storage, 2-4°C',
      matchScore: 88,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Capacity Management</h1>
        <p className="text-gray-600 mt-1">Manage bookings and optimize storage allocation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">Active Bookings</p>
          <p className="text-3xl font-bold text-gray-900">2</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Pending Requests</p>
          <p className="text-3xl font-bold text-yellow-600">2</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Available Capacity</p>
          <p className="text-3xl font-bold text-green-600">445 tons</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Bookings</h2>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center space-x-3">
                    <p className="font-semibold text-gray-900">{booking.id}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      booking.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {booking.product} • {booking.quantity} • {booking.farmer}
                  </p>
                </div>
                <button className="btn-secondary text-sm">View Details</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-600">Facility</p>
                  <p className="font-semibold text-gray-900">{booking.facility}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{booking.duration}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Temperature</p>
                  <p className="font-semibold text-gray-900">{booking.conditions.temp}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Humidity</p>
                  <p className="font-semibold text-gray-900">{booking.conditions.humidity}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{booking.startDate} to {booking.endDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Storage Requests</h2>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{request.id}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {request.product} • {request.quantity} • {request.duration}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right mr-3">
                    <p className="text-xs text-gray-600">Match Score</p>
                    <p className="text-lg font-bold text-primary-600">{request.matchScore}%</p>
                  </div>
                  <button className="btn-primary text-sm">Accept</button>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-1">Requirements</p>
                <p className="text-sm text-gray-900">{request.requirements}</p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Package className="h-4 w-4" />
                <span>From: {request.farmer}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-orange-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Capacity Alert</h3>
            <p className="text-sm text-gray-700">
              Cold Storage Unit C is at 95% capacity. Consider accepting requests for other facilities or plan for expansion.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CapacityManagement

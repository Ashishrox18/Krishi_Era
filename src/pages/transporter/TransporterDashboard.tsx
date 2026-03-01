import { Truck, MapPin, Clock, DollarSign } from 'lucide-react'

const TransporterDashboard = () => {
  const activeShipments = [
    {
      id: 'SHP-001',
      from: 'Punjab',
      to: 'Delhi',
      product: 'Rice - 10 tons',
      status: 'In Transit',
      progress: 65,
      eta: '2 hours',
      distance: '45 km remaining',
    },
    {
      id: 'SHP-002',
      from: 'Haryana',
      to: 'Chandigarh',
      product: 'Wheat - 5 tons',
      status: 'Loading',
      progress: 10,
      eta: '4 hours',
      distance: '120 km',
    },
  ]

  const vehicles = [
    { id: 'TRK-001', type: 'Heavy Truck', capacity: '20 tons', status: 'In Use', location: 'En route to Delhi' },
    { id: 'TRK-002', type: 'Medium Truck', capacity: '10 tons', status: 'Available', location: 'Depot - Chandigarh' },
    { id: 'TRK-003', type: 'Light Truck', capacity: '5 tons', status: 'Maintenance', location: 'Service Center' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transporter Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, Swift Logistics</p>
        </div>
        <button className="btn-primary">View Available Loads</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Shipments</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₹12.5L</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Distance</p>
              <p className="text-2xl font-bold text-gray-900">3,450 km</p>
            </div>
            <MapPin className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Delivery</p>
              <p className="text-2xl font-bold text-gray-900">98%</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Shipments</h2>
          <div className="space-y-4">
            {activeShipments.map((shipment) => (
              <div key={shipment.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{shipment.id}</p>
                    <p className="text-sm text-gray-600">{shipment.product}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {shipment.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{shipment.from} → {shipment.to}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{shipment.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${shipment.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ETA: {shipment.eta}</span>
                  <span className="text-gray-600">{shipment.distance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fleet Status</h2>
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{vehicle.id}</p>
                    <p className="text-sm text-gray-600">{vehicle.type} • {vehicle.capacity}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    vehicle.status === 'Available' ? 'bg-green-100 text-green-800' :
                    vehicle.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {vehicle.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{vehicle.location}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransporterDashboard

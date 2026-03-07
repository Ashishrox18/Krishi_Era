import { MapPin, TrendingDown, Clock, Fuel } from 'lucide-react'

const RouteOptimization = () => {
  const routes = [
    {
      id: 'ROUTE-001',
      shipments: ['SHP-001', 'SHP-003', 'SHP-005'],
      from: 'Punjab',
      stops: ['Chandigarh', 'Delhi', 'Gurgaon'],
      distance: '245 km',
      duration: '5.5 hours',
      fuelCost: '₹3,200',
      revenue: '₹18,500',
      profit: '₹15,300',
      optimization: 'Consolidated 3 shipments, saved 45 km',
      recommended: true,
    },
    {
      id: 'ROUTE-002',
      shipments: ['SHP-002', 'SHP-004'],
      from: 'Haryana',
      stops: ['Rohtak', 'Delhi'],
      distance: '120 km',
      duration: '2.5 hours',
      fuelCost: '₹1,600',
      revenue: '₹9,500',
      profit: '₹7,900',
      optimization: 'Optimal route with minimal detours',
      recommended: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Route Optimization</h1>
        <p className="text-gray-600 mt-1">AI-optimized routes for maximum efficiency</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <TrendingDown className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Distance Saved</p>
              <p className="text-2xl font-bold text-gray-900">45 km</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900">1.5 hrs</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <Fuel className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Fuel Saved</p>
              <p className="text-2xl font-bold text-gray-900">₹1,200</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <TrendingDown className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">CO₂ Reduced</p>
              <p className="text-2xl font-bold text-gray-900">35 kg</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {routes.map((route) => (
          <div key={route.id} className={`card ${route.recommended ? 'ring-2 ring-primary-500' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold text-gray-900">{route.id}</h3>
                  {route.recommended && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {route.shipments.length} shipments consolidated
                </p>
              </div>
              <button className="btn-primary">Accept Route</button>
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{route.from}</span>
                {route.stops.map((stop, index) => (
                  <span key={index}>
                    → <span className="font-medium">{stop}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Distance</p>
                <p className="font-semibold text-gray-900">{route.distance}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Duration</p>
                <p className="font-semibold text-gray-900">{route.duration}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Fuel Cost</p>
                <p className="font-semibold text-gray-900">{route.fuelCost}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="font-semibold text-primary-600">{route.revenue}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Profit</p>
                <p className="font-semibold text-green-600">{route.profit}</p>
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg flex items-start space-x-2">
              <TrendingDown className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Optimization Benefit</p>
                <p className="text-sm text-green-700">{route.optimization}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Loads</h2>
        <p className="text-sm text-gray-600 mb-4">
          5 new shipment requests available in your area. Accept loads to optimize your routes further.
        </p>
        <button className="btn-primary">View Available Loads</button>
      </div>
    </div>
  )
}

export default RouteOptimization


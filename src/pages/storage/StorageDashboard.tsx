import { useState, useEffect } from 'react'
import { Warehouse, Package, ThermometerSun, AlertTriangle, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'

const StorageDashboard = () => {
  const [facilities, setFacilities] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalCapacity: 0,
    occupied: 0,
    utilization: 0,
    activeAlerts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await apiService.getStorageDashboard()
      setStats(response.stats)
      setFacilities(response.facilities || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const getStatusFromUtilization = (utilization: number) => {
    if (utilization >= 90) return 'warning'
    if (utilization >= 75) return 'caution'
    return 'optimal'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your warehouse facilities</p>
        </div>
        <Link
          to="/storage/list-warehouse"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          <span>List Warehouse</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity.toLocaleString()} tons</p>
                </div>
                <Warehouse className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.occupied.toLocaleString()} tons</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.utilization}%</p>
                </div>
                <ThermometerSun className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {facilities.length === 0 ? (
            <div className="card text-center py-12">
              <Warehouse className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Warehouses Listed</h3>
              <p className="text-gray-600 mb-6">
                Start by listing your first warehouse facility
              </p>
              <Link
                to="/storage/list-warehouse"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5" />
                <span>List Your First Warehouse</span>
              </Link>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Facilities</h2>
              <div className="space-y-3">
                {facilities.map((facility) => {
                  const status = getStatusFromUtilization(facility.utilization || 0)
                  return (
                    <div key={facility.id} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{facility.name}</p>
                          <p className="text-sm text-gray-600">{getTypeLabel(facility.type)}</p>
                          {facility.address && (
                            <p className="text-xs text-gray-500 mt-1">
                              {facility.address.city}, {facility.address.state}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          status === 'optimal' ? 'bg-green-100 text-green-800' :
                          status === 'caution' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">Capacity</p>
                          <p className="font-semibold text-gray-900">
                            {facility.capacity} {facility.capacityUnit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Occupied</p>
                          <p className="font-semibold text-gray-900">
                            {facility.occupied || 0} {facility.capacityUnit}
                          </p>
                        </div>
                        {facility.features?.temperatureRange && (
                          <div>
                            <p className="text-xs text-gray-600">Temperature</p>
                            <p className="font-semibold text-gray-900">{facility.features.temperatureRange}</p>
                          </div>
                        )}
                        {facility.features?.humidityRange && (
                          <div>
                            <p className="text-xs text-gray-600">Humidity</p>
                            <p className="font-semibold text-gray-900">{facility.features.humidityRange}</p>
                          </div>
                        )}
                        {facility.pricing && (
                          <div>
                            <p className="text-xs text-gray-600">Price/Ton</p>
                            <p className="font-semibold text-green-600">₹{facility.pricing.pricePerTon}/month</p>
                          </div>
                        )}
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Utilization</span>
                          <span className="font-medium text-gray-900">{facility.utilization || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              (facility.utilization || 0) > 90 ? 'bg-red-600' :
                              (facility.utilization || 0) > 75 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}
                            style={{ width: `${facility.utilization || 0}%` }}
                          />
                        </div>
                      </div>
                      {facility.certifications && facility.certifications.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {facility.certifications.slice(0, 3).map((cert: string) => (
                            <span key={cert} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {cert}
                            </span>
                          ))}
                          {facility.certifications.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{facility.certifications.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default StorageDashboard


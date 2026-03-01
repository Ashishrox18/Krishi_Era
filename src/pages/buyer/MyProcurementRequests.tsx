import { Package, MapPin, Calendar, Edit2, Trash2, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'

const MyProcurementRequests = () => {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const response = await apiService.getMyProcurementRequests()
      setRequests(response.requests || [])
    } catch (error) {
      console.error('Failed to load procurement requests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading your procurement requests...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Procurement Requests</h1>
          <p className="text-gray-600 mt-1">Manage your procurement requests and view quotes</p>
        </div>
        <Link
          to="/buyer/create-procurement-request"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Create New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Procurement Requests Yet</h3>
          <p className="text-gray-600 mb-6">Create your first procurement request to get quotes from farmers</p>
          <Link
            to="/buyer/create-procurement-request"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {request.cropType} {request.variety && `(${request.variety})`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Created {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'open' ? 'bg-green-100 text-green-800' :
                    request.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {request.status}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    Grade {request.qualityGrade}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Quantity Needed</p>
                  <p className="font-semibold text-gray-900">
                    {request.quantity} {request.quantityUnit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Max Price</p>
                  <p className="font-semibold text-blue-600">
                    ₹{request.maxPricePerUnit}/{request.quantityUnit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Budget</p>
                  <p className="font-semibold text-gray-900">
                    ₹{(request.quantity * request.maxPricePerUnit).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Quotes Received</p>
                  <p className="font-semibold text-green-600">
                    {request.quotesCount || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{request.deliveryLocation}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Required by {new Date(request.requiredBy).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {request.description && (
                <p className="text-sm text-gray-600 mb-4">{request.description}</p>
              )}

              {request.currentBestQuote > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-900">
                      Best Quote: ₹{request.currentBestQuote}/{request.quantityUnit}
                    </p>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Link
                  to={`/buyer/procurement-request/${request.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  View Details & Quotes ({request.quotesCount || 0})
                </Link>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Close Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyProcurementRequests

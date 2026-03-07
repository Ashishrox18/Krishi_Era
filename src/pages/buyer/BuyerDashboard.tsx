import { ShoppingCart, Package, TrendingUp, Clock, Plus, List } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'

const BuyerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [procurementRequests, setProcurementRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<any[]>([]);

  useEffect(() => {
    // Get user from localStorage
    const userData = sessionStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [requestsResponse, pricesResponse] = await Promise.all([
        apiService.getMyProcurementRequests(),
        apiService.getPriceTrends().catch(() => ({ trends: [] }))
      ]);
      
      setProcurementRequests(requestsResponse.requests || []);
      setPriceData(pricesResponse.trends || [
        { month: 'Jan', rice: 22000, wheat: 24000 },
        { month: 'Feb', rice: 23000, wheat: 25000 },
        { month: 'Mar', rice: 21500, wheat: 24500 },
        { month: 'Apr', rice: 22500, wheat: 26000 },
        { month: 'May', rice: 24000, wheat: 27000 },
        { month: 'Jun', rice: 23500, wheat: 25500 },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const activeOrders = procurementRequests.filter(r => 
    r.status === 'in_progress' || r.status === 'negotiating' || r.status === 'accepted'
  );
  const totalVolume = procurementRequests.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalValue = procurementRequests.reduce((sum, r) => 
    sum + ((r.quantity || 0) * (r.targetPrice || 0)), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Buyer'}! Manage your procurement and orders</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/buyer/create-procurement-request"
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Float a Tender</h3>
              <p className="text-blue-100 text-sm">Create a procurement request and receive competitive quotes from farmers</p>
            </div>
            <Plus className="h-12 w-12 opacity-80" />
          </div>
        </Link>

        <Link
          to="/buyer/procurement"
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Browse Farmer Listings</h3>
              <p className="text-green-100 text-sm">View available produce from farmers and place orders directly</p>
            </div>
            <List className="h-12 w-12 opacity-80" />
          </div>
        </Link>

        <Link
          to="/buyer/my-procurement-requests"
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">My Procurement Requests</h3>
              <p className="text-purple-100 text-sm">View and manage your procurement requests and quotes</p>
            </div>
            <Package className="h-12 w-12 opacity-80" />
          </div>
        </Link>

        <Link
          to="/invoices"
          className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg shadow-lg p-6 text-white hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">View Invoices</h3>
              <p className="text-gray-100 text-sm">Manage your invoices and payment records</p>
            </div>
            <ShoppingCart className="h-12 w-12 opacity-80" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Requests</p>
              <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{(totalValue / 100000).toFixed(1)}L</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">{totalVolume.toFixed(0)} {procurementRequests[0]?.quantityUnit || 'quintals'}</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{procurementRequests.length}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rice" fill="#22c55e" />
                <Bar dataKey="wheat" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Procurement Requests</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2 text-sm">Loading requests...</p>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">No active requests</p>
              <Link
                to="/buyer/create-procurement-request"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Create Your First Request
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 3).map((request) => (
                <div key={request.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{request.cropType}</p>
                      <p className="text-sm text-gray-600">{request.quantity} {request.quantityUnit}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'negotiating' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-gray-600">Target: ₹{request.targetPrice}/{request.quantityUnit}</p>
                    <p className="text-gray-900 font-medium">{request.quotesCount || 0} quotes</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuyerDashboard


import { Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

const HarvestManagement = () => {
  const harvests = [
    {
      crop: 'Wheat',
      area: '3 acres',
      status: 'ready',
      daysRemaining: 0,
      expectedYield: '9.6 tons',
      marketPrice: '₹25,000/ton',
      optimalWindow: '5 days',
      recommendation: 'Harvest immediately. Market prices are favorable.',
    },
    {
      crop: 'Rice',
      area: '5 acres',
      status: 'upcoming',
      daysRemaining: 45,
      expectedYield: '22.5 tons',
      marketPrice: '₹22,000/ton',
      optimalWindow: '7 days',
      recommendation: 'Monitor weather. Plan harvest for early morning.',
    },
    {
      crop: 'Cotton',
      area: '4 acres',
      status: 'growing',
      daysRemaining: 120,
      expectedYield: '11.2 tons',
      marketPrice: '₹75,000/ton',
      optimalWindow: '10 days',
      recommendation: 'Continue regular monitoring and pest control.',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Harvest Management</h1>
        <p className="text-gray-600 mt-1">AI-optimized harvest timing and market listing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">Ready to Harvest</p>
          <p className="text-3xl font-bold text-green-600">1</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Upcoming (30 days)</p>
          <p className="text-3xl font-bold text-blue-600">1</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total Expected Yield</p>
          <p className="text-3xl font-bold text-gray-900">43.3 tons</p>
        </div>
      </div>

      <div className="space-y-4">
        {harvests.map((harvest) => (
          <div key={harvest.crop} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold text-gray-900">{harvest.crop}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    harvest.status === 'ready' ? 'bg-green-100 text-green-800' :
                    harvest.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {harvest.status === 'ready' ? 'Ready to Harvest' :
                     harvest.status === 'upcoming' ? 'Upcoming' : 'Growing'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{harvest.area}</p>
              </div>
              {harvest.status === 'ready' && (
                <button className="btn-primary">List for Sale</button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Days Remaining</p>
                <p className="text-lg font-semibold text-gray-900">{harvest.daysRemaining}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Expected Yield</p>
                <p className="text-lg font-semibold text-gray-900">{harvest.expectedYield}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Market Price</p>
                <p className="text-lg font-semibold text-gray-900">{harvest.marketPrice}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Optimal Window</p>
                <p className="text-lg font-semibold text-gray-900">{harvest.optimalWindow}</p>
              </div>
            </div>

            <div className={`p-3 rounded-lg flex items-start space-x-2 ${
              harvest.status === 'ready' ? 'bg-green-50' : 'bg-blue-50'
            }`}>
              {harvest.status === 'ready' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">AI Recommendation</p>
                <p className="text-sm text-gray-700">{harvest.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HarvestManagement

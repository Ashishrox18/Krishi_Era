import { useState } from 'react';
import { Sparkles, TrendingUp, Package, DollarSign, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api';

export default function SellingStrategy() {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);
  const [formData, setFormData] = useState({
    cropType: '',
    expectedYield: '',
    yieldUnit: 'quintals',
    harvestMonth: '',
    currentMarketPrice: '',
    storageAvailable: 'yes',
    location: ''
  });

  const cropTypes = [
    'Wheat', 'Rice', 'Maize', 'Bajra', 'Jowar',
    'Cotton', 'Sugarcane', 'Potato', 'Onion', 'Tomato',
    'Soybean', 'Groundnut', 'Mustard', 'Sunflower', 'Chickpea'
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSellingStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cropType || !formData.expectedYield || !formData.harvestMonth) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getAISellingStrategy({
        cropType: formData.cropType,
        expectedYield: parseFloat(formData.expectedYield),
        yieldUnit: formData.yieldUnit,
        harvestMonth: formData.harvestMonth,
        currentMarketPrice: formData.currentMarketPrice ? parseFloat(formData.currentMarketPrice) : null,
        storageAvailable: formData.storageAvailable === 'yes',
        location: formData.location
      });

      setStrategy(response);
    } catch (error: any) {
      console.error('AI Strategy error:', error);
      alert(error.response?.data?.error || 'Failed to get AI recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStrategy(null);
    setFormData({
      cropType: '',
      expectedYield: '',
      yieldUnit: 'quintals',
      harvestMonth: '',
      currentMarketPrice: '',
      storageAvailable: 'yes',
      location: ''
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">AI Selling Strategy</h1>
        <p className="text-gray-600 mt-2">Get smart recommendations on when and how much to sell for maximum profit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Your Crop Details</h2>
          </div>

          <form onSubmit={getSellingStrategy} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.cropType}
                onChange={(e) => updateField('cropType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select your crop</option>
                {cropTypes.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Yield <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={formData.expectedYield}
                  onChange={(e) => updateField('expectedYield', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter quantity"
                  step="0.01"
                  min="0"
                />
                <select
                  value={formData.yieldUnit}
                  onChange={(e) => updateField('yieldUnit', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="quintals">Quintals</option>
                  <option value="tons">Tons</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Harvest Month <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.harvestMonth}
                onChange={(e) => updateField('harvestMonth', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select month</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Market Price (₹/{formData.yieldUnit})
              </label>
              <input
                type="number"
                value={formData.currentMarketPrice}
                onChange={(e) => updateField('currentMarketPrice', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Optional - helps improve accuracy"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Available?
              </label>
              <select
                value={formData.storageAvailable}
                onChange={(e) => updateField('storageAvailable', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="yes">Yes - I have storage</option>
                <option value="no">No - Must sell immediately</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="District, State (optional)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get AI Strategy
                </span>
              )}
            </button>
          </form>
        </div>

        {/* AI Strategy Results */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Sparkles className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
          </div>

          {!strategy ? (
            <div className="text-center py-12">
              <div className="bg-white/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-12 w-12 text-orange-400" />
              </div>
              <p className="text-gray-600 mb-2">Fill in your crop details</p>
              <p className="text-sm text-gray-500">Get personalized selling strategy based on market trends and price predictions</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Recommendation */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Strategy Summary</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{strategy.summary}</p>
                  </div>
                </div>
              </div>

              {/* Sell Now vs Store Split */}
              {strategy.sellNowPercentage !== undefined && (
                <div className="bg-white rounded-lg p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Recommended Split</h3>
                  
                  <div className="space-y-4">
                    {/* Sell Now */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Sell Immediately</span>
                        <span className="text-lg font-bold text-green-600">{strategy.sellNowPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${strategy.sellNowPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        ≈ {((parseFloat(formData.expectedYield) * strategy.sellNowPercentage) / 100).toFixed(2)} {formData.yieldUnit}
                      </p>
                    </div>

                    {/* Store for Later */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Store for Later</span>
                        <span className="text-lg font-bold text-blue-600">{strategy.storeLaterPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${strategy.storeLaterPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        ≈ {((parseFloat(formData.expectedYield) * strategy.storeLaterPercentage) / 100).toFixed(2)} {formData.yieldUnit}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Predictions */}
              {strategy.pricePredictions && (
                <div className="bg-white rounded-lg p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Price Trend Forecast</h3>
                  <div className="space-y-2">
                    {strategy.pricePredictions.map((pred: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{pred.period}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-900">₹{pred.price}/{formData.yieldUnit}</span>
                          {pred.change && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              pred.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {pred.change > 0 ? '+' : ''}{pred.change}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profit Comparison */}
              {strategy.profitComparison && (
                <div className="bg-white rounded-lg p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Profit Comparison</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sell All Now</span>
                      <span className="text-sm font-semibold text-gray-900">₹{strategy.profitComparison.sellAllNow?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Follow AI Strategy</span>
                      <span className="text-sm font-semibold text-green-600">₹{strategy.profitComparison.followStrategy?.toLocaleString()}</span>
                    </div>
                    {strategy.profitComparison.additionalProfit && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Additional Profit</span>
                          <span className="text-lg font-bold text-green-600">
                            +₹{strategy.profitComparison.additionalProfit?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Insights */}
              {strategy.insights && strategy.insights.length > 0 && (
                <div className="bg-white rounded-lg p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Key Insights</h3>
                  <ul className="space-y-2">
                    {strategy.insights.map((insight: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                        <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confidence Score */}
              {strategy.confidence && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence Score</span>
                    <span className="text-sm font-semibold text-gray-900">{strategy.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${strategy.confidence}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Try Another Crop
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Save Strategy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-gray-900 mb-1">Market Analysis</h3>
          <p className="text-sm text-gray-600">AI analyzes historical price trends and seasonal patterns</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <DollarSign className="h-8 w-8 text-green-600 mb-2" />
          <h3 className="font-semibold text-gray-900 mb-1">Profit Optimization</h3>
          <p className="text-sm text-gray-600">Maximize returns by timing your sales strategically</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <Package className="h-8 w-8 text-orange-600 mb-2" />
          <h3 className="font-semibold text-gray-900 mb-1">Storage Planning</h3>
          <p className="text-sm text-gray-600">Get recommendations on optimal storage duration</p>
        </div>
      </div>
    </div>
  );
}


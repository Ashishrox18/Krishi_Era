import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, DollarSign, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api';

export default function ListProduce() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropType: '',
    variety: '',
    quantity: '',
    quantityUnit: 'quintals',
    qualityGrade: 'A',
    pricePerUnit: '',
    location: '',
    availableFrom: new Date().toISOString().split('T')[0],
    description: '',
    images: [] as string[]
  });

  const cropTypes = [
    'Wheat', 'Rice', 'Maize', 'Bajra', 'Jowar',
    'Cotton', 'Sugarcane', 'Potato', 'Onion', 'Tomato',
    'Soybean', 'Groundnut', 'Mustard', 'Sunflower', 'Chickpea',
    'Lentils', 'Green Gram', 'Black Gram', 'Barley', 'Millet'
  ];

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cropType || !formData.quantity || !formData.pricePerUnit || !formData.location) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.createPurchaseRequest({
        cropType: formData.cropType,
        variety: formData.variety,
        quantity: parseFloat(formData.quantity),
        quantityUnit: formData.quantityUnit,
        qualityGrade: formData.qualityGrade,
        minimumPrice: parseFloat(formData.pricePerUnit),
        expectedPrice: parseFloat(formData.pricePerUnit),
        pickupLocation: formData.location,
        availableFrom: formData.availableFrom,
        description: formData.description
        // Note: status is set by backend to 'released'
      });

      alert('Your produce has been listed successfully! Buyers can now see and quote on it.');
      navigate('/farmer/my-listings');
    } catch (error: any) {
      console.error('List produce error:', error);
      alert(error.response?.data?.error || 'Failed to list produce. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Package className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">List Your Produce</h1>
        <p className="text-gray-600 mt-2">Connect with buyers and get the best price for your harvest</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg">
        <div className="p-6 space-y-6">
          {/* Crop Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-green-600" />
              Crop Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Variety (Optional)
                </label>
                <input
                  type="text"
                  value={formData.variety}
                  onChange={(e) => updateField('variety', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., HD-2967, Basmati"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => updateField('quantity', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter quantity"
                    step="0.01"
                    min="0"
                  />
                  <select
                    value={formData.quantityUnit}
                    onChange={(e) => updateField('quantityUnit', e.target.value)}
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
                  Quality Grade <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.qualityGrade}
                  onChange={(e) => updateField('qualityGrade', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="A">Grade A - Premium Quality</option>
                  <option value="B">Grade B - Good Quality</option>
                  <option value="C">Grade C - Average Quality</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per {formData.quantityUnit} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    required
                    value={formData.pricePerUnit}
                    onChange={(e) => updateField('pricePerUnit', e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your price"
                    step="0.01"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">This is your asking price</p>
              </div>

              <div className="flex items-center justify-center bg-green-50 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{formData.quantity && formData.pricePerUnit 
                      ? (parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)).toLocaleString()
                      : '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Availability */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              Location & Availability
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Village, District, State"
                />
                <p className="text-xs text-gray-500 mt-1">Where buyers can collect the produce</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available From <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.availableFrom}
                  onChange={(e) => updateField('availableFrom', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Add any additional information about your produce (storage conditions, organic certification, etc.)"
            />
          </div>

          {/* Benefits Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
              What happens next?
            </h3>
            <ul className="text-sm text-gray-700 space-y-1 ml-7">
              <li>• Your produce will be visible to all buyers on the platform</li>
              <li>• Buyers can view details and submit quotes</li>
              <li>• You'll receive notifications when buyers make offers</li>
              <li>• You can accept, reject, or negotiate with buyers</li>
              <li>• Once accepted, coordinate pickup and payment</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Listing...' : 'List Produce'}
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Tips for Better Listings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900 mb-1">✓ Set Competitive Prices</p>
            <p>Research current market rates to attract buyers</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">✓ Accurate Quality Grade</p>
            <p>Be honest about quality to build trust</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">✓ Clear Location</p>
            <p>Specify exact pickup location for faster deals</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">✓ Add Details</p>
            <p>More information helps buyers make decisions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

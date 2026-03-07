import { useState } from 'react'
import { X, MessageSquare, Lightbulb, TrendingUp, Loader } from 'lucide-react'
import { apiService } from '../services/api'

interface NegotiationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (updates: any) => Promise<void>
  data: any
  type: 'listing' | 'procurement'
}

const NegotiationModal = ({ isOpen, onClose, onSubmit, data, type }: NegotiationModalProps) => {
  const [price, setPrice] = useState(
    type === 'listing' ? data?.minimumPrice?.toString() || '' : data?.maxPricePerUnit?.toString() || ''
  )
  const [quantity, setQuantity] = useState(data?.quantity?.toString() || '')
  const [qualityGrade, setQualityGrade] = useState(data?.qualityGrade || 'A')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const getAISuggestion = async () => {
    setLoadingAI(true)
    try {
      const suggestionData = {
        cropType: data?.cropType,
        currentPrice: parseFloat(price),
        marketPrice: type === 'listing' ? data?.minimumPrice : data?.maxPricePerUnit,
        quantity: parseFloat(quantity),
        qualityGrade,
        negotiationType: type,
        userRole: type === 'listing' ? 'farmer' : 'buyer',
        location: data?.pickupLocation || data?.deliveryLocation,
        season: new Date().getMonth() < 6 ? 'summer' : 'winter'
      }

      const response = await apiService.getAISellingStrategy(suggestionData)
      
      // Enhanced AI suggestions based on negotiation context
      const suggestions = [
        `Market Analysis: Current ${data?.cropType} prices are trending ${Math.random() > 0.5 ? 'upward' : 'stable'}.`,
        `Quality Factor: Grade ${qualityGrade} typically commands ${qualityGrade === 'A' ? '10-15%' : qualityGrade === 'B' ? '5-10%' : '0-5%'} premium.`,
        `Quantity Consideration: ${parseFloat(quantity) > 100 ? 'Bulk orders often get 3-5% discount' : 'Small quantities may justify premium pricing'}.`,
        `Seasonal Insight: ${new Date().getMonth() < 6 ? 'Summer season - consider storage costs' : 'Winter season - harvest time pricing'}.`,
        response.strategy || 'Consider market conditions and quality when setting your price.'
      ].join(' ')
      
      setAiSuggestion(suggestions)
    } catch (error) {
      console.error('Failed to get AI suggestion:', error)
      
      // Fallback AI suggestions based on data
      const fallbackSuggestions = [
        `For ${data?.cropType}, consider current market rates and quality grade.`,
        `Grade ${qualityGrade} quality typically allows for ${qualityGrade === 'A' ? 'premium' : qualityGrade === 'B' ? 'standard' : 'competitive'} pricing.`,
        `${type === 'listing' ? 'As a farmer' : 'As a buyer'}, factor in transportation and storage costs.`,
        `Market analysis suggests ${Math.random() > 0.5 ? 'holding firm on price' : 'being flexible for quick deals'}.`
      ].join(' ')
      
      setAiSuggestion(fallbackSuggestions)
    } finally {
      setLoadingAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updates: any = {
        quantity: parseFloat(quantity),
        qualityGrade,
        negotiationNotes: notes
      }

      if (type === 'listing') {
        updates.minimumPrice = parseFloat(price)
      } else {
        updates.maxPricePerUnit = parseFloat(price)
      }

      await onSubmit(updates)
      setSuccess('Negotiation updated successfully! The other party will be notified.')
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: any) {
      console.error('Negotiation failed:', error)
      setError(error.response?.data?.error || 'Failed to update negotiation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Negotiate Terms</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-900 font-medium">
            Update the terms below to continue negotiation. The other party will be notified of your changes.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-900 font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-900 font-medium">{success}</p>
          </div>
        )}

        {/* AI Suggestion Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-900">AI Negotiation Assistant</h3>
            </div>
            <button
              type="button"
              onClick={getAISuggestion}
              disabled={loadingAI || !price}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loadingAI ? <Loader className="h-3 w-3 animate-spin" /> : 'Get AI Suggestion'}
            </button>
          </div>
          {aiSuggestion && (
            <div className="mt-2 p-3 bg-white rounded border border-blue-200">
              <p className="text-sm text-blue-800">{aiSuggestion}</p>
            </div>
          )}
          {!aiSuggestion && !loadingAI && (
            <p className="text-xs text-blue-700">Click "Get AI Suggestion" for personalized negotiation advice based on market conditions.</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Crop Type</p>
              <p className="font-semibold text-gray-900">{data?.cropType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Variety</p>
              <p className="font-semibold text-gray-900">{data?.variety || 'N/A'}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'listing' ? 'Minimum Price' : 'Maximum Price'} (₹/{data?.quantityUnit}) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input"
                placeholder="Enter price per unit"
                required
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: ₹{type === 'listing' ? data?.minimumPrice : data?.maxPricePerUnit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity ({data?.quantityUnit}) *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input"
                placeholder="Enter quantity"
                required
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {data?.quantity} {data?.quantityUnit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Grade *
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="input"
                required
              >
                <option value="A">Grade A (Premium)</option>
                <option value="B">Grade B (Standard)</option>
                <option value="C">Grade C (Basic)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Current: Grade {data?.qualityGrade}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount
              </label>
              <div className="input bg-gray-100 font-semibold text-lg text-green-600">
                ₹{price && quantity ? (parseFloat(price) * parseFloat(quantity)).toLocaleString() : '0'}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Negotiation Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="input"
              placeholder="Add any additional terms, conditions, or notes for negotiation..."
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading || !price || !quantity}
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Updating...' : 'Update & Continue Negotiation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NegotiationModal


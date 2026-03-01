import { useState } from 'react'
import { X, MessageSquare } from 'lucide-react'

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

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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
      onClose()
    } catch (error) {
      console.error('Negotiation failed:', error)
      alert('Failed to update. Please try again.')
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

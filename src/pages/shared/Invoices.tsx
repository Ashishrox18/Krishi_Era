import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react'
import { apiService } from '../../services/api'

const Invoices = () => {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const response = await apiService.getInvoices()
      setInvoices(response.invoices || [])
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (invoiceId: string, status: string) => {
    try {
      await apiService.updateInvoiceStatus(invoiceId, { 
        status,
        paymentDate: status === 'paid' ? new Date().toISOString() : undefined
      })
      await loadInvoices()
    } catch (error) {
      console.error('Failed to update invoice status:', error)
      alert('Failed to update invoice status')
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true
    return invoice.status === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const paidAmount = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const pendingAmount = filteredInvoices.filter(i => i.status === 'pending').reduce((sum, invoice) => sum + invoice.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-1">Manage your invoices and payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{filteredInvoices.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{paidAmount.toLocaleString()}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'pending' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'paid' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'overdue' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overdue
          </button>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invoices Found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'No invoices have been generated yet' 
              : `No ${filter} invoices found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Invoice #{invoice.invoiceNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {invoice.invoiceType === 'procurement' ? 'Procurement Contract' :
                         invoice.invoiceType === 'listing' ? 'Produce Sale' :
                         invoice.invoiceType === 'transport' ? 'Transportation Service' :
                         invoice.invoiceType === 'storage' ? 'Storage Service' : 'Service'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(invoice.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Amount</p>
                      <p className="font-semibold text-gray-900">₹{invoice.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Created</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <p className="font-semibold text-gray-900 text-sm">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Due Date</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <p className="font-semibold text-gray-900 text-sm">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Items</p>
                      <p className="font-semibold text-gray-900">{invoice.items.length} item(s)</p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-1">Items:</p>
                    {invoice.items.slice(0, 2).map((item: any, index: number) => (
                      <p key={index} className="text-sm text-gray-700">
                        • {item.description} - {item.quantity} {item.unit} @ ₹{item.pricePerUnit}/{item.unit}
                      </p>
                    ))}
                    {invoice.items.length > 2 && (
                      <p className="text-sm text-gray-500">+ {invoice.items.length - 2} more items</p>
                    )}
                  </div>
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="btn-primary text-center whitespace-nowrap"
                  >
                    View Details
                  </Link>
                  
                  {invoice.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(invoice.id, 'paid')}
                      className="btn-secondary whitespace-nowrap"
                    >
                      Mark as Paid
                    </button>
                  )}
                  
                  <button className="btn-outline whitespace-nowrap flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Invoices
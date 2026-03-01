import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse, MapPin, DollarSign, Thermometer, Package, CheckCircle, ArrowLeft } from 'lucide-react';
import { apiService } from '../../services/api';

export default function ListWarehouse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cold_storage',
    capacity: '',
    capacityUnit: 'tons',
    address: '',
    city: '',
    state: '',
    pincode: '',
    pricePerTon: '',
    pricePerDay: '',
    securityDeposit: '',
    minStoragePeriod: '7',
    maxStoragePeriod: '365',
    temperatureControlled: true,
    temperatureRange: '',
    humidityControlled: true,
    humidityRange: '',
    pestControl: true,
    fireProtection: true,
    cctv: true,
    securityGuard: true,
    loadingUnloading: true,
    palletStorage: false,
    rackStorage: false,
    floorStorage: true,
    certifications: [] as string[],
    suitableFor: [] as string[],
    description: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    operatingHours: '24/7',
    insuranceAvailable: true,
  });

  const warehouseTypes = [
    { value: 'cold_storage', label: 'Cold Storage' },
    { value: 'dry_storage', label: 'Dry Storage' },
    { value: 'controlled_atmosphere', label: 'Controlled Atmosphere' },
    { value: 'refrigerated', label: 'Refrigerated Warehouse' },
    { value: 'general', label: 'General Warehouse' },
  ];

  const certificationOptions = [
    'FSSAI',
    'ISO 9001',
    'ISO 22000',
    'HACCP',
    'GMP',
    'Organic Certified',
    'APEDA',
  ];

  const suitableForOptions = [
    'Grains',
    'Fruits',
    'Vegetables',
    'Dairy Products',
    'Meat & Poultry',
    'Seeds',
    'Pulses',
    'Spices',
    'Processed Foods',
  ];

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: 'certifications' | 'suitableFor', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.capacity || !formData.address || !formData.pricePerTon) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.createFacility({
        name: formData.name,
        type: formData.type,
        capacity: parseFloat(formData.capacity),
        capacityUnit: formData.capacityUnit,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          fullAddress: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`
        },
        pricing: {
          pricePerTon: parseFloat(formData.pricePerTon),
          pricePerDay: parseFloat(formData.pricePerDay) || 0,
          securityDeposit: parseFloat(formData.securityDeposit) || 0,
          minStoragePeriod: parseInt(formData.minStoragePeriod),
          maxStoragePeriod: parseInt(formData.maxStoragePeriod),
        },
        features: {
          temperatureControlled: formData.temperatureControlled,
          temperatureRange: formData.temperatureRange,
          humidityControlled: formData.humidityControlled,
          humidityRange: formData.humidityRange,
          pestControl: formData.pestControl,
          fireProtection: formData.fireProtection,
          cctv: formData.cctv,
          securityGuard: formData.securityGuard,
          loadingUnloading: formData.loadingUnloading,
          palletStorage: formData.palletStorage,
          rackStorage: formData.rackStorage,
          floorStorage: formData.floorStorage,
        },
        certifications: formData.certifications,
        suitableFor: formData.suitableFor,
        description: formData.description,
        contact: {
          person: formData.contactPerson,
          phone: formData.contactPhone,
          email: formData.contactEmail,
        },
        operatingHours: formData.operatingHours,
        insuranceAvailable: formData.insuranceAvailable,
        status: 'active',
        occupied: 0,
        utilization: 0,
      });

      alert('Warehouse listed successfully! Farmers and buyers can now book your facility.');
      navigate('/storage');
    } catch (error: any) {
      console.error('List warehouse error:', error);
      alert(error.response?.data?.error || 'Failed to list warehouse. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/storage')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Warehouse className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">List Your Warehouse</h1>
        <p className="text-gray-600 mt-2">Connect with farmers and buyers who need storage facilities</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg">
        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Warehouse className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="input"
                  placeholder="e.g., AgriStore Cold Storage Unit A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  className="input"
                >
                  {warehouseTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Capacity <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => updateField('capacity', e.target.value)}
                    className="input flex-1"
                    placeholder="500"
                  />
                  <select
                    value={formData.capacityUnit}
                    onChange={(e) => updateField('capacityUnit', e.target.value)}
                    className="input w-32"
                  >
                    <option value="tons">Tons</option>
                    <option value="quintals">Quintals</option>
                    <option value="sqft">Sq. Ft.</option>
                    <option value="sqm">Sq. M.</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Location Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="input"
                  placeholder="Plot No., Street Name, Area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="input"
                  placeholder="Mumbai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="input"
                  placeholder="Maharashtra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => updateField('pincode', e.target.value)}
                  className="input"
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Pricing Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Ton (₹/month) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.pricePerTon}
                  onChange={(e) => updateField('pricePerTon', e.target.value)}
                  className="input"
                  placeholder="2000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Day (₹/ton/day)
                </label>
                <input
                  type="number"
                  value={formData.pricePerDay}
                  onChange={(e) => updateField('pricePerDay', e.target.value)}
                  className="input"
                  placeholder="70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => updateField('securityDeposit', e.target.value)}
                  className="input"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Storage Period (days)
                </label>
                <input
                  type="number"
                  value={formData.minStoragePeriod}
                  onChange={(e) => updateField('minStoragePeriod', e.target.value)}
                  className="input"
                  placeholder="7"
                />
              </div>
            </div>
          </div>

          {/* Temperature & Humidity Control */}
          {(formData.type === 'cold_storage' || formData.type === 'refrigerated' || formData.type === 'controlled_atmosphere') && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Thermometer className="h-5 w-5 mr-2 text-blue-600" />
                Climate Control
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature Range
                  </label>
                  <input
                    type="text"
                    value={formData.temperatureRange}
                    onChange={(e) => updateField('temperatureRange', e.target.value)}
                    className="input"
                    placeholder="2°C to 8°C"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Humidity Range
                  </label>
                  <input
                    type="text"
                    value={formData.humidityRange}
                    onChange={(e) => updateField('humidityRange', e.target.value)}
                    className="input"
                    placeholder="80% to 90%"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Features & Amenities */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
              Features & Amenities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'pestControl', label: 'Pest Control' },
                { key: 'fireProtection', label: 'Fire Protection' },
                { key: 'cctv', label: 'CCTV Surveillance' },
                { key: 'securityGuard', label: 'Security Guard' },
                { key: 'loadingUnloading', label: 'Loading/Unloading' },
                { key: 'palletStorage', label: 'Pallet Storage' },
                { key: 'rackStorage', label: 'Rack Storage' },
                { key: 'floorStorage', label: 'Floor Storage' },
                { key: 'insuranceAvailable', label: 'Insurance Available' },
              ].map(feature => (
                <label key={feature.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[feature.key as keyof typeof formData] as boolean}
                    onChange={(e) => updateField(feature.key, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Certifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {certificationOptions.map(cert => (
                <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.certifications.includes(cert)}
                    onChange={() => toggleArrayField('certifications', cert)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{cert}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Suitable For */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Suitable For
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {suitableForOptions.map(item => (
                <label key={item} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.suitableFor.includes(item)}
                    onChange={() => toggleArrayField('suitableFor', item)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => updateField('contactPerson', e.target.value)}
                  className="input"
                  placeholder="Manager Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  className="input"
                  placeholder="+919876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  className="input"
                  placeholder="contact@warehouse.com"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="input"
              placeholder="Describe your warehouse facilities, special features, accessibility, nearby landmarks, etc."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Required fields
            </p>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Listing Warehouse...' : 'List Warehouse'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

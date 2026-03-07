import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, Sprout, ShoppingCart, Truck, Warehouse, 
  Settings, User, Menu, X, LogOut, UserCircle, Package, Receipt
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import NotificationBell from './NotificationBell'
import NotificationTester from './NotificationTester'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const userData = sessionStorage.getItem('user')
    
    if (!token) {
      navigate('/login')
    } else if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [navigate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  // Get role-specific dashboard path
  const getDashboardPath = () => {
    if (!user?.role) return '/'
    switch (user.role) {
      case 'farmer': return '/farmer'
      case 'buyer': return '/buyer'
      case 'transporter': return '/transporter'
      case 'storage': return '/storage'
      case 'admin': return '/admin'
      default: return '/'
    }
  }

  // Only show Dashboard button - no role-specific navigation
  const navigation = [
    { name: 'Dashboard', href: getDashboardPath(), icon: Home }
  ]

  const isActive = (path: string) => {
    const dashboardPath = getDashboardPath()
    if (path === dashboardPath && location.pathname === dashboardPath) return true
    if (path === '/' || path === dashboardPath) return false
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sprout className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Krishi Era AI</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              {/* User Menu Dropdown */}
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user?.name || 'User'}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-[80vh] overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full capitalize">
                        {user?.role}
                      </span>
                    </div>

                    {/* My Purchases Section */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                          <Receipt className="h-4 w-4 mr-1.5" />
                          My Purchases
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Sales to Buyers */}
                        <Link
                          to="/farmer/my-listings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 rounded-lg transition group"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mr-2">
                              <Package className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">Sales to Buyers</p>
                              <p className="text-xs text-gray-500">View your listings</p>
                            </div>
                          </div>
                          <span className="text-xs text-green-600 font-medium">→</span>
                        </Link>

                        {/* Storage Bookings */}
                        <Link
                          to="/my-storage-bookings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition group"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mr-2">
                              <Warehouse className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">Storage Bookings</p>
                              <p className="text-xs text-gray-500">Warehouse rentals</p>
                            </div>
                          </div>
                          <span className="text-xs text-purple-600 font-medium">→</span>
                        </Link>

                        {/* Transport Bookings */}
                        <Link
                          to="/my-vehicle-bookings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between p-2 bg-amber-50 hover:bg-amber-100 rounded-lg transition group"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-amber-100 group-hover:bg-amber-200 rounded-lg flex items-center justify-center mr-2">
                              <Truck className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">Transport Bookings</p>
                              <p className="text-xs text-gray-500">Vehicle reservations</p>
                            </div>
                          </div>
                          <span className="text-xs text-amber-600 font-medium">→</span>
                        </Link>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate('/profile')
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Update Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <button 
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <nav className="px-4 py-2 space-y-1">
              <div className="px-3 py-2 border-b border-gray-200 mb-2">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full capitalize">
                  {user?.role}
                </span>
              </div>
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}

              {/* My Purchases Section - Mobile */}
              <div className="pt-2 pb-2 border-t border-gray-200 mt-2">
                <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  My Purchases
                </p>
                <Link
                  to="/farmer/my-listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  <Package className="h-4 w-4 mr-2 text-green-600" />
                  Sales to Buyers
                </Link>
                <Link
                  to="/my-storage-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  <Warehouse className="h-4 w-4 mr-2 text-purple-600" />
                  Storage Bookings
                </Link>
                <Link
                  to="/my-vehicle-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  <Truck className="h-4 w-4 mr-2 text-amber-600" />
                  Transport Bookings
                </Link>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/profile')
                }}
                className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                Update Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2026 Krishi Era AI. Empowering rural agriculture through intelligent coordination.
          </p>
        </div>
      </footer>

      {/* Development Tools */}
      <NotificationTester />
    </div>
  )
}

export default Layout


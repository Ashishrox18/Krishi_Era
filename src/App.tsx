import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ProfileUpdate from './pages/ProfileUpdate'
import Dashboard from './pages/Dashboard'
import RoleBasedRedirect from './pages/RoleBasedRedirect'
import Award from './pages/Award'
import FarmerDashboard from './pages/farmer/FarmerDashboard'
import CropPlanning from './pages/farmer/CropPlanning'
import HarvestManagement from './pages/farmer/HarvestManagement'
import SellingStrategy from './pages/farmer/SellingStrategy'
import ListProduce from './pages/farmer/ListProduce'
import MyListings from './pages/farmer/MyListings'
import FarmerOwnListingDetail from './pages/farmer/ListingDetail'
import BrowseProcurementRequests from './pages/farmer/BrowseProcurementRequests'
import BuyerDashboard from './pages/buyer/BuyerDashboard'
import Procurement from './pages/buyer/Procurement'
import QualityInspection from './pages/buyer/QualityInspection'
import CreateProcurementRequest from './pages/buyer/CreateProcurementRequest'
import MyProcurementRequests from './pages/buyer/MyProcurementRequests'
import BuyerProcurementRequestDetail from './pages/buyer/ProcurementRequestDetail'
import BuyerViewFarmerListing from './pages/buyer/FarmerListingDetail'
import FarmerProcurementRequestDetail from './pages/farmer/ProcurementRequestDetail'
import TransporterDashboard from './pages/transporter/TransporterDashboard'
import ListVehicle from './pages/transporter/ListVehicle'
import RouteOptimization from './pages/transporter/RouteOptimization'
import StorageDashboard from './pages/storage/StorageDashboard'
import CapacityManagement from './pages/storage/CapacityManagement'
import ListWarehouse from './pages/storage/ListWarehouse'
import BrowseWarehouses from './pages/BrowseWarehouses'
import BrowseVehicles from './pages/BrowseVehicles'
import MyVehicleBookings from './pages/MyVehicleBookings'
import AdminDashboard from './pages/admin/AdminDashboard'
import SystemMonitoring from './pages/admin/SystemMonitoring'
import Invoices from './pages/shared/Invoices'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<RoleBasedRedirect />} />
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="profile" element={<ProfileUpdate />} />
          
          {/* Farmer Routes */}
          <Route path="farmer">
            <Route index element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <FarmerDashboard />
              </ProtectedRoute>
            } />
            <Route path="crop-planning" element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <CropPlanning />
              </ProtectedRoute>
            } />
            <Route path="harvest" element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <HarvestManagement />
              </ProtectedRoute>
            } />
            <Route path="selling-strategy" element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <SellingStrategy />
              </ProtectedRoute>
            } />
            <Route path="list-produce" element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <ListProduce />
              </ProtectedRoute>
            } />
            <Route path="my-listings" element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <MyListings />
              </ProtectedRoute>
            } />
            <Route path="listing/:id" element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <FarmerOwnListingDetail />
              </ProtectedRoute>
            } />
            <Route path="browse-procurement-requests" element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <BrowseProcurementRequests />
              </ProtectedRoute>
            } />
            <Route path="procurement-request/:id" element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <FarmerProcurementRequestDetail />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Buyer Routes */}
          <Route path="buyer">
            <Route index element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerDashboard />
              </ProtectedRoute>
            } />
            <Route path="procurement" element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <Procurement />
              </ProtectedRoute>
            } />
            <Route path="create-procurement-request" element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <CreateProcurementRequest />
              </ProtectedRoute>
            } />
            <Route path="my-procurement-requests" element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <MyProcurementRequests />
              </ProtectedRoute>
            } />
            <Route path="procurement-request/:id" element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerProcurementRequestDetail />
              </ProtectedRoute>
            } />
            <Route path="farmer-listing/:id" element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerViewFarmerListing />
              </ProtectedRoute>
            } />
            <Route path="quality" element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <QualityInspection />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Transporter Routes */}
          <Route path="transporter">
            <Route index element={
              <ProtectedRoute allowedRoles={['transporter', 'admin']}>
                <TransporterDashboard />
              </ProtectedRoute>
            } />
            <Route path="list-vehicle" element={
              <ProtectedRoute allowedRoles={['transporter', 'admin']}>
                <ListVehicle />
              </ProtectedRoute>
            } />
            <Route path="routes" element={
              <ProtectedRoute allowedRoles={['transporter', 'admin']}>
                <RouteOptimization />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Storage Provider Routes */}
          <Route path="storage">
            <Route index element={
              <ProtectedRoute allowedRoles={['storage', 'admin']}>
                <StorageDashboard />
              </ProtectedRoute>
            } />
            <Route path="list-warehouse" element={
              <ProtectedRoute allowedRoles={['storage', 'admin']}>
                <ListWarehouse />
              </ProtectedRoute>
            } />
            <Route path="capacity" element={
              <ProtectedRoute allowedRoles={['storage', 'admin']}>
                <CapacityManagement />
              </ProtectedRoute>
            } />
          </Route>

          {/* Browse Warehouses - accessible by farmers and buyers */}
          <Route path="warehouses" element={
            <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
              <BrowseWarehouses />
            </ProtectedRoute>
          } />

          <Route path="vehicles" element={
            <ProtectedRoute allowedRoles={['farmer', 'buyer', 'storage', 'admin']}>
              <BrowseVehicles />
            </ProtectedRoute>
          } />

          <Route path="my-vehicle-bookings" element={
            <ProtectedRoute allowedRoles={['farmer', 'buyer', 'storage', 'admin']}>
              <MyVehicleBookings />
            </ProtectedRoute>
          } />

          {/* Invoices - accessible by all user types */}
          <Route path="invoices" element={
            <ProtectedRoute allowedRoles={['farmer', 'buyer', 'transporter', 'storage', 'admin']}>
              <Invoices />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="admin">
            <Route index element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="monitoring" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemMonitoring />
              </ProtectedRoute>
            } />
          </Route>

          {/* Award Route - accessible by both farmers and buyers */}
          <Route path="award/:type/:id" element={
            <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
              <Award />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

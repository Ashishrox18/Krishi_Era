import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { TransporterController } from '../controllers/transporter.controller';

const router = Router();
const controller = new TransporterController();

router.get('/dashboard', authenticate, controller.getDashboard);
router.get('/shipments', authenticate, controller.getShipments);
router.post('/shipments/:id/accept', authenticate, controller.acceptShipment);
router.put('/shipments/:id/status', authenticate, controller.updateShipmentStatus);
router.post('/routes/optimize', authenticate, controller.optimizeRoute);
router.get('/available-loads', authenticate, controller.getAvailableLoads);
router.get('/fleet', authenticate, controller.getFleet);

// Vehicle management routes
router.post('/vehicles', authenticate, controller.listVehicle);
router.get('/vehicles', authenticate, controller.getMyVehicles);
router.get('/vehicles/available', authenticate, controller.getAllAvailableVehicles);
router.get('/stats', authenticate, controller.getTransporterStats);
router.put('/vehicles/:id', authenticate, controller.updateVehicle);
router.delete('/vehicles/:id', authenticate, controller.deleteVehicle);

// Booking routes
router.post('/bookings', authenticate, controller.bookVehicle);
router.get('/my-bookings', authenticate, controller.getMyVehicleBookings);
router.get('/bookings', authenticate, controller.getTransporterBookings);
router.put('/bookings/:id/status', authenticate, controller.updateBookingStatus);

export default router;

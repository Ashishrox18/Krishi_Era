import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { StorageController } from '../controllers/storage.controller';

const router = Router();
const controller = new StorageController();

router.get('/dashboard', authenticate, controller.getDashboard);
router.get('/facilities', authenticate, controller.getFacilities);
router.post('/facilities', authenticate, controller.createFacility);
router.get('/bookings', authenticate, controller.getBookings);
router.post('/bookings', authenticate, controller.createBooking);
router.put('/bookings/:id', authenticate, controller.updateBooking);
router.get('/requests', authenticate, controller.getStorageRequests);
router.post('/requests/:id/accept', authenticate, controller.acceptRequest);
router.get('/iot-data/:facilityId', authenticate, controller.getIoTData);

// Public routes for farmers and buyers to browse warehouses
router.get('/available', authenticate, controller.getAvailableWarehouses);
router.get('/my-bookings', authenticate, controller.getMyBookings);

export default router;

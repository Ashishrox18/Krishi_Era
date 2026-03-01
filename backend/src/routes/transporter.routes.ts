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

export default router;

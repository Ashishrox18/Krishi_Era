import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { OffersController } from '../controllers/offers.controller';

const router = Router();
const controller = new OffersController();

// Update offer (buyer)
router.put('/:offerId', authenticate, controller.updateOffer);

// Accept offer (farmer)
router.post('/:offerId/accept', authenticate, controller.acceptOffer);

// Counter offer (farmer)
router.post('/:offerId/counter', authenticate, controller.counterOffer);

export default router;

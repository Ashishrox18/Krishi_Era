import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { OffersController } from '../controllers/offers.controller';

const router = Router();
const controller = new OffersController();

// Submit offer (buyer)
router.post('/', authenticate, controller.submitOffer);

// Get buyer's own offers
router.get('/my-offers', authenticate, controller.getMyOffers);

// Get offers for listing
router.get('/listing/:listingId', authenticate, controller.getOffersForListing);

// Update offer (buyer)
router.put('/:offerId', authenticate, controller.updateOffer);

// Accept offer (farmer)
router.post('/:offerId/accept', authenticate, controller.acceptOffer);

// Counter offer (farmer)
router.post('/:offerId/counter', authenticate, controller.counterOffer);

export default router;

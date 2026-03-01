import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AIController } from '../controllers/ai.controller';

const router = Router();
const controller = new AIController();

router.post('/crop-recommendations', authenticate, controller.getCropRecommendations);
router.post('/harvest-timing', authenticate, controller.getHarvestTiming);
router.post('/route-optimization', authenticate, controller.optimizeRoute);
router.post('/price-analysis', authenticate, controller.analyzePrices);
router.post('/quality-assessment', authenticate, controller.assessQuality);
router.post('/selling-strategy', authenticate, controller.getSellingStrategy);

export default router;

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { bedrockService } from '../services/aws/bedrock.service';
import { rekognitionService } from '../services/aws/rekognition.service';

export class AIController {
  async getCropRecommendations(req: AuthRequest, res: Response) {
    try {
      const recommendations = await bedrockService.generateCropRecommendations(req.body);
      res.json({ recommendations });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }

  async getHarvestTiming(req: AuthRequest, res: Response) {
    try {
      const recommendation = await bedrockService.generateHarvestRecommendation(req.body);
      res.json({ recommendation });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate harvest timing' });
    }
  }

  async optimizeRoute(req: AuthRequest, res: Response) {
    try {
      const optimization = await bedrockService.optimizeRoute(req.body);
      res.json({ optimization });
    } catch (error) {
      res.status(500).json({ error: 'Failed to optimize route' });
    }
  }

  async analyzePrices(req: AuthRequest, res: Response) {
    try {
      const analysis = await bedrockService.analyzePricetrends(req.body);
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze prices' });
    }
  }

  async assessQuality(req: AuthRequest, res: Response) {
    try {
      const { imageBase64 } = req.body;
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      
      const assessment = await rekognitionService.analyzeQuality(imageBuffer);
      res.json({ assessment });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assess quality' });
    }
  }

  async getSellingStrategy(req: AuthRequest, res: Response) {
    try {
      const {
        cropType,
        expectedYield,
        yieldUnit,
        harvestMonth,
        currentMarketPrice,
        storageAvailable,
        location
      } = req.body;

      console.log(`🌾 AI Selling Strategy Request:`);
      console.log(`   - Crop: ${cropType}`);
      console.log(`   - Expected Yield: ${expectedYield} ${yieldUnit}`);
      console.log(`   - Harvest Month: ${harvestMonth}`);
      console.log(`   - Current Market Price: ${currentMarketPrice || 'Not provided'}`);
      console.log(`   - Storage Available: ${storageAvailable}`);
      console.log(`   - Location: ${location || 'Not specified'}`);

      // Fetch current market price if not provided
      let marketPrice = currentMarketPrice;
      if (!marketPrice) {
        try {
          const { marketPriceService } = await import('../services/market-price.service');
          const priceData = await marketPriceService.getAveragePrice(cropType, location);
          marketPrice = priceData.average;
          console.log(`📊 Fetched market price for ${cropType}: ₹${marketPrice}/${priceData.unit}`);
        } catch (error) {
          console.error('Failed to fetch market price:', error);
          // Will use default in AI service
        }
      }

      // Use Amazon Bedrock AI service (with fallback if not configured)
      const strategy = await bedrockService.getSellingStrategy({
        cropType,
        expectedYield,
        yieldUnit,
        harvestMonth,
        currentMarketPrice: marketPrice,
        storageAvailable,
        location
      });
      
      res.json(strategy);
    } catch (error) {
      console.error('Selling strategy error:', error);
      res.status(500).json({ error: 'Failed to generate selling strategy' });
    }
  }
}

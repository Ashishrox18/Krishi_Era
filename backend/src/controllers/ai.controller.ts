import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { bedrockService } from '../services/aws/bedrock.service';
import { ollamaService } from '../services/ollama.service';
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

      // Try Groq first (free), fallback to Ollama, then Bedrock
      const useGroq = process.env.USE_GROQ === 'true';
      const useOllama = process.env.USE_OLLAMA !== 'false';
      
      let strategy;
      
      if (useGroq) {
        const { groqService } = await import('../services/ai/groq.service');
        strategy = await groqService.getSellingStrategy({
          cropType,
          expectedYield,
          yieldUnit,
          harvestMonth,
          currentMarketPrice: marketPrice,
          storageAvailable,
          location
        });
      } else if (useOllama) {
        const prompt = this.buildSellingStrategyPrompt({
          cropType,
          expectedYield,
          yieldUnit,
          harvestMonth,
          currentMarketPrice: marketPrice,
          storageAvailable,
          location
        });
        strategy = await ollamaService.generateSellingStrategy(prompt);
      } else {
        const prompt = this.buildSellingStrategyPrompt({
          cropType,
          expectedYield,
          yieldUnit,
          harvestMonth,
          currentMarketPrice: marketPrice,
          storageAvailable,
          location
        });
        strategy = await bedrockService.generateSellingStrategy(prompt);
      }
      
      res.json(strategy);
    } catch (error) {
      console.error('Selling strategy error:', error);
      res.status(500).json({ error: 'Failed to generate selling strategy' });
    }
  }

  private buildSellingStrategyPrompt(data: any): string {
    return `You are an agricultural market expert. Analyze the following crop selling scenario and provide a strategic recommendation:

Crop Details:
- Crop: ${data.cropType}
- Expected Yield: ${data.expectedYield} ${data.yieldUnit}
- Harvest Month: ${data.harvestMonth}
- Current Market Price: ${data.currentMarketPrice ? `₹${data.currentMarketPrice}/${data.yieldUnit}` : 'Not provided'}
- Storage Available: ${data.storageAvailable ? 'Yes' : 'No'}
- Location: ${data.location || 'Not specified'}

Based on historical price trends, seasonal patterns, and market dynamics for ${data.cropType}, provide:

1. A clear recommendation on what percentage to sell immediately vs store for later
2. Price predictions for the next 1, 2, and 3 months
3. Profit comparison between selling all now vs following the recommended strategy
4. 3-4 key insights about market conditions and timing
5. Confidence score (0-100) for this recommendation

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "Brief 2-3 sentence summary of the strategy",
  "sellNowPercentage": 40,
  "storeLaterPercentage": 60,
  "pricePredictions": [
    {"period": "1 month", "price": 2300, "change": 4.5},
    {"period": "2 months", "price": 2500, "change": 13.6},
    {"period": "3 months", "price": 2400, "change": 9.1}
  ],
  "profitComparison": {
    "sellAllNow": 220000,
    "followStrategy": 238000,
    "additionalProfit": 18000
  },
  "insights": ["insight1", "insight2", "insight3", "insight4"],
  "confidence": 82
}

Provide realistic, data-driven recommendations based on typical market behavior for ${data.cropType} in India. Use actual numbers and be specific.`;
  }
}

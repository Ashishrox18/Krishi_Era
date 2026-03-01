import Groq from 'groq-sdk';

class GroqService {
  private client: Groq | null = null;
  private enabled: boolean = false;
  private initialized: boolean = false;

  private initialize() {
    if (this.initialized) return;
    
    const apiKey = process.env.GROQ_API_KEY;
    const useGroq = process.env.USE_GROQ === 'true';

    console.log('🔍 Groq Debug - USE_GROQ:', process.env.USE_GROQ);
    console.log('🔍 Groq Debug - API Key exists:', !!apiKey);
    console.log('🔍 Groq Debug - API Key value:', apiKey?.substring(0, 10) + '...');

    if (useGroq && apiKey && apiKey !== 'your_groq_api_key_here') {
      this.client = new Groq({ apiKey });
      this.enabled = true;
      console.log('✅ Groq AI service initialized successfully!');
    } else {
      console.log('❌ Groq AI service disabled - set USE_GROQ=true and GROQ_API_KEY in .env');
    }
    
    this.initialized = true;
  }

  async getCropRecommendations(data: {
    landSize: number;
    soilType: string;
    location: string;
    waterAvailability: string;
    budget: number;
    season?: string;
  }): Promise<any> {
    this.initialize(); // Lazy initialization
    
    // Validate minimum budget (at least ₹5,000 per acre for basic farming)
    const minimumBudgetPerAcre = 5000;
    const minimumTotalBudget = minimumBudgetPerAcre * data.landSize;

    if (data.budget < minimumTotalBudget) {
      return {
        recommendations: [],
        insights: {
          priceTrend: 'N/A',
          priceTrendPercentage: 'N/A',
          bestPlantingTime: 'N/A',
          demandForecast: 'N/A',
          additionalTips: []
        },
        error: {
          message: `Insufficient budget for viable crop cultivation`,
          minimumRequired: minimumTotalBudget,
          provided: data.budget,
          suggestion: `For ${data.landSize} acres, a minimum budget of ₹${minimumTotalBudget.toLocaleString()} is recommended for basic farming operations including seeds, fertilizers, and irrigation.`
        }
      };
    }

    if (!this.enabled || !this.client) {
      console.log('Using fallback recommendations (Groq not configured)');
      console.log('💡 To enable AI: Get free API key from https://console.groq.com/keys');
      return this.getFallbackRecommendations(data);
    }

    try {
      console.log('🤖 Using Groq AI for crop recommendations...');
      const prompt = `You are an agricultural expert AI. Analyze the following farm data and provide crop recommendations in JSON format.

Farm Data:
- Land Size: ${data.landSize} acres
- Soil Type: ${data.soilType}
- Location: ${data.location}
- Water Availability: ${data.waterAvailability}
- Budget: ₹${data.budget}
${data.season ? `- Season: ${data.season}` : ''}

Provide 4-5 crop recommendations with the following structure (respond ONLY with valid JSON, no markdown):
{
  "recommendations": [
    {
      "name": "Crop Name",
      "suitability": 85,
      "expectedYield": "X tons/acre",
      "revenue": "₹X L/acre",
      "duration": "X days",
      "waterNeed": "High/Medium/Low",
      "marketDemand": "High/Medium/Low",
      "riskLevel": "Low/Medium/High",
      "reasoning": "Brief explanation why this crop is suitable"
    }
  ],
  "insights": {
    "priceTrend": "Rising/Stable/Falling",
    "priceTrendPercentage": "+X%",
    "bestPlantingTime": "Description",
    "demandForecast": "High/Medium/Low",
    "additionalTips": ["tip1", "tip2", "tip3"]
  }
}

Consider:
1. Soil type compatibility
2. Water requirements vs availability
3. Budget constraints
4. Current market prices and demand
5. Seasonal suitability
6. Risk factors (pests, diseases, weather)
7. Expected ROI`;

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert agricultural advisor. Always respond with valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile', // Updated to newer model
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      }
      
      const result = JSON.parse(cleanedResponse);
      return result;
    } catch (error) {
      console.error('Groq API error:', error);
      return this.getFallbackRecommendations(data);
    }
  }

  private getFallbackRecommendations(data: any) {
    // Fallback recommendations based on soil type and water availability
    const recommendations = [];

    // Rice - good for clay soil and high water
    if ((data.soilType === 'clay' || data.soilType === 'loam') && 
        (data.waterAvailability === 'abundant' || data.waterAvailability === 'moderate')) {
      recommendations.push({
        name: 'Rice',
        suitability: 90,
        expectedYield: '4.5 tons/acre',
        revenue: '₹1.8L/acre',
        duration: '120 days',
        waterNeed: 'High',
        marketDemand: 'High',
        riskLevel: 'Low',
        reasoning: 'Excellent match for your soil type and water availability'
      });
    }

    // Wheat - versatile crop
    if (data.soilType === 'loam' || data.soilType === 'clay' || data.soilType === 'silt') {
      recommendations.push({
        name: 'Wheat',
        suitability: 85,
        expectedYield: '3.2 tons/acre',
        revenue: '₹1.2L/acre',
        duration: '90 days',
        waterNeed: 'Medium',
        marketDemand: 'Very High',
        riskLevel: 'Low',
        reasoning: 'High market demand and suitable for your conditions'
      });
    }

    // Cotton - for moderate water
    if (data.waterAvailability === 'moderate' || data.waterAvailability === 'limited') {
      recommendations.push({
        name: 'Cotton',
        suitability: 80,
        expectedYield: '2.8 tons/acre',
        revenue: '₹2.1L/acre',
        duration: '150 days',
        waterNeed: 'Medium',
        marketDemand: 'Medium',
        riskLevel: 'Medium',
        reasoning: 'Good revenue potential with moderate water needs'
      });
    }

    // Millets - for sandy soil and low water
    if (data.soilType === 'sandy' || data.waterAvailability === 'limited' || data.waterAvailability === 'scarce') {
      recommendations.push({
        name: 'Pearl Millet',
        suitability: 88,
        expectedYield: '2.5 tons/acre',
        revenue: '₹0.9L/acre',
        duration: '75 days',
        waterNeed: 'Low',
        marketDemand: 'Medium',
        riskLevel: 'Low',
        reasoning: 'Drought-resistant and suitable for low water availability'
      });
    }

    // Pulses - good for crop rotation
    recommendations.push({
      name: 'Chickpea',
      suitability: 75,
      expectedYield: '1.8 tons/acre',
      revenue: '₹1.1L/acre',
      duration: '100 days',
      waterNeed: 'Low',
      marketDemand: 'High',
      riskLevel: 'Low',
      reasoning: 'Good for soil health and has high market demand'
    });

    return {
      recommendations: recommendations.slice(0, 4),
      insights: {
        priceTrend: 'Stable',
        priceTrendPercentage: '+5%',
        bestPlantingTime: 'Current season is suitable for planting',
        demandForecast: 'Medium',
        additionalTips: [
          'Consider crop rotation to maintain soil health',
          'Monitor weather forecasts regularly',
          'Ensure proper irrigation management'
        ]
      }
    };
  }

  isEnabled(): boolean {
    this.initialize(); // Lazy initialization
    return this.enabled;
  }

  async getSellingStrategy(data: {
    cropType: string;
    expectedYield: number;
    yieldUnit: string;
    harvestMonth: string;
    currentMarketPrice?: number;
    storageAvailable: boolean;
    location?: string;
  }): Promise<any> {
    this.initialize(); // Lazy initialization
    
    if (!this.enabled || !this.client) {
      console.log('Using fallback selling strategy (Groq not configured)');
      return this.getFallbackSellingStrategy(data);
    }

    try {
      console.log('🤖 Using Groq AI for selling strategy...');
      const prompt = `You are an agricultural market expert. Analyze the following crop selling scenario and provide a strategic recommendation:

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

Respond ONLY with valid JSON in this exact structure (no markdown):
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

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert agricultural market advisor. Always respond with valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile', // Updated to newer model
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      // Clean up response
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      }
      
      const result = JSON.parse(cleanedResponse);
      return result;
    } catch (error) {
      console.error('Groq API error:', error);
      return this.getFallbackSellingStrategy(data);
    }
  }

  private getFallbackSellingStrategy(data: any): any {
    // Fallback strategy based on common agricultural practices
    const basePrice = data.currentMarketPrice || 2000;
    const totalYield = data.expectedYield;
    
    // Default strategy: sell 30% now, store 70% if storage available
    const sellNow = data.storageAvailable ? 30 : 100;
    const storeLater = data.storageAvailable ? 70 : 0;

    const sellNowAmount = (totalYield * sellNow) / 100;
    const storeLaterAmount = (totalYield * storeLater) / 100;

    // Price predictions (typically 5-15% increase over 3 months)
    const price1Month = Math.round(basePrice * 1.05);
    const price2Months = Math.round(basePrice * 1.10);
    const price3Months = Math.round(basePrice * 1.08);

    // Profit calculations
    const sellAllNow = Math.round(totalYield * basePrice);
    const followStrategy = Math.round(
      (sellNowAmount * basePrice) + 
      (storeLaterAmount * 0.3 * price1Month) +
      (storeLaterAmount * 0.4 * price2Months) +
      (storeLaterAmount * 0.3 * price3Months)
    );
    const additionalProfit = followStrategy - sellAllNow;

    return {
      summary: data.storageAvailable 
        ? `Based on market trends for ${data.cropType}, we recommend selling ${sellNow}% immediately to cover costs and storing ${storeLater}% for better prices. Expected price increase of 8-10% over next 2-3 months.`
        : `Without storage facilities, we recommend selling your entire harvest immediately. Consider investing in storage for future harvests to maximize profits.`,
      sellNowPercentage: sellNow,
      storeLaterPercentage: storeLater,
      pricePredictions: [
        { period: '1 month', price: price1Month, change: 5.0 },
        { period: '2 months', price: price2Months, change: 10.0 },
        { period: '3 months', price: price3Months, change: 8.0 }
      ],
      profitComparison: {
        sellAllNow,
        followStrategy,
        additionalProfit: data.storageAvailable ? additionalProfit : 0
      },
      insights: data.storageAvailable ? [
        `${data.cropType} prices typically rise 8-12% in the 2-3 months post-harvest`,
        'Ensure proper storage conditions to prevent quality degradation',
        'Monitor market prices weekly to identify optimal selling windows',
        'Consider selling in smaller batches to average out price fluctuations'
      ] : [
        'Without storage, immediate sale is the safest option',
        'Consider partnering with local warehouses for future harvests',
        'Government-backed warehouse receipt schemes can provide better prices',
        'Negotiate with multiple buyers to get the best immediate price'
      ],
      confidence: data.storageAvailable ? 75 : 85
    };
  }
}

export const groqService = new GroqService();

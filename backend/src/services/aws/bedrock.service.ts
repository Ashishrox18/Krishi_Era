import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

class BedrockService {
  private client: BedrockRuntimeClient;
  private enabled: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.client = new BedrockRuntimeClient({ 
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  private initialize() {
    if (this.initialized) return;
    
    const awsRegion = process.env.AWS_REGION;
    const useBedrock = process.env.USE_BEDROCK === 'true';

    console.log('🔍 Bedrock Debug - USE_BEDROCK:', process.env.USE_BEDROCK);
    console.log('🔍 Bedrock Debug - AWS_REGION:', awsRegion);

    if (useBedrock && awsRegion) {
      this.enabled = true;
      console.log('✅ Amazon Bedrock AI service initialized successfully!');
    } else {
      console.log('❌ Amazon Bedrock AI service disabled - set USE_BEDROCK=true and AWS_REGION in .env');
    }
    
    this.initialized = true;
  }

  isEnabled(): boolean {
    this.initialize();
    return this.enabled;
  }

  async getCropRecommendations(data: {
    landSize: number;
    soilType: string;
    location: string;
    waterAvailability: string;
    budget: number;
    season?: string;
  }): Promise<any> {
    this.initialize();
    
    // Validate minimum budget
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

    if (!this.enabled) {
      console.log('Using fallback recommendations (Bedrock not configured)');
      return this.getFallbackRecommendations(data);
    }

    try {
      console.log('🤖 Using Amazon Bedrock AI for crop recommendations...');
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

Consider Indian agricultural practices, local market conditions, and seasonal factors.`;

      const response = await this.invokeModel(prompt);
      console.log('✅ Bedrock AI response received');
      return response;
    } catch (error) {
      console.error('❌ Bedrock AI error:', error);
      return this.getFallbackRecommendations(data);
    }
  }

  async getSellingStrategy(data: {
    cropType: string;
    expectedYield: number;
    yieldUnit: string;
    harvestMonth: string;
    currentMarketPrice: number;
    storageAvailable: boolean;
    location: string;
  }): Promise<any> {
    this.initialize();

    if (!this.enabled) {
      console.log('Using fallback selling strategy (Bedrock not configured)');
      return this.getFallbackSellingStrategy(data);
    }

    try {
      console.log('🤖 Using Amazon Bedrock AI for selling strategy...');
      const prompt = `You are an agricultural market expert. Analyze the following data and provide a selling strategy in JSON format.

Crop Data:
- Crop: ${data.cropType}
- Expected Yield: ${data.expectedYield} ${data.yieldUnit}
- Harvest Month: ${data.harvestMonth}
- Current Market Price: ₹${data.currentMarketPrice}/${data.yieldUnit}
- Storage Available: ${data.storageAvailable ? 'Yes' : 'No'}
- Location: ${data.location}

Provide a selling strategy with this structure (respond ONLY with valid JSON):
{
  "strategy": {
    "recommendation": "Sell immediately / Store and sell later / Sell in batches",
    "reasoning": "Detailed explanation",
    "expectedPrice": "₹X/${data.yieldUnit}",
    "expectedRevenue": "₹X L",
    "confidence": "High/Medium/Low"
  },
  "marketAnalysis": {
    "currentTrend": "Rising/Stable/Falling",
    "demandLevel": "High/Medium/Low",
    "supplyLevel": "High/Medium/Low",
    "seasonalFactor": "Description"
  },
  "timeline": {
    "immediate": "Action for next 7 days",
    "shortTerm": "Action for next 30 days",
    "longTerm": "Action for 3+ months"
  },
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "actionItems": ["action1", "action2", "action3"]
}`;

      const response = await this.invokeModel(prompt);
      console.log('✅ Bedrock AI selling strategy received');
      return response;
    } catch (error) {
      console.error('❌ Bedrock AI error:', error);
      return this.getFallbackSellingStrategy(data);
    }
  }

  private async invokeModel(prompt: string): Promise<any> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    const text = responseBody.content[0].text;
    
    // Try to parse as JSON
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanText);
    } catch {
      // If not JSON, return as response object
      return { response: text };
    }
  }

  private getFallbackRecommendations(data: any): any {
    // Fallback recommendations based on common Indian crops
    const recommendations = [
      {
        name: 'Rice (Paddy)',
        suitability: 75,
        expectedYield: '2.5 tons/acre',
        revenue: '₹1.2 L/acre',
        duration: '120 days',
        waterNeed: 'High',
        marketDemand: 'High',
        riskLevel: 'Low',
        reasoning: 'Staple crop with consistent demand and well-established market'
      },
      {
        name: 'Wheat',
        suitability: 70,
        expectedYield: '2 tons/acre',
        revenue: '₹1 L/acre',
        duration: '110 days',
        waterNeed: 'Medium',
        marketDemand: 'High',
        riskLevel: 'Low',
        reasoning: 'Essential grain with stable prices and government support'
      },
      {
        name: 'Cotton',
        suitability: 65,
        expectedYield: '1.5 tons/acre',
        revenue: '₹1.5 L/acre',
        duration: '150 days',
        waterNeed: 'Medium',
        marketDemand: 'High',
        riskLevel: 'Medium',
        reasoning: 'High-value cash crop with good export potential'
      },
      {
        name: 'Sugarcane',
        suitability: 60,
        expectedYield: '35 tons/acre',
        revenue: '₹2 L/acre',
        duration: '365 days',
        waterNeed: 'High',
        marketDemand: 'Medium',
        riskLevel: 'Medium',
        reasoning: 'Long-duration crop with high returns but requires significant water'
      }
    ];

    return {
      recommendations,
      insights: {
        priceTrend: 'Stable',
        priceTrendPercentage: '+2%',
        bestPlantingTime: 'Monsoon season (June-July) for kharif crops',
        demandForecast: 'High',
        additionalTips: [
          'Consider crop rotation to maintain soil health',
          'Check government MSP (Minimum Support Price) before planting',
          'Ensure adequate irrigation facilities for water-intensive crops'
        ]
      },
      note: 'Using fallback recommendations. Enable Amazon Bedrock for AI-powered suggestions.'
    };
  }

  private getFallbackSellingStrategy(data: any): any {
    return {
      strategy: {
        recommendation: data.storageAvailable ? 'Store and sell in batches' : 'Sell immediately',
        reasoning: data.storageAvailable 
          ? 'With storage available, you can wait for better prices and sell in batches to maximize revenue'
          : 'Without storage, sell immediately to avoid spoilage and quality degradation',
        expectedPrice: `₹${Math.round(data.currentMarketPrice * 1.1)}/${data.yieldUnit}`,
        expectedRevenue: `₹${((data.expectedYield * data.currentMarketPrice * 1.1) / 100000).toFixed(1)} L`,
        confidence: 'Medium'
      },
      marketAnalysis: {
        currentTrend: 'Stable',
        demandLevel: 'Medium',
        supplyLevel: 'Medium',
        seasonalFactor: 'Prices typically rise 2-3 months after harvest season'
      },
      timeline: {
        immediate: 'Sell 30% of produce at current market price',
        shortTerm: 'Monitor prices and sell another 40% when prices rise',
        longTerm: 'Hold remaining 30% for off-season premium prices'
      },
      risks: [
        'Price volatility due to market fluctuations',
        'Storage costs if holding for long term',
        'Quality degradation over time'
      ],
      opportunities: [
        'Direct buyer connections for better margins',
        'Government procurement schemes',
        'Export opportunities for quality produce'
      ],
      actionItems: [
        'Check current mandi prices in your region',
        'Connect with local buyers and traders',
        'Consider contract farming for price stability'
      ],
      note: 'Using fallback strategy. Enable Amazon Bedrock for AI-powered analysis.'
    };
  }
}

export const bedrockService = new BedrockService();

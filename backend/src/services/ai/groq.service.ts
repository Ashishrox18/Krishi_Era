import Groq from 'groq-sdk';

class GroqService {
  private client: Groq | null = null;
  private enabled: boolean = false;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    const useGroq = process.env.USE_GROQ === 'true';

    if (useGroq && apiKey && apiKey !== 'your_groq_api_key_here') {
      this.client = new Groq({ apiKey });
      this.enabled = true;
      console.log('Groq AI service initialized');
    } else {
      console.log('Groq AI service disabled - set USE_GROQ=true and GROQ_API_KEY in .env');
    }
  }

  async getCropRecommendations(data: {
    landSize: number;
    soilType: string;
    location: string;
    waterAvailability: string;
    budget: number;
    season?: string;
  }): Promise<any> {
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
        model: 'llama-3.1-70b-versatile', // Fast and capable model
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
    return this.enabled;
  }
}

export const groqService = new GroqService();

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

export class BedrockService {
  async generateCropRecommendations(data: {
    soilType: string;
    landSize: number;
    location: string;
    waterAvailability: string;
    budget: number;
  }) {
    const prompt = `As an agricultural AI expert, provide crop recommendations based on:
- Soil Type: ${data.soilType}
- Land Size: ${data.landSize} acres
- Location: ${data.location}
- Water Availability: ${data.waterAvailability}
- Budget: ₹${data.budget}

Provide top 4 crop recommendations with:
1. Crop name and variety
2. Suitability score (0-100)
3. Expected yield per acre
4. Expected revenue per acre
5. Duration in days
6. Water requirements
7. Market demand level
8. Risk level

Format as JSON array.`;

    return await this.invokeModel(prompt);
  }

  async generateHarvestRecommendation(data: {
    cropType: string;
    plantingDate: string;
    currentConditions: any;
    marketPrices: any;
  }) {
    const prompt = `Analyze harvest timing for:
- Crop: ${data.cropType}
- Planted: ${data.plantingDate}
- Current Conditions: ${JSON.stringify(data.currentConditions)}
- Market Prices: ${JSON.stringify(data.marketPrices)}

Provide:
1. Optimal harvest date
2. Harvest window (days)
3. Expected yield
4. Market timing recommendation
5. Risk factors

Format as JSON.`;

    return await this.invokeModel(prompt);
  }

  async optimizeRoute(data: {
    origin: string;
    destinations: string[];
    vehicleCapacity: number;
    shipments: any[];
  }) {
    const prompt = `Optimize delivery route:
- Origin: ${data.origin}
- Destinations: ${data.destinations.join(', ')}
- Vehicle Capacity: ${data.vehicleCapacity} tons
- Shipments: ${JSON.stringify(data.shipments)}

Provide:
1. Optimized route sequence
2. Total distance
3. Estimated duration
4. Fuel cost estimate
5. Consolidation opportunities

Format as JSON.`;

    return await this.invokeModel(prompt);
  }

  async analyzePricetrends(data: {
    product: string;
    historicalPrices: any[];
    supplyData: any;
    demandData: any;
  }) {
    const prompt = `Analyze price trends for ${data.product}:
- Historical Prices: ${JSON.stringify(data.historicalPrices)}
- Supply: ${JSON.stringify(data.supplyData)}
- Demand: ${JSON.stringify(data.demandData)}

Provide:
1. Current fair price
2. 7-day forecast
3. 30-day forecast
4. Price volatility assessment
5. Market recommendations

Format as JSON.`;

    return await this.invokeModel(prompt);
  }

  async generateSellingStrategy(prompt: string) {
    return await this.invokeModel(prompt);
  }

  private async invokeModel(prompt: string) {
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
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0', // Updated to Claude 3.5 Sonnet
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    try {
      return JSON.parse(responseBody.content[0].text);
    } catch {
      return { response: responseBody.content[0].text };
    }
  }
}

export const bedrockService = new BedrockService();

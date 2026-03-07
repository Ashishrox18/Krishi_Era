import axios from 'axios';

interface MarketPrice {
  commodity: string;
  market: string;
  state: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
  trend?: 'rising' | 'falling' | 'stable';
  change?: number;
}

interface PriceCache {
  [key: string]: {
    data: MarketPrice[];
    timestamp: number;
  };
}

class MarketPriceService {
  private cache: PriceCache = {};
  private cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours

  // Crop name mapping for API compatibility
  private cropMapping: { [key: string]: string[] } = {
    'Wheat': ['wheat', 'gehun'],
    'Rice': ['rice', 'paddy', 'dhan'],
    'Maize': ['maize', 'corn', 'makka'],
    'Cotton': ['cotton', 'kapas'],
    'Sugarcane': ['sugarcane', 'ganna'],
    'Potato': ['potato', 'aloo'],
    'Onion': ['onion', 'pyaz'],
    'Tomato': ['tomato', 'tamatar'],
    'Soybean': ['soybean', 'soya'],
    'Groundnut': ['groundnut', 'peanut', 'moongfali'],
    'Mustard': ['mustard', 'sarson'],
    'Sunflower': ['sunflower'],
    'Chickpea': ['chickpea', 'gram', 'chana'],
    'Lentils': ['lentil', 'masoor'],
    'Bajra': ['bajra', 'pearl millet'],
    'Jowar': ['jowar', 'sorghum'],
    'Green Gram': ['green gram', 'moong'],
    'Black Gram': ['black gram', 'urad'],
    'Barley': ['barley', 'jau'],
    'Millet': ['millet', 'bajra']
  };

  /**
   * Get market prices for a specific crop
   * Uses data.gov.in API for real agricultural market data
   */
  async getMarketPrices(cropType: string, state?: string): Promise<MarketPrice[]> {
    const cacheKey = `${cropType}-${state || 'all'}`;
    
    // Check cache first
    if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheExpiry) {
      console.log(`📦 Using cached market prices for ${cropType}`);
      return this.cache[cacheKey].data;
    }

    try {
      console.log(`🌾 Fetching market prices for ${cropType}...`);
      
      // Try to fetch from data.gov.in API
      const prices = await this.fetchFromDataGovIn(cropType, state);
      
      if (prices.length > 0) {
        // Cache the results
        this.cache[cacheKey] = {
          data: prices,
          timestamp: Date.now()
        };
        return prices;
      }

      // Fallback to mock data if API fails
      console.log(`⚠️ Using fallback prices for ${cropType}`);
      return this.getFallbackPrices(cropType);
    } catch (error) {
      console.error('Market price fetch error:', error);
      return this.getFallbackPrices(cropType);
    }
  }

  /**
   * Fetch prices from data.gov.in API
   */
  private async fetchFromDataGovIn(cropType: string, state?: string): Promise<MarketPrice[]> {
    try {
      // Data.gov.in API endpoint for agricultural market prices
      // Note: This is a public API, but may require API key for production use
      const apiUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
      
      const params: any = {
        'api-key': process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
        'format': 'json',
        'limit': 100,
        'filters[commodity]': this.getCropVariants(cropType)[0]
      };

      if (state) {
        params['filters[state]'] = state;
      }

      const response = await axios.get(apiUrl, {
        params,
        timeout: 10000
      });

      if (response.data && response.data.records) {
        return this.parseDataGovResponse(response.data.records, cropType);
      }

      return [];
    } catch (error: any) {
      console.error('Data.gov.in API error:', error.message);
      return [];
    }
  }

  /**
   * Parse data.gov.in API response
   */
  private parseDataGovResponse(records: any[], cropType: string): MarketPrice[] {
    const prices: MarketPrice[] = [];

    for (const record of records) {
      try {
        const minPrice = parseFloat(record.min_price) || 0;
        const maxPrice = parseFloat(record.max_price) || 0;
        const modalPrice = parseFloat(record.modal_price) || ((minPrice + maxPrice) / 2);

        if (modalPrice > 0) {
          prices.push({
            commodity: cropType,
            market: record.market || 'Unknown',
            state: record.state || 'Unknown',
            district: record.district || 'Unknown',
            minPrice,
            maxPrice,
            modalPrice,
            date: record.arrival_date || new Date().toISOString().split('T')[0]
          });
        }
      } catch (error) {
        console.error('Error parsing record:', error);
      }
    }

    return prices;
  }

  /**
   * Get average price for a crop across all markets
   */
  async getAveragePrice(cropType: string, state?: string): Promise<{
    average: number;
    min: number;
    max: number;
    trend: 'rising' | 'falling' | 'stable';
    change: number;
    unit: string;
  }> {
    console.log(`🌾 Getting average price for ${cropType}${state ? ` in ${state}` : ''}`);
    
    const prices = await this.getMarketPrices(cropType, state);

    if (prices.length === 0) {
      console.log(`⚠️ No API data found for ${cropType}, using fallback prices`);
      return this.getFallbackAveragePrice(cropType);
    }

    console.log(`✅ Found ${prices.length} market prices for ${cropType}`);

    // Calculate average modal price
    const modalPrices = prices.map(p => p.modalPrice);
    const average = Math.round(modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length);
    const min = Math.round(Math.min(...modalPrices));
    const max = Math.round(Math.max(...modalPrices));

    // Estimate trend (simplified - in production, compare with historical data)
    const trend = this.estimateTrend(cropType);
    const change = this.estimateChange(cropType);

    console.log(`📊 Average price for ${cropType}: ₹${average} (${min}-${max}), Trend: ${trend} (${change}%)`);

    return {
      average,
      min,
      max,
      trend,
      change,
      unit: this.getPriceUnit(cropType)
    };
  }

  /**
   * Get crop name variants for API queries
   */
  private getCropVariants(cropType: string): string[] {
    return this.cropMapping[cropType] || [cropType.toLowerCase()];
  }

  /**
   * Get price unit based on crop type
   */
  private getPriceUnit(cropType: string): string {
    const tonCrops = ['Sugarcane', 'Cotton'];
    return tonCrops.includes(cropType) ? 'ton' : 'quintal';
  }

  /**
   * Estimate price trend (simplified)
   */
  private estimateTrend(cropType: string): 'rising' | 'falling' | 'stable' {
    // In production, this would analyze historical data
    // For now, use seasonal patterns
    const currentMonth = new Date().getMonth();
    
    // Post-harvest months typically see falling prices
    const harvestMonths: { [key: string]: number[] } = {
      'Wheat': [3, 4], // April-May
      'Rice': [9, 10], // October-November
      'Cotton': [10, 11], // November-December
    };

    const cropHarvestMonths = harvestMonths[cropType] || [];
    if (cropHarvestMonths.includes(currentMonth)) {
      return 'falling';
    } else if (cropHarvestMonths.includes((currentMonth + 1) % 12)) {
      return 'stable';
    }
    
    return 'rising';
  }

  /**
   * Estimate price change percentage
   */
  private estimateChange(cropType: string): number {
    const trend = this.estimateTrend(cropType);
    
    if (trend === 'rising') {
      return Math.round(Math.random() * 5 + 3); // 3-8%
    } else if (trend === 'falling') {
      return -Math.round(Math.random() * 5 + 2); // -2 to -7%
    }
    
    return Math.round(Math.random() * 3 - 1); // -1 to +2%
  }

  /**
   * Fallback prices based on typical Indian market rates (per quintal)
   */
  private getFallbackPrices(cropType: string): MarketPrice[] {
    console.log(`📦 Using fallback prices for ${cropType}`);
    
    const fallbackData: { [key: string]: number } = {
      'Wheat': 2200,
      'Rice': 2000,
      'Maize': 1800,
      'Bajra': 1900,
      'Jowar': 2800,
      'Cotton': 7500, // per quintal
      'Sugarcane': 350, // per quintal
      'Potato': 1200,
      'Onion': 1500,
      'Tomato': 1800,
      'Soybean': 4200,
      'Groundnut': 5500,
      'Mustard': 5000,
      'Sunflower': 6000,
      'Chickpea': 5200,
      'Lentils': 6000,
      'Green Gram': 7000,
      'Black Gram': 6500,
      'Barley': 1800,
      'Millet': 2000
    };

    const basePrice = fallbackData[cropType] || 2000;
    const variation = basePrice * 0.1; // 10% variation

    console.log(`💰 Fallback price for ${cropType}: ₹${basePrice}/quintal`);

    return [{
      commodity: cropType,
      market: 'Average Market',
      state: 'India',
      district: 'National Average',
      minPrice: Math.round(basePrice - variation),
      maxPrice: Math.round(basePrice + variation),
      modalPrice: basePrice,
      date: new Date().toISOString().split('T')[0]
    }];
  }

  /**
   * Fallback average price
   */
  private getFallbackAveragePrice(cropType: string): {
    average: number;
    min: number;
    max: number;
    trend: 'rising' | 'falling' | 'stable';
    change: number;
    unit: string;
  } {
    const prices = this.getFallbackPrices(cropType);
    const price = prices[0];

    const result = {
      average: price.modalPrice,
      min: price.minPrice,
      max: price.maxPrice,
      trend: this.estimateTrend(cropType),
      change: this.estimateChange(cropType),
      unit: this.getPriceUnit(cropType)
    };

    console.log(`📊 Fallback average for ${cropType}:`, result);
    return result;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache = {};
    console.log('🗑️ Market price cache cleared');
  }
}

export const marketPriceService = new MarketPriceService();

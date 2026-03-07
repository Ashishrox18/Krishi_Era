import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dynamoDBService } from '../services/aws/dynamodb.service';
import { bedrockService } from '../services/aws/bedrock.service';
import { groqService } from '../services/ai/groq.service';
import { snsService } from '../services/aws/sns.service';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsController } from './notifications.controller';

export class FarmerController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Get farmer's crops
      const crops = await dynamoDBService.query(
        process.env.DYNAMODB_CROPS_TABLE!,
        'userId = :userId',
        { ':userId': userId }
      );

      // Get active listings
      const listings = await dynamoDBService.query(
        process.env.DYNAMODB_ORDERS_TABLE!,
        'farmerId = :farmerId AND #status = :status',
        { ':farmerId': userId, ':status': 'active' }
      );

      // Calculate stats
      const totalLand = crops.reduce((sum: number, crop: any) => sum + crop.area, 0);
      const expectedYield = crops.reduce((sum: number, crop: any) => sum + crop.expectedYield, 0);
      const expectedRevenue = crops.reduce((sum: number, crop: any) => sum + crop.expectedRevenue, 0);

      res.json({
        stats: {
          totalLand,
          activeCrops: crops.length,
          expectedYield,
          expectedRevenue,
        },
        crops: crops.slice(0, 5),
        recentListings: listings.slice(0, 5),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  async getCropRecommendations(req: AuthRequest, res: Response) {
    try {
      const { soilType, landSize, location, waterAvailability, budget, season } = req.body;

      let recommendations;
      
      // Try Groq first
      if (groqService.isEnabled()) {
        console.log('Using Groq for crop recommendations');
        recommendations = await groqService.getCropRecommendations({
          soilType,
          landSize,
          location,
          waterAvailability,
          budget,
          season,
        });
      } else {
        // Use Groq's fallback directly (don't try Bedrock)
        console.log('Using fallback recommendations (Groq not configured)');
        recommendations = await groqService.getCropRecommendations({
          soilType,
          landSize,
          location,
          waterAvailability,
          budget,
          season,
        });
      }

      res.json(recommendations);
    } catch (error) {
      console.error('Crop recommendations error:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }

  async getCrops(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const crops = await dynamoDBService.query(
        process.env.DYNAMODB_CROPS_TABLE!,
        'userId = :userId',
        { ':userId': userId }
      );

      res.json({ crops });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch crops' });
    }
  }

  async createCrop(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const cropData = {
        id: uuidv4(),
        userId,
        ...req.body,
        createdAt: new Date().toISOString(),
        status: 'planted',
      };

      await dynamoDBService.put(process.env.DYNAMODB_CROPS_TABLE!, cropData);

      res.status(201).json({ crop: cropData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create crop' });
    }
  }

  async updateCrop(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const updated = await dynamoDBService.update(
        process.env.DYNAMODB_CROPS_TABLE!,
        { id, userId },
        'SET #name = :name, area = :area, #status = :status, updatedAt = :updatedAt',
        {
          ':name': req.body.name,
          ':area': req.body.area,
          ':status': req.body.status,
          ':updatedAt': new Date().toISOString(),
        }
      );

      res.json({ crop: updated });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update crop' });
    }
  }

  async deleteCrop(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await dynamoDBService.delete(process.env.DYNAMODB_CROPS_TABLE!, { id, userId });

      res.json({ message: 'Crop deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete crop' });
    }
  }

  async getHarvests(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const crops = await dynamoDBService.query(
        process.env.DYNAMODB_CROPS_TABLE!,
        'userId = :userId',
        { ':userId': userId }
      );

      // Filter crops ready for harvest or upcoming
      const harvests = crops.map((crop: any) => {
        const plantingDate = new Date(crop.plantingDate);
        const harvestDate = new Date(plantingDate);
        harvestDate.setDate(harvestDate.getDate() + crop.duration);
        
        const daysRemaining = Math.ceil(
          (harvestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...crop,
          harvestDate: harvestDate.toISOString(),
          daysRemaining,
          status: daysRemaining <= 0 ? 'ready' : daysRemaining <= 30 ? 'upcoming' : 'growing',
        };
      });

      res.json({ harvests });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch harvests' });
    }
  }

  async getHarvestTiming(req: AuthRequest, res: Response) {
    try {
      const { cropId } = req.params;
      const userId = req.user!.id;

      const crop = await dynamoDBService.get(process.env.DYNAMODB_CROPS_TABLE!, {
        id: cropId,
        userId,
      });

      if (!crop) {
        return res.status(404).json({ error: 'Crop not found' });
      }

      // Get weather and market data (mock for now)
      const currentConditions = { temperature: 28, humidity: 65, rainfall: 0 };
      const marketPrices = { current: 22000, trend: 'rising' };

      const recommendation = await bedrockService.generateHarvestRecommendation({
        cropType: crop.name,
        plantingDate: crop.plantingDate,
        currentConditions,
        marketPrices,
      });

      res.json({ recommendation });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate harvest timing' });
    }
  }

  async listForSale(req: AuthRequest, res: Response) {
    try {
      const { cropId } = req.params;
      const userId = req.user!.id;
      const {
        quantity,
        quantityUnit = 'kg',
        minimumPrice,
        pickupLocation,
        description,
        availableFrom,
        availableTill
      } = req.body;

      // Get crop details
      const crop = await dynamoDBService.get(process.env.DYNAMODB_CROPS_TABLE!, { id: cropId });
      if (!crop) {
        return res.status(404).json({ error: 'Crop not found' });
      }

      const purchaseRequest = {
        id: uuidv4(),
        farmerId: userId,
        cropId,
        cropType: crop.name || 'Unknown Crop',
        variety: crop.variety || '',
        quantity: parseFloat(quantity),
        quantityUnit,
        qualityGrade: 'A', // Default grade
        minimumPrice: parseFloat(minimumPrice),
        expectedPrice: parseFloat(minimumPrice) * 1.1, // 10% higher than minimum
        pickupLocation,
        availableFrom: availableFrom || new Date().toISOString(),
        availableTill,
        description: description || '',
        status: 'released',
        currentBestOffer: 0,
        quotesCount: 0,
        type: 'farmer_listing', // Add type for filtering
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: availableTill || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, purchaseRequest);

      // Send notification to all buyers
      try {
        await NotificationsController.sendNotificationToRole('buyer', {
          title: 'New Produce Listed',
          message: `${quantity} ${quantityUnit} of ${purchaseRequest.cropType} available at ₹${minimumPrice}/${quantityUnit} from ${pickupLocation}`,
          type: 'farmer_listing',
          relatedId: purchaseRequest.id,
          link: `/buyer/procurement`
        });
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the request if notifications fail
      }

      res.status(201).json({ purchaseRequest });
    } catch (error) {
      console.error('List for sale error:', error);
      res.status(500).json({ error: 'Failed to list for sale' });
    }
  }

  async getWeather(req: AuthRequest, res: Response) {
    try {
      const { latitude, longitude, city } = req.query;

      let weatherData;

      if (latitude && longitude) {
        // Use provided coordinates
        const { weatherService } = await import('../services/weather.service');
        weatherData = await weatherService.getWeather(
          parseFloat(latitude as string),
          parseFloat(longitude as string)
        );
      } else if (city) {
        // Use city name
        const { weatherService } = await import('../services/weather.service');
        weatherData = await weatherService.getWeatherByCity(city as string);
      } else {
        // Use default location (New Delhi, India)
        const { weatherService } = await import('../services/weather.service');
        weatherData = await weatherService.getDefaultWeather();
      }

      res.json(weatherData);
    } catch (error) {
      console.error('Weather fetch error:', error);
      
      // Fallback to mock data if API fails
      const fallbackData = {
        current: {
          temperature: 28,
          humidity: 65,
          windSpeed: 12,
          conditions: 'Partly Cloudy',
          weatherCode: 2,
        },
        forecast: [
          { day: 'Mon', temp: 28, rainfall: 0, weatherCode: 0 },
          { day: 'Tue', temp: 30, rainfall: 5, weatherCode: 61 },
          { day: 'Wed', temp: 29, rainfall: 12, weatherCode: 63 },
          { day: 'Thu', temp: 27, rainfall: 8, weatherCode: 61 },
          { day: 'Fri', temp: 28, rainfall: 0, weatherCode: 1 },
          { day: 'Sat', temp: 31, rainfall: 0, weatherCode: 0 },
          { day: 'Sun', temp: 32, rainfall: 0, weatherCode: 0 },
        ],
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          city: 'Default Location',
        },
      };
      
      res.json(fallbackData);
    }
  }

  async getMarketPrices(req: AuthRequest, res: Response) {
    try {
      const { product } = req.query;

      // Mock market prices - integrate with actual market data
      const prices = {
        rice: { current: 22000, trend: 'rising', change: '+5%' },
        wheat: { current: 25000, trend: 'stable', change: '+2%' },
        cotton: { current: 75000, trend: 'rising', change: '+8%' },
      };

      res.json({ prices: product ? { [product as string]: prices[product as keyof typeof prices] } : prices });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch market prices' });
    }
  }

  async createPurchaseRequest(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        cropType,
        variety,
        quantity,
        quantityUnit,
        qualityGrade,
        minimumPrice,
        expectedPrice,
        pickupLocation,
        availableFrom,
        availableTill,
        description
      } = req.body;

      const purchaseRequest = {
        id: uuidv4(),
        farmerId: userId,
        cropType,
        variety: variety || '',
        quantity,
        quantityUnit,
        qualityGrade,
        minimumPrice,
        expectedPrice: expectedPrice || minimumPrice,
        pickupLocation,
        availableFrom,
        availableTill: availableTill || '',
        description: description || '',
        status: 'released',
        currentBestOffer: 0,
        quotesCount: 0,
        type: 'farmer_listing', // Add type for filtering
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: availableTill || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, purchaseRequest);

      // Send notification to all buyers
      try {
        await NotificationsController.sendNotificationToRole('buyer', {
          title: 'New Produce Listed',
          message: `${quantity} ${quantityUnit} of ${cropType} available at ₹${minimumPrice}/${quantityUnit} from ${pickupLocation}`,
          type: 'farmer_listing',
          relatedId: purchaseRequest.id,
          link: `/buyer/procurement`
        });
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the request if notifications fail
      }

      res.status(201).json({ purchaseRequest });
    } catch (error) {
      console.error('Create purchase request error:', error);
      res.status(500).json({ error: 'Failed to create purchase request' });
    }
  }

  async getPurchaseRequests(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Get all items from orders table
      const allItems = await dynamoDBService.scan(process.env.DYNAMODB_ORDERS_TABLE!);
      
      // Filter for farmer's own listings (have farmerId matching current user)
      const requests = allItems.filter((item: any) => 
        item.farmerId === userId
      );

      console.log(`Found ${requests.length} farmer listings for user ${userId}`);
      
      res.json({ requests });
    } catch (error) {
      console.error('Get purchase requests error:', error);
      res.status(500).json({ error: 'Failed to fetch purchase requests' });
    }
  }

  async getPurchaseRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const request = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });

      if (!request) {
        return res.status(404).json({ error: 'Purchase request not found' });
      }

      // If it's a farmer's listing (has farmerId), check ownership
      // If it's a buyer's procurement request (has buyerId), allow any farmer to view
      if (request.farmerId && request.farmerId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.json({ request });
    } catch (error) {
      console.error('Get purchase request error:', error);
      res.status(500).json({ error: 'Failed to fetch purchase request' });
    }
  }

  async updatePurchaseRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const request = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });

      if (!request || request.farmerId !== userId) {
        return res.status(404).json({ error: 'Purchase request not found' });
      }

      const updated = {
        ...request,
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, updated);

      res.json({ request: updated });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update purchase request' });
    }
  }

  async deletePurchaseRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const request = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });

      if (!request || request.farmerId !== userId) {
        return res.status(404).json({ error: 'Purchase request not found' });
      }

      await dynamoDBService.delete(process.env.DYNAMODB_ORDERS_TABLE!, { id });

      res.json({ message: 'Purchase request deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete purchase request' });
    }
  }

  async getOffersForListing(req: AuthRequest, res: Response) {
    try {
      const { listingId } = req.params;
      const userId = req.user!.id;

      // Verify the listing belongs to this farmer
      const listing = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id: listingId });
      
      if (!listing || listing.farmerId !== userId) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Get all offers for this listing
      const allItems = await dynamoDBService.scan(process.env.DYNAMODB_ORDERS_TABLE!);
      const offers = allItems.filter((item: any) => 
        item.listingId === listingId && item.buyerId
      );

      // Sort by price (highest first) and date
      offers.sort((a: any, b: any) => {
        if (b.pricePerUnit !== a.pricePerUnit) {
          return b.pricePerUnit - a.pricePerUnit;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json({ offers });
    } catch (error) {
      console.error('Get offers error:', error);
      res.status(500).json({ error: 'Failed to fetch offers' });
    }
  }

  async getBuyerProcurementRequests(req: AuthRequest, res: Response) {
    try {
      // Get all procurement requests from buyers (items with buyerId and status open, released, in_progress, or negotiating)
      const allItems = await dynamoDBService.scan(process.env.DYNAMODB_ORDERS_TABLE!);
      const requests = allItems.filter((item: any) => 
        item.buyerId && (item.status === 'open' || item.status === 'released' || item.status === 'in_progress' || item.status === 'negotiating')
      );

      // Sort by creation date (newest first)
      requests.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({ requests });
    } catch (error) {
      console.error('Get buyer procurement requests error:', error);
      res.status(500).json({ error: 'Failed to fetch buyer procurement requests' });
    }
  }

  async getListing(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const listing = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      res.json({ listing });
    } catch (error) {
      console.error('Get listing error:', error);
      res.status(500).json({ error: 'Failed to fetch listing' });
    }
  }

  async updateListingStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const listing = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      const updated = {
        ...listing,
        status,
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, updated);

      res.json({ listing: updated });
    } catch (error) {
      console.error('Update listing status error:', error);
      res.status(500).json({ error: 'Failed to update listing status' });
    }
  }

  async negotiateListing(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const listing = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Verify ownership
      if (listing.farmerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Get user details
      const user = await dynamoDBService.get(process.env.DYNAMODB_USERS_TABLE!, { id: userId });
      const userName = user?.name || 'Farmer';

      // Initialize negotiation history if it doesn't exist
      const negotiationHistory = listing.negotiationHistory || [];
      
      // Add new negotiation entry
      negotiationHistory.push({
        id: uuidv4(),
        user: 'farmer',
        userId: userId,
        userName: userName,
        price: updates.minimumPrice || listing.minimumPrice,
        quantity: updates.quantity || listing.quantity,
        message: updates.negotiationNotes || 'Updated listing terms',
        timestamp: new Date().toISOString(),
        type: 'counter_offer'
      });

      const updated = {
        ...listing,
        ...updates,
        status: 'negotiating',
        negotiationHistory,
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, updated);

      // Send notification to all buyers who have made offers or shown interest
      try {
        await NotificationsController.sendNotificationToRole('buyer', {
          title: 'Listing Updated',
          message: `${listing.cropType} listing has been updated by farmer. New price: ₹${updates.minimumPrice || listing.minimumPrice}/${listing.quantityUnit}`,
          type: 'farmer_listing',
          relatedId: id,
          link: `/buyer/farmer-listing/${id}`
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the request if notifications fail
      }

      res.json({ success: true, listing: updated });
    } catch (error) {
      console.error('Negotiate listing error:', error);
      res.status(500).json({ error: 'Failed to negotiate listing' });
    }
  }
}

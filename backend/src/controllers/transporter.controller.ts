import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dynamoDBService } from '../services/aws/dynamodb.service';
import { locationService } from '../services/aws/location.service';
import { bedrockService } from '../services/aws/bedrock.service';
import { v4 as uuidv4 } from 'uuid';

export class TransporterController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const shipments = await dynamoDBService.query(
        process.env.DYNAMODB_SHIPMENTS_TABLE!,
        'transporterId = :transporterId',
        { ':transporterId': userId }
      );

      const activeShipments = shipments.filter((s: any) => ['in_transit', 'loading'].includes(s.status));
      const thisMonth = shipments.filter((s: any) => {
        const date = new Date(s.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth();
      });

      const totalRevenue = thisMonth.reduce((sum: number, s: any) => sum + s.revenue, 0);
      const totalDistance = thisMonth.reduce((sum: number, s: any) => sum + s.distance, 0);

      res.json({
        stats: {
          activeShipments: activeShipments.length,
          monthlyRevenue: totalRevenue,
          totalDistance,
          onTimeDelivery: 98,
        },
        activeShipments: activeShipments.slice(0, 5),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  async getShipments(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const shipments = await dynamoDBService.query(
        process.env.DYNAMODB_SHIPMENTS_TABLE!,
        'transporterId = :transporterId',
        { ':transporterId': userId }
      );

      res.json({ shipments });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch shipments' });
    }
  }

  async acceptShipment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const updated = await dynamoDBService.update(
        process.env.DYNAMODB_SHIPMENTS_TABLE!,
        { id },
        'SET transporterId = :transporterId, #status = :status, acceptedAt = :acceptedAt',
        {
          ':transporterId': userId,
          ':status': 'accepted',
          ':acceptedAt': new Date().toISOString(),
        }
      );

      res.json({ shipment: updated });
    } catch (error) {
      res.status(500).json({ error: 'Failed to accept shipment' });
    }
  }

  async updateShipmentStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, location } = req.body;

      const updated = await dynamoDBService.update(
        process.env.DYNAMODB_SHIPMENTS_TABLE!,
        { id },
        'SET #status = :status, currentLocation = :location, updatedAt = :updatedAt',
        {
          ':status': status,
          ':location': location,
          ':updatedAt': new Date().toISOString(),
        }
      );

      res.json({ shipment: updated });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update shipment status' });
    }
  }

  async optimizeRoute(req: AuthRequest, res: Response) {
    try {
      const { origin, destinations, vehicleCapacity, shipments } = req.body;

      // Geocode addresses
      const originCoords = await locationService.geocodeAddress(origin);
      const destCoords = await Promise.all(
        destinations.map((d: string) => locationService.geocodeAddress(d))
      );

      if (!originCoords || destCoords.some(d => !d)) {
        return res.status(400).json({ error: 'Invalid addresses' });
      }

      // Optimize route
      const optimized = await locationService.optimizeMultiStopRoute(
        originCoords.coordinates,
        destCoords.map(d => d!.coordinates)
      );

      // Get AI recommendations
      const aiRecommendation = await bedrockService.optimizeRoute({
        origin,
        destinations,
        vehicleType: vehicleCapacity ? `Capacity: ${vehicleCapacity}` : 'Standard',
        constraints: { shipments }
      });

      res.json({
        optimizedRoute: optimized,
        aiRecommendation,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to optimize route' });
    }
  }

  async getAvailableLoads(req: AuthRequest, res: Response) {
    try {
      const { location, radius } = req.query;

      const availableShipments = await dynamoDBService.scan(
        process.env.DYNAMODB_SHIPMENTS_TABLE!,
        '#status = :status',
        { ':status': 'pending' }
      );

      // Filter by location if provided
      let filtered = availableShipments;
      if (location) {
        // Simple distance filtering (in production, use geospatial queries)
        filtered = availableShipments.filter((s: any) => {
          // Mock distance calculation
          return true;
        });
      }

      res.json({ availableLoads: filtered });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch available loads' });
    }
  }

  async getFleet(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Mock fleet data - in production, store in DynamoDB
      const fleet = [
        { id: 'TRK-001', type: 'Heavy Truck', capacity: '20 tons', status: 'In Use', location: 'En route to Delhi' },
        { id: 'TRK-002', type: 'Medium Truck', capacity: '10 tons', status: 'Available', location: 'Depot - Chandigarh' },
        { id: 'TRK-003', type: 'Light Truck', capacity: '5 tons', status: 'Maintenance', location: 'Service Center' },
      ];

      res.json({ fleet });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch fleet data' });
    }
  }

  async listVehicle(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const vehicleData = {
        id: uuidv4(),
        transporterId: userId,
        type: 'vehicle', // Add type to differentiate from storage
        ...req.body,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamoDBService.put(
        process.env.DYNAMODB_STORAGE_TABLE!,
        vehicleData
      );

      res.json({ vehicle: vehicleData });
    } catch (error) {
      console.error('Failed to list vehicle:', error);
      res.status(500).json({ error: 'Failed to list vehicle' });
    }
  }

  async getMyVehicles(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      console.log('Fetching vehicles for user:', userId);

      // Use scan with filter expression instead of query
      const allItems = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!
      );

      console.log('Total items in storage table:', allItems.length);

      // Filter for vehicles belonging to this transporter
      const vehicles = allItems.filter((item: any) => {
        const isVehicle = item.type === 'vehicle';
        const isOwner = item.transporterId === userId;
        console.log('Item:', item.id, 'type:', item.type, 'transporterId:', item.transporterId, 'isVehicle:', isVehicle, 'isOwner:', isOwner);
        return isVehicle && isOwner;
      });

      console.log('Filtered vehicles count:', vehicles.length);

      res.json({ vehicles });
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
  }

  async getTransporterStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Use scan instead of query for shipments table
      const allShipments = await dynamoDBService.scan(
        process.env.DYNAMODB_SHIPMENTS_TABLE!
      );

      // Filter for this transporter's shipments
      const shipments = allShipments.filter((s: any) => s.transporterId === userId);

      const thisMonth = shipments.filter((s: any) => {
        const date = new Date(s.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth();
      });

      const totalRevenue = thisMonth.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0);
      const totalDistance = thisMonth.reduce((sum: number, s: any) => sum + (s.distance || 0), 0);
      const completedShipments = shipments.filter((s: any) => s.status === 'delivered');
      const deliveryRate = shipments.length > 0 
        ? Math.round((completedShipments.length / shipments.length) * 100) 
        : 0;

      res.json({
        activeShipments: shipments.filter((s: any) => ['in_transit', 'loading'].includes(s.status)).length,
        monthlyRevenue: totalRevenue,
        totalDistance,
        deliveryRate,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      res.status(500).json({ 
        activeShipments: 0,
        monthlyRevenue: 0,
        totalDistance: 0,
        deliveryRate: 0
      });
    }
  }

  async updateVehicle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verify ownership
      const vehicle = await dynamoDBService.get(
        process.env.DYNAMODB_STORAGE_TABLE!,
        { id }
      );

      if (!vehicle || vehicle.transporterId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const updated = await dynamoDBService.update(
        process.env.DYNAMODB_STORAGE_TABLE!,
        { id },
        'SET vehicleNumber = :vehicleNumber, vehicleType = :vehicleType, capacity = :capacity, capacityUnit = :capacityUnit, availableRegions = :availableRegions, pricePerKm = :pricePerKm, features = :features, driverName = :driverName, driverContact = :driverContact, insuranceValid = :insuranceValid, pollutionCertValid = :pollutionCertValid, fitnessValid = :fitnessValid, description = :description, updatedAt = :updatedAt',
        {
          ':vehicleNumber': req.body.vehicleNumber,
          ':vehicleType': req.body.vehicleType,
          ':capacity': req.body.capacity,
          ':capacityUnit': req.body.capacityUnit,
          ':availableRegions': req.body.availableRegions,
          ':pricePerKm': req.body.pricePerKm,
          ':features': req.body.features,
          ':driverName': req.body.driverName,
          ':driverContact': req.body.driverContact,
          ':insuranceValid': req.body.insuranceValid,
          ':pollutionCertValid': req.body.pollutionCertValid,
          ':fitnessValid': req.body.fitnessValid,
          ':description': req.body.description,
          ':updatedAt': new Date().toISOString(),
        }
      );

      res.json({ vehicle: updated });
    } catch (error) {
      console.error('Failed to update vehicle:', error);
      res.status(500).json({ error: 'Failed to update vehicle' });
    }
  }

  async deleteVehicle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verify ownership
      const vehicle = await dynamoDBService.get(
        process.env.DYNAMODB_STORAGE_TABLE!,
        { id }
      );

      if (!vehicle || vehicle.transporterId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await dynamoDBService.delete(
        process.env.DYNAMODB_STORAGE_TABLE!,
        { id }
      );

      res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      res.status(500).json({ error: 'Failed to delete vehicle' });
    }
  }

  async getAllAvailableVehicles(req: AuthRequest, res: Response) {
    try {
      const { region, vehicleType, minCapacity, maxPricePerKm } = req.query;

      // Get all vehicles
      const allItems = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!
      );

      // Filter for vehicles only
      let vehicles = allItems.filter((item: any) => item.type === 'vehicle');

      // Apply filters
      if (region) {
        vehicles = vehicles.filter((v: any) => 
          v.availableRegions && v.availableRegions.some((r: string) => 
            r.toLowerCase().includes((region as string).toLowerCase())
          )
        );
      }

      if (vehicleType) {
        vehicles = vehicles.filter((v: any) => 
          v.vehicleType && v.vehicleType.toLowerCase().includes((vehicleType as string).toLowerCase())
        );
      }

      if (minCapacity) {
        vehicles = vehicles.filter((v: any) => 
          parseFloat(v.capacity) >= parseFloat(minCapacity as string)
        );
      }

      if (maxPricePerKm) {
        vehicles = vehicles.filter((v: any) => 
          parseFloat(v.pricePerKm) <= parseFloat(maxPricePerKm as string)
        );
      }

      // Only return available vehicles
      vehicles = vehicles.filter((v: any) => v.status === 'available');

      res.json({ vehicles });
    } catch (error) {
      console.error('Failed to fetch available vehicles:', error);
      res.status(500).json({ error: 'Failed to fetch available vehicles' });
    }
  }

  async bookVehicle(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const bookingData = {
        id: uuidv4(),
        bookerId: userId,
        bookerRole: req.user!.role,
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamoDBService.put(
        process.env.DYNAMODB_STORAGE_TABLE!,
        { ...bookingData, type: 'vehicle_booking' }
      );

      res.json({ booking: bookingData });
    } catch (error) {
      console.error('Failed to book vehicle:', error);
      res.status(500).json({ error: 'Failed to book vehicle' });
    }
  }

  async getMyVehicleBookings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const allItems = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!
      );

      const bookings = allItems.filter((item: any) => 
        item.type === 'vehicle_booking' && item.bookerId === userId
      );

      res.json({ bookings });
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  async getTransporterBookings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const allItems = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!
      );

      const bookings = allItems.filter((item: any) => 
        item.type === 'vehicle_booking' && item.transporterId === userId
      );

      res.json({ bookings });
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  async updateBookingStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;

      // Verify ownership
      const booking = await dynamoDBService.get(
        process.env.DYNAMODB_STORAGE_TABLE!,
        { id }
      );

      if (!booking || booking.transporterId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Update booking status
      const updated = await dynamoDBService.update(
        process.env.DYNAMODB_STORAGE_TABLE!,
        { id },
        'SET #status = :status, updatedAt = :updatedAt',
        {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
        },
        {
          '#status': 'status'
        }
      );

      // Update vehicle status based on booking status
      if (booking.vehicleId) {
        let vehicleStatus = 'available';
        
        if (status === 'confirmed') {
          vehicleStatus = 'in_use';
        } else if (status === 'completed' || status === 'rejected') {
          vehicleStatus = 'available';
        }

        // Update vehicle status
        await dynamoDBService.update(
          process.env.DYNAMODB_STORAGE_TABLE!,
          { id: booking.vehicleId },
          'SET #status = :status, updatedAt = :updatedAt',
          {
            ':status': vehicleStatus,
            ':updatedAt': new Date().toISOString(),
          },
          {
            '#status': 'status'
          }
        );
      }

      res.json({ booking: updated });
    } catch (error) {
      console.error('Failed to update booking status:', error);
      res.status(500).json({ error: 'Failed to update booking status' });
    }
  }
}


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
        vehicleCapacity,
        shipments,
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
}

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dynamoDBService } from '../services/aws/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';

export class StorageController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const facilities = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!,
        'providerId = :providerId',
        { ':providerId': userId }
      );

      const totalCapacity = facilities.reduce((sum: number, f: any) => sum + (f.capacity || 0), 0);
      const totalOccupied = facilities.reduce((sum: number, f: any) => sum + (f.occupied || 0), 0);
      const utilization = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

      const alerts = facilities.filter((f: any) => f.utilization > 90 || f.temperatureAlert);

      res.json({
        stats: {
          totalCapacity,
          occupied: totalOccupied,
          utilization: Math.round(utilization),
          activeAlerts: alerts.length,
        },
        facilities: facilities.slice(0, 5),
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  async getFacilities(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const facilities = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!,
        'providerId = :providerId',
        { ':providerId': userId }
      );

      res.json({ facilities });
    } catch (error) {
      console.error('Get facilities error:', error);
      res.status(500).json({ error: 'Failed to fetch facilities' });
    }
  }

  async createFacility(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const facility = {
        id: uuidv4(),
        providerId: userId,
        ...req.body,
        occupied: 0,
        utilization: 0,
        createdAt: new Date().toISOString(),
      };

      await dynamoDBService.put(process.env.DYNAMODB_STORAGE_TABLE!, facility);

      res.status(201).json({ facility });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create facility' });
    }
  }

  async getBookings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      const bookings = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!,
        'providerId = :providerId AND entityType = :entityType',
        { ':providerId': userId, ':entityType': 'booking' }
      );

      res.json({ bookings });
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  async createBooking(req: AuthRequest, res: Response) {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const { facilityId, product, quantity, duration, startDate } = req.body;

        // If no facilityId provided, get the first available facility
        let targetFacilityId = facilityId;

        if (!targetFacilityId) {
          const facilities = await dynamoDBService.scan(process.env.DYNAMODB_STORAGE_TABLE!);
          const availableFacilities = facilities.filter((item: any) => 
            item.capacity && item.providerId && !item.entityType &&
            (item.capacity - (item.occupied || 0)) >= (quantity || 100)
          );

          if (availableFacilities.length === 0) {
            return res.status(404).json({ error: 'No available facilities found' });
          }

          targetFacilityId = availableFacilities[0].id;
        }

        // Get the facility to check availability
        const facility = await dynamoDBService.get(
          process.env.DYNAMODB_STORAGE_TABLE!,
          { id: targetFacilityId }
        );

        if (!facility) {
          return res.status(404).json({ error: 'Facility not found' });
        }

        const availableCapacity = facility.capacity - (facility.occupied || 0);
        const requestedQuantity = quantity || 100;

        if (requestedQuantity > availableCapacity) {
          return res.status(400).json({ 
            error: 'Insufficient capacity',
            available: availableCapacity,
            requested: requestedQuantity
          });
        }

        const booking = {
          id: uuidv4(),
          facilityId: targetFacilityId,
          facilityName: facility.name,
          farmerId: userRole === 'farmer' ? userId : undefined,
          buyerId: userRole === 'buyer' ? userId : undefined,
          product: product || 'General Produce',
          quantity: requestedQuantity,
          duration: duration || 30,
          startDate: startDate || new Date().toISOString(),
          status: 'active',
          totalCost: requestedQuantity * (facility.pricePerQuintal || 20) * (duration || 30),
          createdAt: new Date().toISOString(),
        };

        await dynamoDBService.put(process.env.DYNAMODB_STORAGE_TABLE!, booking);

        // Update facility occupied space
        const newOccupied = (facility.occupied || 0) + requestedQuantity;
        const newUtilization = (newOccupied / facility.capacity) * 100;

        await dynamoDBService.update(
          process.env.DYNAMODB_STORAGE_TABLE!,
          { id: targetFacilityId },
          'SET occupied = :occupied, utilization = :utilization',
          {
            ':occupied': newOccupied,
            ':utilization': newUtilization,
          }
        );

        res.status(201).json({ booking });
      } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
      }
    }


  async updateBooking(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await dynamoDBService.update(
        process.env.DYNAMODB_STORAGE_TABLE!,
        { id },
        'SET #status = :status, updatedAt = :updatedAt',
        { ':status': status, ':updatedAt': new Date().toISOString() }
      );

      res.json({ booking: updated });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update booking' });
    }
  }

  async getStorageRequests(req: AuthRequest, res: Response) {
    try {
      const requests = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!,
        'entityType = :entityType AND #status = :status',
        { ':entityType': 'request', ':status': 'pending' }
      );

      res.json({ requests });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch storage requests' });
    }
  }

  async acceptRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { facilityId } = req.body;

      const updated = await dynamoDBService.update(
        process.env.DYNAMODB_STORAGE_TABLE!,
        { id },
        'SET facilityId = :facilityId, #status = :status, acceptedAt = :acceptedAt',
        {
          ':facilityId': facilityId,
          ':status': 'accepted',
          ':acceptedAt': new Date().toISOString(),
        }
      );

      res.json({ request: updated });
    } catch (error) {
      res.status(500).json({ error: 'Failed to accept request' });
    }
  }

  async getIoTData(req: AuthRequest, res: Response) {
    try {
      const { facilityId } = req.params;

      // Mock IoT data - in production, query from IoT Core/Timestream
      const iotData = {
        current: {
          temperature: 4,
          humidity: 85,
          timestamp: new Date().toISOString(),
        },
        history: [
          { timestamp: '2026-02-27T00:00:00Z', temperature: 4, humidity: 85 },
          { timestamp: '2026-02-27T06:00:00Z', temperature: 4.5, humidity: 84 },
          { timestamp: '2026-02-27T12:00:00Z', temperature: 5, humidity: 86 },
          { timestamp: '2026-02-27T18:00:00Z', temperature: 4.2, humidity: 85 },
        ],
      };

      res.json({ iotData });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch IoT data' });
    }
  }

  async getAvailableWarehouses(req: AuthRequest, res: Response) {
    try {
      // Get all facilities that have available capacity
      const allFacilities = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!
      );

      // Filter to only include facilities (not bookings or other entities)
      let facilities = allFacilities.filter((item: any) => 
        item.capacity && item.providerId && !item.entityType
      );

      // If no facilities exist, create some sample data
      if (facilities.length === 0) {
        const sampleFacilities = [
          {
            id: uuidv4(),
            providerId: 'sample-provider-1',
            name: 'Punjab Cold Storage',
            location: 'Ludhiana, Punjab',
            capacity: 5000,
            occupied: 2000,
            utilization: 40,
            pricePerQuintal: 25,
            facilityType: 'Cold Storage',
            temperature: 4,
            features: ['Temperature Control', 'Pest Control', 'Security'],
            createdAt: new Date().toISOString()
          },
          {
            id: uuidv4(),
            providerId: 'sample-provider-2',
            name: 'Haryana Grain Warehouse',
            location: 'Karnal, Haryana',
            capacity: 8000,
            occupied: 3000,
            utilization: 37.5,
            pricePerQuintal: 20,
            facilityType: 'Grain Storage',
            features: ['Moisture Control', 'Quality Testing', 'Loading Dock'],
            createdAt: new Date().toISOString()
          }
        ];

        // Store sample facilities
        for (const facility of sampleFacilities) {
          await dynamoDBService.put(process.env.DYNAMODB_STORAGE_TABLE!, facility);
        }

        facilities = sampleFacilities;
      }

      res.json({ facilities });
    } catch (error) {
      console.error('Get available warehouses error:', error);
      res.status(500).json({ error: 'Failed to fetch available warehouses' });
    }
  }

  async getMyBookings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Get all bookings from storage table
      const allBookings = await dynamoDBService.scan(
        process.env.DYNAMODB_STORAGE_TABLE!
      );

      // Filter bookings where the user is the farmer/buyer (not the provider)
      const bookings = allBookings.filter((booking: any) => 
        booking.farmerId === userId || booking.buyerId === userId
      );

      console.log(`Found ${bookings.length} bookings for user ${userId}`);
      res.json({ bookings });
    } catch (error) {
      console.error('Get my bookings error:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }
}

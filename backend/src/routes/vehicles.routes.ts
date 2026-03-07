import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { dynamoDBService } from '../services/aws/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all available vehicles
router.get('/', authenticate, async (req, res) => {
  try {
    // Get all vehicles
    const allItems = await dynamoDBService.scan(process.env.DYNAMODB_ORDERS_TABLE!);
    
    // Filter for vehicles
    let vehicles = allItems.filter((item: any) => 
      item.type === 'vehicle' && item.status === 'available'
    );

    // If no vehicles exist, create some sample data
    if (vehicles.length === 0) {
      const sampleVehicles = [
        {
          id: uuidv4(),
          type: 'vehicle',
          vehicleType: 'Truck',
          model: 'Tata 407',
          capacity: 2500,
          pricePerKm: 15,
          location: 'Ludhiana, Punjab',
          driverName: 'Rajesh Kumar',
          driverPhone: '+91-9876543210',
          rating: 4.3,
          status: 'available',
          features: ['GPS Tracking', 'Covered', 'Insurance'],
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          type: 'vehicle',
          vehicleType: 'Mini Truck',
          model: 'Mahindra Bolero Pickup',
          capacity: 1000,
          pricePerKm: 12,
          location: 'Karnal, Haryana',
          driverName: 'Suresh Singh',
          driverPhone: '+91-9876543211',
          rating: 4.1,
          status: 'available',
          features: ['Open Body', 'Local Area Expert'],
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          type: 'vehicle',
          vehicleType: 'Large Truck',
          model: 'Ashok Leyland',
          capacity: 5000,
          pricePerKm: 25,
          location: 'Delhi NCR',
          driverName: 'Amit Sharma',
          driverPhone: '+91-9876543212',
          rating: 4.6,
          status: 'available',
          features: ['Long Distance', 'Refrigerated', 'GPS Tracking'],
          createdAt: new Date().toISOString()
        }
      ];

      // Store sample vehicles
      for (const vehicle of sampleVehicles) {
        await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, vehicle);
      }

      vehicles = sampleVehicles;
    }

    res.json({ vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get vehicle details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });

    if (!vehicle || vehicle.type !== 'vehicle') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Get vehicle details error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle details' });
  }
});

// Book vehicle
router.post('/:id/book', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { 
      pickupLocation, 
      deliveryLocation, 
      pickupDate, 
      estimatedDistance,
      cropType,
      quantity 
    } = req.body;

    const vehicle = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });

    if (!vehicle || vehicle.type !== 'vehicle') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.status !== 'available') {
      return res.status(400).json({ error: 'Vehicle not available' });
    }

    if (quantity > vehicle.capacity) {
      return res.status(400).json({ error: 'Quantity exceeds vehicle capacity' });
    }

    const booking = {
      id: uuidv4(),
      type: 'vehicle_booking',
      userId,
      vehicleId: id,
      vehicleModel: vehicle.model,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      pickupLocation,
      deliveryLocation,
      pickupDate,
      estimatedDistance,
      cropType,
      quantity,
      totalCost: estimatedDistance * vehicle.pricePerKm,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, booking);

    // Update vehicle status
    const updatedVehicle = {
      ...vehicle,
      status: 'booked',
      currentBooking: booking.id,
      updatedAt: new Date().toISOString()
    };

    await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, updatedVehicle);

    res.status(201).json({ booking });
  } catch (error) {
    console.error('Book vehicle error:', error);
    res.status(500).json({ error: 'Failed to book vehicle' });
  }
});

export default router;
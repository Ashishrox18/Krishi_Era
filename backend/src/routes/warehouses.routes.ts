import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { dynamoDBService } from '../services/aws/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all available warehouses
router.get('/', authenticate, async (req, res) => {
  try {
    // Get all storage facilities
    const facilities = await dynamoDBService.scan(process.env.DYNAMODB_ORDERS_TABLE!);
    
    // Filter for warehouse/storage facilities
    const warehouses = facilities.filter((item: any) => 
      item.type === 'warehouse' || item.type === 'storage_facility'
    );

    // If no warehouses exist, create some sample data
    if (warehouses.length === 0) {
      const sampleWarehouses = [
        {
          id: uuidv4(),
          type: 'warehouse',
          name: 'Punjab Central Warehouse',
          location: 'Ludhiana, Punjab',
          capacity: 10000,
          availableCapacity: 7500,
          pricePerQuintal: 50,
          facilities: ['Cold Storage', 'Pest Control', 'Quality Testing'],
          rating: 4.5,
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          type: 'warehouse',
          name: 'Haryana Grain Storage',
          location: 'Karnal, Haryana',
          capacity: 15000,
          availableCapacity: 12000,
          pricePerQuintal: 45,
          facilities: ['Moisture Control', 'Security', 'Loading Dock'],
          rating: 4.2,
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          type: 'warehouse',
          name: 'Delhi Modern Storage',
          location: 'Ghaziabad, Delhi NCR',
          capacity: 8000,
          availableCapacity: 5000,
          pricePerQuintal: 60,
          facilities: ['Climate Control', 'CCTV', 'Fire Safety'],
          rating: 4.7,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];

      // Store sample warehouses
      for (const warehouse of sampleWarehouses) {
        await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, warehouse);
      }

      res.json({ warehouses: sampleWarehouses });
    } else {
      res.json({ warehouses });
    }
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// Get warehouse details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });

    if (!warehouse || (warehouse.type !== 'warehouse' && warehouse.type !== 'storage_facility')) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ warehouse });
  } catch (error) {
    console.error('Get warehouse details error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse details' });
  }
});

// Book warehouse space
router.post('/:id/book', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { quantity, duration, startDate, cropType } = req.body;

    const warehouse = await dynamoDBService.get(process.env.DYNAMODB_ORDERS_TABLE!, { id });

    if (!warehouse || warehouse.type !== 'warehouse') {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    if (warehouse.availableCapacity < quantity) {
      return res.status(400).json({ error: 'Insufficient warehouse capacity' });
    }

    const booking = {
      id: uuidv4(),
      type: 'warehouse_booking',
      userId,
      warehouseId: id,
      warehouseName: warehouse.name,
      quantity,
      duration,
      startDate,
      cropType,
      totalCost: quantity * warehouse.pricePerQuintal * duration,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, booking);

    // Update warehouse capacity
    const updatedWarehouse = {
      ...warehouse,
      availableCapacity: warehouse.availableCapacity - quantity,
      updatedAt: new Date().toISOString()
    };

    await dynamoDBService.put(process.env.DYNAMODB_ORDERS_TABLE!, updatedWarehouse);

    res.status(201).json({ booking });
  } catch (error) {
    console.error('Book warehouse error:', error);
    res.status(500).json({ error: 'Failed to book warehouse' });
  }
});

export default router;
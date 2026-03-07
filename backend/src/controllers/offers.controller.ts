import { Request, Response } from 'express';
import { dynamoDBService } from '../services/aws/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsController } from './notifications.controller';

// Helper function to get table name
const getTableName = () => {
  const tableName = process.env.DYNAMODB_ORDERS_TABLE;
  if (!tableName) {
    throw new Error('DYNAMODB_ORDERS_TABLE environment variable is not set');
  }
  return tableName;
};

export class OffersController {
  // Submit an offer for a farmer listing
  async submitOffer(req: Request, res: Response) {
    try {
      const { listingId, pricePerUnit, quantity, quantityUnit, message } = req.body;
      const buyerId = (req as any).user.id;
      const OFFERS_TABLE = getTableName();

      // Get the listing to include crop details in the offer
      const listing = await dynamoDBService.get(getTableName(), { id: listingId });
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      const offer = {
        id: uuidv4(),
        listingId,
        buyerId,
        buyerName: (req as any).user.name,
        farmerId: listing.farmerId, // Store farmer ID for easy filtering
        cropType: listing.cropType, // Store crop details
        variety: listing.variety,
        qualityGrade: listing.qualityGrade,
        pickupLocation: listing.pickupLocation,
        cropId: listing.cropId, // Pass along the cropId from listing
        pricePerUnit,
        quantity,
        quantityUnit,
        totalAmount: pricePerUnit * quantity,
        message,
        status: 'pending',
        negotiationHistory: [],
        type: 'offer', // Add type to distinguish from other records
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(getTableName(), offer);

      // Send notification to the farmer
      try {
        if (listing.farmerId) {
          await NotificationsController.createNotification({
            userId: listing.farmerId,
            title: 'New Offer Received',
            message: `${(req as any).user.name} offered ₹${pricePerUnit}/${quantityUnit} for your ${listing.cropType}`,
            type: 'offer',
            relatedId: listingId,
            link: `/farmer/listing/${listingId}`
          });
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the request if notifications fail
      }

      res.json({ success: true, offer });
    } catch (error) {
      console.error('Error submitting offer:', error);
      res.status(500).json({ error: 'Failed to submit offer' });
    }
  }

  // Get all offers for a listing
  async getOffersForListing(req: Request, res: Response) {
    try {
      const { listingId } = req.params;
      const OFFERS_TABLE = getTableName();

      console.log(`📋 Fetching offers for listing: ${listingId}`);
      console.log(`📋 Using table: ${OFFERS_TABLE}`);

      if (!OFFERS_TABLE) {
        console.error('❌ DYNAMODB_ORDERS_TABLE environment variable is not set');
        return res.status(500).json({ error: 'Database configuration error' });
      }

      // Get all items from the table
      const allItems = await dynamoDBService.scan(OFFERS_TABLE);
      console.log(`📋 Total items in table: ${allItems.length}`);
      
      // Filter for offers with the specific listingId
      // Accept both offers with type='offer' AND offers without type field (backward compatibility)
      const offers = allItems.filter((item: any) => {
        const isOffer = item.listingId === listingId && 
          (item.type === 'offer' || (!item.type && item.buyerId));
        
        if (isOffer) {
          console.log(`✅ Found offer: ${item.id} - Status: ${item.status}`);
        }
        
        return isOffer;
      });

      console.log(`✅ Found ${offers.length} offers for listing ${listingId}`);

      res.json({ success: true, offers });
    } catch (error: any) {
      console.error('❌ Error getting offers:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      res.status(500).json({ 
        error: 'Failed to get offers',
        details: error.message 
      });
    }
  }

  // Get buyer's own offers
  async getMyOffers(req: Request, res: Response) {
    try {
      const buyerId = (req as any).user.id;
      const tableName = getTableName();

      console.log(`🛍️ Fetching offers for buyer: ${buyerId}`);

      // Scan for offers with the specific buyerId
      const allItems = await dynamoDBService.scan(tableName);
      
      // Filter for offers - backward compatible
      const offers = allItems.filter((item: any) => 
        item.buyerId === buyerId && 
        (item.type === 'offer' || (!item.type && item.listingId)) // Backward compatible
      );

      console.log(`✅ Found ${offers.length} offers for buyer ${buyerId}`);

      // Get listing details for each offer
      const offersWithListings = await Promise.all(
        offers.map(async (offer: any) => {
          try {
            const listing = await dynamoDBService.get(tableName, { id: offer.listingId });
            return {
              ...offer,
              listing: listing ? {
                id: listing.id,
                cropType: listing.cropType,
                variety: listing.variety,
                farmerId: listing.farmerId,
                status: listing.status,
                pickupLocation: listing.pickupLocation
              } : null
            };
          } catch (error) {
            console.error('Error fetching listing for offer:', offer.id, error);
            return offer;
          }
        })
      );

      res.json({ success: true, offers: offersWithListings });
    } catch (error) {
      console.error('Error getting buyer offers:', error);
      res.status(500).json({ error: 'Failed to get offers' });
    }
  }

  // Update an offer (buyer)
  async updateOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const { pricePerUnit, quantity, message } = req.body;
      const buyerId = (req as any).user.id;
      const tableName = getTableName();

      console.log('📝 Updating offer:', { offerId, buyerId, pricePerUnit, quantity });

      const offer = await dynamoDBService.get(tableName, { id: offerId });

      if (!offer || offer.buyerId !== buyerId) {
        console.error('❌ Offer not found or unauthorized');
        return res.status(404).json({ error: 'Offer not found' });
      }

      const updatedOffer = {
        ...offer,
        pricePerUnit,
        quantity,
        message,
        status: 'pending', // Reset status to pending when buyer updates
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(tableName, updatedOffer);

      // Get the listing to notify the farmer
      try {
        const listing = await dynamoDBService.get(tableName, { id: offer.listingId });
        if (listing && listing.farmerId) {
          await NotificationsController.createNotification({
            userId: listing.farmerId,
            title: 'Offer Updated',
            message: `${offer.buyerName} updated their offer to ₹${pricePerUnit}/${offer.quantityUnit} for your ${listing.cropType}`,
            type: 'offer',
            relatedId: listing.id,
            link: `/farmer/listing/${listing.id}`
          });
          console.log('✅ Notification sent to farmer:', listing.farmerId);
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the request if notifications fail
      }

      console.log('✅ Offer updated successfully');
      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      console.error('Error updating offer:', error);
      res.status(500).json({ error: 'Failed to update offer' });
    }
  }

  // Buyer proposes to award/purchase (sends proposal to farmer)
  async proposeAward(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const buyerId = (req as any).user.id;
      const tableName = getTableName();

      const offer = await dynamoDBService.get(tableName, { id: offerId });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Verify buyer owns this offer
      if (offer.buyerId !== buyerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Get the listing
      const listing = await dynamoDBService.get(tableName, { id: offer.listingId });
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Update offer status to 'proposed_award' (waiting for farmer approval)
      const updatedOffer = {
        ...offer,
        status: 'proposed_award',
        proposedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(tableName, updatedOffer);

      // Update listing status to 'pending_award'
      await dynamoDBService.put(tableName, {
        ...listing,
        status: 'pending_award',
        pendingAwardOfferId: offerId,
        updatedAt: new Date().toISOString()
      });

      // Send notification to farmer
      try {
        await NotificationsController.createNotification({
          userId: listing.farmerId,
          title: 'Award Proposal Received',
          message: `${offer.buyerName} wants to purchase your ${listing.cropType} at ₹${offer.pricePerUnit}/${offer.quantityUnit}. Review and accept or negotiate.`,
          type: 'award',
          relatedId: listing.id,
          link: `/farmer/listing/${listing.id}`
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      console.error('Error proposing award:', error);
      res.status(500).json({ error: 'Failed to propose award' });
    }
  }

  // Farmer accepts the offer (sends to buyer for final confirmation)
  async acceptAward(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const farmerId = (req as any).user.id;
      const tableName = getTableName();

      const offer = await dynamoDBService.get(tableName, { id: offerId });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Get the listing to verify farmer ownership
      const listing = await dynamoDBService.get(tableName, { id: offer.listingId });
      if (!listing || listing.farmerId !== farmerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Update offer status to 'farmer_accepted' (waiting for buyer confirmation)
      const updatedOffer = {
        ...offer,
        status: 'farmer_accepted',
        farmerAcceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(tableName, updatedOffer);

      // Update listing status to 'pending_buyer_confirmation'
      await dynamoDBService.put(tableName, {
        ...listing,
        status: 'pending_buyer_confirmation',
        pendingOfferId: offerId,
        updatedAt: new Date().toISOString()
      });

      // Send notification to buyer for confirmation
      try {
        await NotificationsController.createNotification({
          userId: offer.buyerId,
          title: 'Offer Accepted by Farmer!',
          message: `${(req as any).user.name} accepted your offer for ${listing.cropType} at ₹${offer.pricePerUnit}/${offer.quantityUnit}. Please confirm to finalize the deal.`,
          type: 'offer',
          relatedId: listing.id,
          link: `/buyer/farmer-listing/${listing.id}`
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      console.error('Error accepting offer:', error);
      res.status(500).json({ error: 'Failed to accept offer' });
    }
  }

  // Buyer confirms the accepted offer (finalizes the deal)
  async confirmAcceptedOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const buyerId = (req as any).user.id;
      const tableName = getTableName();

      const offer = await dynamoDBService.get(tableName, { id: offerId });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Verify buyer owns this offer
      if (offer.buyerId !== buyerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Verify offer is in farmer_accepted status
      if (offer.status !== 'farmer_accepted') {
        return res.status(400).json({ error: 'Offer is not ready for confirmation' });
      }

      // Get the listing
      const listing = await dynamoDBService.get(tableName, { id: offer.listingId });
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Update offer status to 'accepted' (finalized)
      const updatedOffer = {
        ...offer,
        status: 'accepted',
        buyerConfirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(tableName, updatedOffer);

      // Update listing status to 'awarded' (finalized)
      await dynamoDBService.put(tableName, {
        ...listing,
        status: 'awarded',
        awardedOfferId: offerId,
        awardedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update the crop status to 'sold' if cropId exists
      const cropId = listing.cropId || offer.cropId; // Try listing first, then offer
      if (cropId) {
        try {
          const cropsTable = process.env.DYNAMODB_CROPS_TABLE;
          const crop = await dynamoDBService.get(cropsTable!, { 
            id: cropId,
            userId: listing.farmerId 
          });
          
          if (crop) {
            await dynamoDBService.put(cropsTable!, {
              ...crop,
              status: 'sold',
              soldDate: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            console.log('✅ Crop status updated to sold:', cropId);
          } else {
            console.log('⚠️ Crop not found:', cropId);
          }
        } catch (cropError) {
          console.error('Failed to update crop status:', cropError);
          // Don't fail the deal if crop update fails
        }
      } else {
        console.log('⚠️ No cropId found in listing or offer');
      }

      // Send notifications about the finalized deal
      try {
        await Promise.all([
          NotificationsController.createNotification({
            userId: listing.farmerId,
            title: 'Deal Finalized!',
            message: `${offer.buyerName} confirmed the purchase of your ${listing.cropType} at ₹${offer.pricePerUnit}/${offer.quantityUnit}. Proceed with delivery arrangements.`,
            type: 'award',
            relatedId: listing.id,
            link: `/farmer/listing/${listing.id}`
          }),
          NotificationsController.createNotification({
            userId: buyerId,
            title: 'Deal Confirmed',
            message: `You confirmed the purchase of ${listing.cropType} from the farmer at ₹${offer.pricePerUnit}/${offer.quantityUnit}`,
            type: 'award',
            relatedId: listing.id,
            link: `/buyer/farmer-listing/${listing.id}`
          })
        ]);
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
      }

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      console.error('Error accepting award:', error);
      res.status(500).json({ error: 'Failed to accept award' });
    }
  }

  // Farmer sends counter offer
  async counterOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const { pricePerUnit, message } = req.body;
      const farmerId = (req as any).user.id;
      const tableName = getTableName();

      const offer = await dynamoDBService.get(tableName, { id: offerId });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Get the listing to verify farmer ownership
      const listing = await dynamoDBService.get(tableName, { id: offer.listingId });
      if (!listing || listing.farmerId !== farmerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Add counter offer to negotiation history
      const negotiationHistory = offer.negotiationHistory || [];
      negotiationHistory.push({
        type: 'counter',
        by: 'farmer',
        price: pricePerUnit,
        message,
        timestamp: new Date().toISOString()
      });

      const updatedOffer = {
        ...offer,
        status: 'countered',
        negotiationHistory,
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(tableName, updatedOffer);

      // Update listing status to negotiating
      await dynamoDBService.put(tableName, {
        ...listing,
        status: 'negotiating',
        updatedAt: new Date().toISOString()
      });

      // Notify buyer of counter offer
      try {
        await NotificationsController.createNotification({
          userId: offer.buyerId,
          title: 'Counter Offer Received',
          message: `${(req as any).user.name} countered with ₹${pricePerUnit}/${offer.quantityUnit}`,
          type: 'offer',
          relatedId: listing.id,
          link: `/buyer/farmer-listing/${listing.id}`
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      console.error('Error sending counter offer:', error);
      res.status(500).json({ error: 'Failed to send counter offer' });
    }
  }

  // Delete an offer (for cancelling finalized sales)
  async deleteOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const userId = (req as any).user.id;
      const tableName = getTableName();

      console.log(`🗑️ Delete offer request - Offer ID: ${offerId}, User ID: ${userId}`);

      const offer = await dynamoDBService.get(tableName, { id: offerId });

      if (!offer) {
        console.error('❌ Offer not found:', offerId);
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Verify the user is either the farmer or buyer involved in this offer
      if (offer.farmerId !== userId && offer.buyerId !== userId) {
        console.error('❌ Unauthorized delete attempt');
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Instead of deleting, update status to 'cancelled'
      const updatedOffer = {
        ...offer,
        status: 'cancelled',
        cancelledBy: offer.farmerId === userId ? 'farmer' : 'buyer',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(tableName, updatedOffer);

      console.log('✅ Offer cancelled successfully');

      // If there's a listing, update its status back to open
      if (offer.listingId) {
        try {
          const listing = await dynamoDBService.get(tableName, { id: offer.listingId });
          if (listing && listing.status === 'awarded') {
            await dynamoDBService.put(tableName, {
              ...listing,
              status: 'open',
              updatedAt: new Date().toISOString()
            });
            console.log('✅ Listing status updated to open');
          }
        } catch (listingError) {
          console.error('Failed to update listing status:', listingError);
          // Don't fail the delete if listing update fails
        }
      }

      // Send notification to the other party
      try {
        const otherUserId = offer.farmerId === userId ? offer.buyerId : offer.farmerId;
        const userRole = offer.farmerId === userId ? 'farmer' : 'buyer';
        
        await NotificationsController.createNotification({
          userId: otherUserId,
          title: 'Sale Cancelled',
          message: `The ${userRole} has cancelled the sale for ${offer.cropType || 'the listing'}`,
          type: 'offer',
          relatedId: offer.listingId || offerId,
          link: userRole === 'farmer' ? `/buyer/farmer-listing/${offer.listingId}` : `/farmer/listing/${offer.listingId}`
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      res.json({ success: true, message: 'Offer cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling offer:', error);
      res.status(500).json({ error: 'Failed to cancel offer' });
    }
  }
}


import { Request, Response } from 'express';
import { dynamoDBService } from '../services/aws/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsController } from './notifications.controller';

// Use the singleton instance and proper table names
const OFFERS_TABLE = process.env.DYNAMODB_ORDERS_TABLE!; // Using orders table for offers
const ORDERS_TABLE = process.env.DYNAMODB_ORDERS_TABLE!;

export class OffersController {
  // Submit an offer for a farmer listing
  async submitOffer(req: Request, res: Response) {
    try {
      const { listingId, pricePerUnit, quantity, quantityUnit, message } = req.body;
      const buyerId = (req as any).user.id;

      const offer = {
        id: uuidv4(),
        listingId,
        buyerId,
        buyerName: (req as any).user.name,
        pricePerUnit,
        quantity,
        quantityUnit,
        message,
        status: 'pending',
        negotiationHistory: [],
        type: 'offer', // Add type to distinguish from other records
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(OFFERS_TABLE, offer);

      // Get the listing to notify the farmer
      try {
        const listing = await dynamoDBService.get(ORDERS_TABLE, { id: listingId });
        if (listing && listing.farmerId) {
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

      // Scan for offers with the specific listingId and type
      const offers = await dynamoDBService.scan(
        OFFERS_TABLE,
        'listingId = :listingId AND #type = :type',
        { ':listingId': listingId, ':type': 'offer' },
        { '#type': 'type' }
      );

      res.json({ success: true, offers });
    } catch (error) {
      console.error('Error getting offers:', error);
      res.status(500).json({ error: 'Failed to get offers' });
    }
  }

  // Update an offer (buyer)
  async updateOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const { pricePerUnit, quantity, message } = req.body;
      const buyerId = (req as any).user.id;

      const offer = await dynamoDBService.get(OFFERS_TABLE, { id: offerId });

      if (!offer || offer.buyerId !== buyerId) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      const updatedOffer = {
        ...offer,
        pricePerUnit,
        quantity,
        message,
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(OFFERS_TABLE, updatedOffer);

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      console.error('Error updating offer:', error);
      res.status(500).json({ error: 'Failed to update offer' });
    }
  }

  // Farmer accepts an offer
  async acceptOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const farmerId = (req as any).user.id;

      const offer = await dynamoDBService.get(OFFERS_TABLE, { id: offerId });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Get the listing to verify farmer ownership
      const listing = await dynamoDBService.get(ORDERS_TABLE, { id: offer.listingId });
      if (!listing || listing.farmerId !== farmerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Update offer status
      const updatedOffer = {
        ...offer,
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamoDBService.put(OFFERS_TABLE, updatedOffer);

      // Update listing status
      await dynamoDBService.put(ORDERS_TABLE, {
        ...listing,
        status: 'awarded',
        awardedOfferId: offerId,
        updatedAt: new Date().toISOString()
      });

      // Send notifications about the award
      try {
        await Promise.all([
          NotificationsController.createNotification({
            userId: offer.buyerId,
            title: 'Offer Accepted!',
            message: `${(req as any).user.name} accepted your offer of ₹${offer.pricePerUnit}/${offer.quantityUnit}`,
            type: 'award',
            relatedId: listing.id,
            link: `/buyer/farmer-listing/${listing.id}`
          }),
          NotificationsController.createNotification({
            userId: farmerId,
            title: 'Deal Awarded',
            message: `You awarded your ${listing.cropType} listing to ${offer.buyerName}`,
            type: 'award',
            relatedId: listing.id,
            link: `/farmer/listing/${listing.id}`
          })
        ]);
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
      }

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      console.error('Error accepting offer:', error);
      res.status(500).json({ error: 'Failed to accept offer' });
    }
  }

  // Farmer sends counter offer
  async counterOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const { pricePerUnit, message } = req.body;
      const farmerId = (req as any).user.id;

      const offer = await dynamoDBService.get(OFFERS_TABLE, { id: offerId });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Get the listing to verify farmer ownership
      const listing = await dynamoDBService.get(ORDERS_TABLE, { id: offer.listingId });
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

      await dynamoDBService.put(OFFERS_TABLE, updatedOffer);

      // Update listing status to negotiating
      await dynamoDBService.put(ORDERS_TABLE, {
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
}

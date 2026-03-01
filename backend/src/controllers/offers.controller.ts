import { Request, Response } from 'express';
import { DynamoDBService } from '../services/aws/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const dynamodb = new DynamoDBService();

export class OffersController {
  // Get all offers for a listing
  async getOffersForListing(req: Request, res: Response) {
    try {
      const { listingId } = req.params;

      const offers = await dynamodb.query('OFFERS', 'listingId = :listingId', {
        ':listingId': listingId
      });

      res.json({ success: true, offers });
    } catch (error) {
      logger.error('Error getting offers:', error);
      res.status(500).json({ error: 'Failed to get offers' });
    }
  }

  // Update an offer (buyer)
  async updateOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const { pricePerUnit, quantity, message } = req.body;
      const buyerId = (req as any).user.id;

      const offer = await dynamodb.get('OFFERS', { id: offerId });

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

      await dynamodb.put('OFFERS', updatedOffer);

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      logger.error('Error updating offer:', error);
      res.status(500).json({ error: 'Failed to update offer' });
    }
  }

  // Farmer accepts an offer
  async acceptOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const farmerId = (req as any).user.id;

      const offer = await dynamodb.get('OFFERS', { id: offerId });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Get the listing to verify farmer ownership
      const listing = await dynamodb.get('ORDERS', { id: offer.listingId });
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

      await dynamodb.put('OFFERS', updatedOffer);

      // Update listing status
      await dynamodb.put('ORDERS', {
        ...listing,
        status: 'awarded',
        awardedOfferId: offerId,
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      logger.error('Error accepting offer:', error);
      res.status(500).json({ error: 'Failed to accept offer' });
    }
  }

  // Farmer sends counter offer
  async counterOffer(req: Request, res: Response) {
    try {
      const { offerId } = req.params;
      const { pricePerUnit, message } = req.body;
      const farmerId = (req as any).user.id;

      const offer = await dynamodb.get('OFFERS', { id: offerId });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Get the listing to verify farmer ownership
      const listing = await dynamodb.get('ORDERS', { id: offer.listingId });
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

      await dynamodb.put('OFFERS', updatedOffer);

      // Update listing status to negotiating
      await dynamodb.put('ORDERS', {
        ...listing,
        status: 'negotiating',
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      logger.error('Error sending counter offer:', error);
      res.status(500).json({ error: 'Failed to send counter offer' });
    }
  }
}

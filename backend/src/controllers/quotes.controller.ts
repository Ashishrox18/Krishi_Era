import { Request, Response } from 'express';
import { DynamoDBService } from '../services/aws/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const dynamodb = new DynamoDBService();

export class QuotesController {
  // Submit a quote for a procurement request
  async submitQuote(req: Request, res: Response) {
    try {
      const { requestId, pricePerUnit, quantity, quantityUnit, message } = req.body;
      const farmerId = (req as any).user.id;

      const quote = {
        id: uuidv4(),
        requestId,
        farmerId,
        farmerName: (req as any).user.name,
        pricePerUnit,
        quantity,
        quantityUnit,
        message,
        status: 'pending',
        negotiationHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamodb.put('QUOTES', quote);

      res.json({ success: true, quote });
    } catch (error) {
      logger.error('Error submitting quote:', error);
      res.status(500).json({ error: 'Failed to submit quote' });
    }
  }

  // Get all quotes for a procurement request
  async getQuotesForRequest(req: Request, res: Response) {
    try {
      const { requestId } = req.params;

      const quotes = await dynamodb.query('QUOTES', 'requestId = :requestId', {
        ':requestId': requestId
      });

      res.json({ success: true, quotes });
    } catch (error) {
      logger.error('Error getting quotes:', error);
      res.status(500).json({ error: 'Failed to get quotes' });
    }
  }

  // Update a quote
  async updateQuote(req: Request, res: Response) {
    try {
      const { quoteId } = req.params;
      const { pricePerUnit, quantity, message } = req.body;
      const farmerId = (req as any).user.id;

      const quote = await dynamodb.get('QUOTES', { id: quoteId });

      if (!quote || quote.farmerId !== farmerId) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      const updatedQuote = {
        ...quote,
        pricePerUnit,
        quantity,
        message,
        updatedAt: new Date().toISOString()
      };

      await dynamodb.put('QUOTES', updatedQuote);

      res.json({ success: true, quote: updatedQuote });
    } catch (error) {
      logger.error('Error updating quote:', error);
      res.status(500).json({ error: 'Failed to update quote' });
    }
  }

  // Buyer accepts a quote (awards the contract)
  async acceptQuote(req: Request, res: Response) {
    try {
      const { quoteId } = req.params;
      const buyerId = (req as any).user.id;

      const quote = await dynamodb.get('QUOTES', { id: quoteId });

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Get the procurement request to verify buyer ownership
      const request = await dynamodb.get('ORDERS', { id: quote.requestId });
      if (!request || request.buyerId !== buyerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Update quote status
      const updatedQuote = {
        ...quote,
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamodb.put('QUOTES', updatedQuote);

      // Update procurement request status
      await dynamodb.put('ORDERS', {
        ...request,
        status: 'awarded',
        awardedQuoteId: quoteId,
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, quote: updatedQuote });
    } catch (error) {
      logger.error('Error accepting quote:', error);
      res.status(500).json({ error: 'Failed to accept quote' });
    }
  }

  // Buyer sends counter offer
  async counterOffer(req: Request, res: Response) {
    try {
      const { quoteId } = req.params;
      const { pricePerUnit, message } = req.body;
      const buyerId = (req as any).user.id;

      const quote = await dynamodb.get('QUOTES', { id: quoteId });

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Get the procurement request to verify buyer ownership
      const request = await dynamodb.get('ORDERS', { id: quote.requestId });
      if (!request || request.buyerId !== buyerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Add counter offer to negotiation history
      const negotiationHistory = quote.negotiationHistory || [];
      negotiationHistory.push({
        type: 'counter',
        by: 'buyer',
        price: pricePerUnit,
        message,
        timestamp: new Date().toISOString()
      });

      const updatedQuote = {
        ...quote,
        status: 'countered',
        negotiationHistory,
        updatedAt: new Date().toISOString()
      };

      await dynamodb.put('QUOTES', updatedQuote);

      // Update procurement request status to negotiating
      await dynamodb.put('ORDERS', {
        ...request,
        status: 'negotiating',
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, quote: updatedQuote });
    } catch (error) {
      logger.error('Error sending counter offer:', error);
      res.status(500).json({ error: 'Failed to send counter offer' });
    }
  }

  // Farmer accepts buyer's counter offer
  async acceptCounterOffer(req: Request, res: Response) {
    try {
      const { quoteId } = req.params;
      const { pricePerUnit } = req.body;
      const farmerId = (req as any).user.id;

      const quote = await dynamodb.get('QUOTES', { id: quoteId });

      if (!quote || quote.farmerId !== farmerId) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Update quote with accepted counter offer price
      const updatedQuote = {
        ...quote,
        pricePerUnit,
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dynamodb.put('QUOTES', updatedQuote);

      // Update procurement request status to awarded
      const request = await dynamodb.get('ORDERS', { id: quote.requestId });
      if (request) {
        await dynamodb.put('ORDERS', {
          ...request,
          status: 'awarded',
          awardedQuoteId: quoteId,
          updatedAt: new Date().toISOString()
        });
      }

      res.json({ success: true, quote: updatedQuote });
    } catch (error) {
      logger.error('Error accepting counter offer:', error);
      res.status(500).json({ error: 'Failed to accept counter offer' });
    }
  }
}

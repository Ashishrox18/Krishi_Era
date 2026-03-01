import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import farmerRoutes from './routes/farmer.routes';
import buyerRoutes from './routes/buyer.routes';
import transporterRoutes from './routes/transporter.routes';
import storageRoutes from './routes/storage.routes';
import adminRoutes from './routes/admin.routes';
import aiRoutes from './routes/ai.routes';
import quotesRoutes from './routes/quotes.routes';
import offersRoutes from './routes/offers.routes';

// Load environment variables from backend/.env
const envPath = path.resolve(__dirname, '../.env');
console.log('🔍 Loading .env from:', envPath);
dotenv.config({ path: envPath });
console.log('🔍 After dotenv - USE_GROQ:', process.env.USE_GROQ);
console.log('🔍 After dotenv - GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/transporter', transporterRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/offers', offersRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

export default app;

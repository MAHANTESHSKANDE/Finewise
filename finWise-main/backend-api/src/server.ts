/**
 * Express Server for PocketBudget API
 * Connects React Native app to Azure SQL Database
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import budgetRoutes from './routes/budgets';
import expenseRoutes from './routes/expenses';
import { getConnection } from './database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// Configure CORS for React Native development
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false // Set to false for development
}));

app.use(morgan('combined'));
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log(`📋 Headers:`, req.headers);
  next();
});

// Handle preflight requests for all routes
app.options('*', cors());

// Routes
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await getConnection();
    res.json({
      status: 'healthy',
      message: 'API server is running and database is connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PocketBudget API Server',
    version: '1.0.0',
    endpoints: {
      budgets: '/api/budgets',
      expenses: '/api/expenses',
      health: '/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server - Listen on all network interfaces for Android emulator access
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 PocketBudget API server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 API endpoints: http://localhost:${PORT}/api`);
  console.log(`🤖 Android Emulator: http://10.0.2.2:${PORT}/api`);
  console.log(`📱 Network access: http://0.0.0.0:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

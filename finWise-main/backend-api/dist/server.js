"use strict";
/**
 * Express Server for PocketBudget API
 * Connects React Native app to Azure SQL Database
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const budgets_1 = __importDefault(require("./routes/budgets"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const database_1 = require("./database");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
// Routes
app.use('/api/budgets', budgets_1.default);
app.use('/api/expenses', expenses_1.default);
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await (0, database_1.getConnection)();
        res.json({
            status: 'healthy',
            message: 'API server is running and database is connected',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
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
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 PocketBudget API server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📱 API endpoints: http://localhost:${PORT}/api`);
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

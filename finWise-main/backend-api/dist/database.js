"use strict";
/**
 * Azure SQL Database Configuration for Backend API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = void 0;
exports.getConnection = getConnection;
exports.closeConnection = closeConnection;
const mssql_1 = __importDefault(require("mssql"));
exports.sql = mssql_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Azure SQL Database configuration
const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: 1433,
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false,
        enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};
// Connection pool
let pool = null;
/**
 * Get or create database connection pool
 */
async function getConnection() {
    try {
        if (pool && pool.connected) {
            return pool;
        }
        if (pool && !pool.connected) {
            await pool.close();
        }
        console.log('Creating new Azure SQL connection...');
        pool = new mssql_1.default.ConnectionPool(config);
        await pool.connect();
        console.log('✅ Connected to Azure SQL Database successfully!');
        return pool;
    }
    catch (error) {
        console.error('❌ Failed to connect to Azure SQL Database:', error);
        throw error;
    }
}
/**
 * Close database connection
 */
async function closeConnection() {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('✅ Azure SQL connection closed');
        }
    }
    catch (error) {
        console.error('❌ Error closing Azure SQL connection:', error);
        throw error;
    }
}

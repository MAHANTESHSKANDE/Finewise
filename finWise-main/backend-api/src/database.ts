/**
 * Azure SQL Database Configuration for Backend API
 */

import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Azure SQL Database configuration
const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
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
let pool: sql.ConnectionPool | null = null;

/**
 * Get or create database connection pool
 */
export async function getConnection(): Promise<sql.ConnectionPool> {
  try {
    if (pool && pool.connected) {
      return pool;
    }

    if (pool && !pool.connected) {
      await pool.close();
    }

    console.log('Creating new Azure SQL connection...');
    pool = new sql.ConnectionPool(config);
    
    await pool.connect();
    console.log('✅ Connected to Azure SQL Database successfully!');
    
    return pool;
  } catch (error) {
    console.error('❌ Failed to connect to Azure SQL Database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✅ Azure SQL connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing Azure SQL connection:', error);
    throw error;
  }
}

export { sql };

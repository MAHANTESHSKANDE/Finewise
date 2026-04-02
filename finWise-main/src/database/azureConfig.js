/**
 * Azure SQL Database Configuration
 */

const sql = require('mssql');

// Azure SQL Database configuration
const config = {
  server: 'pocketbudgetserver.database.windows.net',
  database: 'pocketbudgetserver',
  user: 'CloudSA0477a8b8', // Your admin username from Azure portal
  password: 'YOUR_PASSWORD_HERE', // Replace with your actual password
  port: 1433,
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: false, // For Azure SQL
    enableArithAbort: true,
  },
  connectionTimeout: 30000, // 30 seconds
  requestTimeout: 30000, // 30 seconds
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
async function closeConnection() {
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

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const connection = await getConnection();
    const result = await connection.request().query('SELECT 1 as test');
    
    console.log('✅ Database connection test successful:', result.recordset);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

module.exports = {
  getConnection,
  closeConnection,
  testConnection,
  sql
};

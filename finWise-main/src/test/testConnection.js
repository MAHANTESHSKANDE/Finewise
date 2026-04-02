/**
 * Azure SQL Database Connection Test
 */

const sql = require('mssql');

// Azure SQL Database configuration with correct admin credentials
const config = {
  server: 'pocketbudgetserver.database.windows.net',
  database: 'pocketbudgetserver',
  user: 'CloudSA0477a8b8', // Server admin login from Azure portal
  password: 'Password@123', // Your Azure SQL admin password
  port: 1433,
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: false, // For Azure SQL
    enableArithAbort: true,
  },
  connectionTimeout: 30000, // 30 seconds
  requestTimeout: 30000, // 30 seconds
};

async function testConnection() {
  console.log('🔍 Testing Azure SQL Database connection...\n');

  try {
    // Create connection pool
    console.log('Creating connection to Azure SQL Database...');
    const pool = new sql.ConnectionPool(config);
    
    // Connect to database
    await pool.connect();
    console.log('✅ Connected to Azure SQL Database successfully!');

    // Test basic query
    console.log('\n🔍 Running test query...');
    const result = await pool.request().query('SELECT 1 as test, GETDATE() as current_datetime');
    console.log('✅ Test query result:', result.recordset[0]);

    // Check database version
    console.log('\n📊 Getting database information...');
    const versionResult = await pool.request().query('SELECT @@VERSION as version');
    console.log('Database Version:', versionResult.recordset[0].version);

    // Check current database
    const dbResult = await pool.request().query('SELECT DB_NAME() as database_name');
    console.log('Current Database:', dbResult.recordset[0].database_name);

    console.log('\n✅ All connection tests passed successfully!');
    console.log('🎉 Azure SQL Database is ready for use!\n');

    // Close connection
    await pool.close();
    console.log('✅ Connection closed');

  } catch (error) {
    console.error('\n❌ Connection test failed with error:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'ELOGIN') {
      console.log('\n🔑 This looks like a login failure. Possible causes:');
      console.log('1. Wrong password for user CloudSA0477a8b8');
      console.log('2. Azure AD-only authentication is still enabled');
      console.log('3. SQL Server authentication is not enabled');
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check if you remember the password you set when creating the server');
    console.log('2. Try resetting the admin password in Azure Portal');
    console.log('3. Ensure SQL Server authentication is enabled');
  }
}

// Run the test
testConnection().then(() => {
  console.log('Connection test completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Connection test failed:', error);
  process.exit(1);
});

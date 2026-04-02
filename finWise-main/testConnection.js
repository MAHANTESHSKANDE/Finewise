/**
 * Azure SQL Database Connection Test
 */

const sql = require('mssql');

// Azure SQL Database configuration with correct admin credentials
const config = {
  server: 'pocketbudgetserver.database.windows.net',
  database: 'pocketbudgetserver',
  user: 'CloudSA0477a8b8', // Your server admin login
  password: 'Password@123', // ⚠️ YOU NEED TO ADD YOUR ADMIN PASSWORD HERE
  port: 1433,
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

async function testConnection() {
  console.log('🔍 Testing Azure SQL Database connection...\n');
  console.log('Using credentials:');
  console.log('- Server:', config.server);
  console.log('- Database:', config.database);
  console.log('- User:', config.user);
  console.log('- Password:', config.password ? '***set***' : '❌ NOT SET - YOU NEED TO ADD IT!');

  if (!config.password) {
    console.log('\n❌ ERROR: Password is not set!');
    console.log('Please edit this file and add your Azure SQL admin password.');
    console.log('This is the password you set when creating the Azure SQL server.');
    return;
  }

  try {
    console.log('\n🔌 Attempting to connect...');
    const pool = new sql.ConnectionPool(config);
    
    await pool.connect();
    console.log('✅ Connected to Azure SQL Database successfully!');

    // Test basic query
    console.log('\n🔍 Running test query...');
    const result = await pool.request().query('SELECT 1 as test, GETDATE() as current_datetime');
    console.log('✅ Test query result:', result.recordset[0]);

    // Check database version
    console.log('\n📊 Getting database information...');
    const versionResult = await pool.request().query('SELECT @@VERSION as version');
    console.log('Database Version:', versionResult.recordset[0].version.substring(0, 100) + '...');

    // Check current database
    const dbResult = await pool.request().query('SELECT DB_NAME() as database_name');
    console.log('Current Database:', dbResult.recordset[0].database_name);

    // Check available tables
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);

    console.log('\n📋 Existing Tables:');
    if (tablesResult.recordset.length === 0) {
      console.log('  No tables found (this is expected for a new database)');
    } else {
      tablesResult.recordset.forEach(table => {
        console.log(`  - ${table.TABLE_NAME}`);
      });
    }

    console.log('\n✅ All connection tests passed successfully!');
    console.log('🎉 Azure SQL Database is ready for use!\n');

    // Close connection
    await pool.close();
    console.log('✅ Connection closed');

  } catch (error) {
    console.error('\n❌ Connection test failed with error:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    console.log('\n🔧 Troubleshooting tips:');
    
    if (error.message.includes('Azure Active Directory only authentication')) {
      console.log('1. ⚠️  Azure AD-only authentication is still enabled');
      console.log('   - Go to Azure Portal → SQL Server → Settings → Authentication');
      console.log('   - Enable "SQL and Azure AD authentication"');
    } else if (error.message.includes('Login failed')) {
      console.log('1. ❌ Login credentials are incorrect');
      console.log('   - Verify the username: CloudSA0477a8b8');
      console.log('   - Check the password you set when creating the server');
      console.log('   - You might need to reset the admin password in Azure Portal');
    } else {
      console.log('1. Check if your IP address is allowed in Azure SQL firewall rules');
      console.log('2. Verify the server name and database name are correct');
      console.log('3. Ensure the database server is running');
      console.log('4. Check network connectivity');
    }
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

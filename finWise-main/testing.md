
## 🔍 Testing Azure SQL Database Connection

### Verify Database Connection

To confirm that your application is connected to the Azure SQL Database (not local SQLite), use these verification methods:

#### 1. API Health Check
```bash
# Test backend API health endpoint
curl -v http://localhost:3000/health

# Expected response: 200 OK with database connection status
```

#### 2. Check Database Statistics
```bash
# Get expense statistics from Azure SQL Database
curl -s http://localhost:3000/api/expenses/stats | jq .

# Expected response:
# {
#   "totalExpenses": 5,
#   "totalAmount": 290.5,
#   "averageAmount": 58.1,
#   "categories": [...],
#   "monthlyStats": [...]
# }
```

#### 3. Verify Sample Data
```bash
# Get all expenses from Azure database
curl -s http://localhost:3000/api/expenses | jq .

# Should return the sample expenses created during setup:
# - Lunch at cafe (₹25.50)
# - Weekly grocery shopping (₹85.00)
# - Bus fare (₹15.00)
# - Movie tickets (₹45.00)
# - Electricity bill (₹120.00)
```

#### 4. Test from Android Emulator
```bash
# Test connection from emulator's perspective
curl -v http://10.0.2.2:3000/health

# This URL is what the Android app uses to connect
```

#### 5. Backend Console Logs
When you start the backend with `npm run dev`, look for these Azure connection logs:
```
🔧 Setting up database...
Creating new Azure SQL connection...
✅ Connected to Azure SQL Database successfully!
🚀 Server running on port 3000
📊 Sample data inserted
📋 Budgets: 3
💰 Expenses: 5
🏷️  Categories: 9
```

### Connection Configuration
The Azure SQL Database connection is configured in `backend-api/src/database.ts`:
- **Server**: `pocketbudgetserver.database.windows.net`
- **Database**: `pocketbudget`
- **Authentication**: SQL Server Authentication
- **Encryption**: Required (encrypt: true)

### Troubleshooting Connection Issues
If you're not connecting to Azure SQL Database:

1. **Check Environment Variables**: Ensure database credentials are properly set
2. **Verify Network**: Confirm internet connectivity to Azure
3. **Database Status**: Check if Azure SQL Database is running and accessible
4. **Firewall Rules**: Ensure your IP is allowed in Azure SQL Database firewall
5. **Backend Logs**: Check console output for connection errors

### Database vs Local Storage
- ✅ **Azure SQL Database**: Data persists across app restarts, shared across devices
- ❌ **Local SQLite**: Data only exists on device, lost when app is uninstalled

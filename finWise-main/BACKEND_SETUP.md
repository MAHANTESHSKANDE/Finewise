# PocketBudget Backend API

This is the backend API server for the PocketBudget React Native app.
It provides REST endpoints that connect to Azure SQL Database.

## Setup Instructions

1. **Create a new directory for the backend:**
   ```bash
   mkdir pocketbudget-api
   cd pocketbudget-api
   ```

2. **Initialize Node.js project:**
   ```bash
   npm init -y
   ```

3. **Install dependencies:**
   ```bash
   npm install express mssql cors dotenv helmet morgan
   npm install -D nodemon typescript @types/node @types/express ts-node
   ```

4. **Create the API server** (see files below)

5. **Environment Variables:**
   Create `.env` file:
   ```
   PORT=3000
   DB_SERVER=pocketbudgetserver.database.windows.net
   DB_DATABASE=pocketbudgetserver
   DB_USER=CloudSA0477a8b8
   DB_PASSWORD=Password@123
   ```

6. **Start the server:**
   ```bash
   npm run dev
   ```

## Troubleshooting Network Connection Issues

### Problem: "Network request failed" error in React Native app

#### Solution 1: Configure Correct API URL

1. **Edit environment configuration:**
   ```bash
   # Open the environment config file
   nano src/config/environment.ts
   ```

2. **Change the CURRENT_ENV based on your setup:**
   ```typescript
   // For Android Emulator (most common)
   CURRENT_ENV: 'ANDROID_EMULATOR'
   
   // For iOS Simulator
   CURRENT_ENV: 'IOS_SIMULATOR'
   
   // For physical device
   CURRENT_ENV: 'PHYSICAL_DEVICE'
   ```

#### Solution 2: Test Network Connectivity

1. **Use the Network Test Screen:**
   ```javascript
   // Add to your navigation or replace a screen temporarily
   import NetworkTestScreen from './src/components/NetworkTestScreen';
   
   // Run tests to check connectivity
   ```

2. **Check backend server status:**
   ```bash
   # Make sure backend is running
   cd backend-api
   npm run dev
   
   # Test from terminal
   curl http://localhost:3000/health
   ```

#### Solution 3: Common URL Configurations

| Environment | API URL | When to Use |
|-------------|---------|-------------|
| `http://10.0.2.2:3000/api` | Android Emulator | Default for Android Studio emulator |
| `http://localhost:3000/api` | iOS Simulator | iOS Simulator on Mac |
| `http://192.168.0.167:3000/api` | Physical Device | Device on same WiFi network |

#### Solution 4: Firewall and Network Issues

1. **Check firewall settings:**
   ```bash
   # Allow port 3000 through firewall
   sudo ufw allow 3000
   ```

2. **Verify IP address:**
   ```bash
   # Check current IP address
   hostname -I
   ```

3. **Test from device network:**
   ```bash
   # Test API accessibility
   curl http://YOUR_IP:3000/health
   ```

### API Endpoints

- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/progress` - Get budget progress
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/recent?limit=10` - Get recent expenses
- `GET /api/expenses/total?startDate=...&endDate=...` - Get total expenses
- `GET /api/expenses/stats?startDate=...&endDate=...` - Get expense statistics
- `POST /api/expenses` - Create new expense
- `POST /api/budgets` - Create new budget

## React Native Usage

```javascript
const API_BASE_URL = 'http://your-server-ip:3000/api';

// Get expenses
const response = await fetch(`${API_BASE_URL}/expenses`);
const expenses = await response.json();
```

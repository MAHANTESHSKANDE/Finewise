payallenka@payallenka-Latitude-3480:~/Desktop/pocketBudget/backend-api$ npm run dev

payallenka@payallenka-Latitude-3480:~/Desktop/pocketBudget$ curl -s http://localhost:3000/api/expenses/stats | jq .


payallenka@payallenka-Latitude-3480:~/Desktop/pocketBudget$ curl -v http://10.0.2.2:3000/health

payallenka@payallenka-Latitude-3480:~/Desktop/pocketBudget$ curl -s http://localhost:3000/api/expenses/stats | jq .



npx react-native run-android


payallenka@payallenka-Latitude-3480:~/Desktop/pocketBudget$ npm start


Terminal 1: cd backend-api && npm run dev (keep running)
Terminal 2: npm start (keep running)
Terminal 3: npx react-native run-android (runs once to install, then closes)



---

# PocketBudget - Technical Documentation

## 🤖 AI Categorization

### Hugging Face Model Used
PocketBudget uses the **Microsoft DialoGPT-medium** model from Hugging Face for automatic expense categorization.

**Model Details:**
- **Model Name**: `microsoft/DialoGPT-medium`
- **API Endpoint**: `https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium`
- **Purpose**: Text generation for expense category classification
- **Fallback**: Keyword-based categorization when AI is unavailable

**Implementation Features:**
- Mock categorization in development mode
- Keyword-based fallback system with predefined category mappings
- 10-second timeout for API calls
- Confidence scoring and alternative category suggestions

---

## 🗄️ Database Schema - Azure SQL Database

### SQL Commands for Table Creation

#### 1. Drop Existing Tables (if they exist)
```sql
IF OBJECT_ID('expenses', 'U') IS NOT NULL DROP TABLE expenses;
IF OBJECT_ID('budgets', 'U') IS NOT NULL DROP TABLE budgets;
IF OBJECT_ID('categories', 'U') IS NOT NULL DROP TABLE categories;
```

#### 2. Create Categories Table
```sql
CREATE TABLE categories (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(50) NOT NULL UNIQUE,
  color NVARCHAR(7) DEFAULT '#6366f1',
  icon NVARCHAR(50) DEFAULT 'category',
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE()
);
```

#### 3. Create Budgets Table
```sql
CREATE TABLE budgets (
  id INT IDENTITY(1,1) PRIMARY KEY,
  category NVARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE()
);
```

#### 4. Create Expenses Table
```sql
CREATE TABLE expenses (
  id INT IDENTITY(1,1) PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  category NVARCHAR(50) NOT NULL,
  description NVARCHAR(255),
  date DATE NOT NULL,
  paymentMethod NVARCHAR(50) NOT NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE()
);
```

#### 5. Insert Sample Categories
```sql
INSERT INTO categories (name) VALUES ('food');
INSERT INTO categories (name) VALUES ('groceries');
INSERT INTO categories (name) VALUES ('transportation');
INSERT INTO categories (name) VALUES ('entertainment');
INSERT INTO categories (name) VALUES ('utilities');
INSERT INTO categories (name) VALUES ('shopping');
INSERT INTO categories (name) VALUES ('healthcare');
INSERT INTO categories (name) VALUES ('education');
INSERT INTO categories (name) VALUES ('miscellaneous');
```

#### 6. Insert Sample Budgets
```sql
INSERT INTO budgets (category, amount, startDate, endDate) 
VALUES ('food', 500, '2025-08-01', '2025-08-31');

INSERT INTO budgets (category, amount, startDate, endDate) 
VALUES ('transportation', 200, '2025-08-01', '2025-08-31');

INSERT INTO budgets (category, amount, startDate, endDate) 
VALUES ('entertainment', 150, '2025-08-01', '2025-08-31');
```

#### 7. Insert Sample Expenses
```sql
INSERT INTO expenses (amount, category, description, date, paymentMethod) 
VALUES (25.50, 'food', 'Lunch at cafe', '2025-08-22', 'credit_card');

INSERT INTO expenses (amount, category, description, date, paymentMethod) 
VALUES (85.00, 'groceries', 'Weekly grocery shopping', '2025-08-21', 'debit_card');

INSERT INTO expenses (amount, category, description, date, paymentMethod) 
VALUES (15.00, 'transportation', 'Bus fare', '2025-08-22', 'cash');

INSERT INTO expenses (amount, category, description, date, paymentMethod) 
VALUES (45.00, 'entertainment', 'Movie tickets', '2025-08-20', 'credit_card');

INSERT INTO expenses (amount, category, description, date, paymentMethod) 
VALUES (120.00, 'utilities', 'Electricity bill', '2025-08-19', 'bank_transfer');
```

### Database Setup
All these SQL commands are executed automatically when you run the database setup script:
```bash
cd backend-api
npm run setup-db
```

---

## 🚀 Application Startup Commands

To run PocketBudget, you need to start both the backend API server and the React Native application:

### Terminal 1: Backend API Server
```bash
cd backend-api && npm run dev
```
*Keep this running - it serves the Azure SQL Database API*

### Terminal 2: Metro Bundler
```bash
npm start
```
*Keep this running - it serves the React Native JavaScript bundle*

### Terminal 3: Android App
```bash
npx react-native run-android
```
*Runs once to install the app, then closes*

The app will connect to:
- **Backend API**: `http://localhost:3000` (development)
- **Android Emulator**: `http://10.0.2.2:3000` (from emulator)
- **Azure SQL Database**: `pocketbudgetserver.database.windows.net`

"use strict";
/**
 * Database Setup Script
 * Creates tables and adds sample data for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = setupDatabase;
const { getConnection } = require('./database');
async function setupDatabase() {
    try {
        console.log('🔧 Setting up database...');
        const db = await getConnection();
        // Drop existing tables if they exist
        console.log('Dropping existing tables...');
        await db.request().query(`
      IF OBJECT_ID('expenses', 'U') IS NOT NULL DROP TABLE expenses;
      IF OBJECT_ID('budgets', 'U') IS NOT NULL DROP TABLE budgets;
      IF OBJECT_ID('categories', 'U') IS NOT NULL DROP TABLE categories;
    `);
        // Create categories table
        console.log('Creating categories table...');
        await db.request().query(`
      CREATE TABLE categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL UNIQUE,
        color NVARCHAR(7) DEFAULT '#6366f1',
        icon NVARCHAR(50) DEFAULT 'category',
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
      );
    `);
        // Create budgets table
        console.log('Creating budgets table...');
        await db.request().query(`
      CREATE TABLE budgets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        category NVARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
      );
    `);
        // Create expenses table
        console.log('Creating expenses table...');
        await db.request().query(`
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
    `);
        // Insert sample categories
        console.log('Inserting sample categories...');
        const categories = [
            'food', 'groceries', 'transportation', 'entertainment',
            'utilities', 'shopping', 'healthcare', 'education', 'miscellaneous'
        ];
        for (const category of categories) {
            await db.request()
                .input('name', category)
                .query('INSERT INTO categories (name) VALUES (@name)');
        }
        // Insert sample budgets
        console.log('Inserting sample budgets...');
        const budgets = [
            { category: 'food', amount: 500, startDate: '2025-08-01', endDate: '2025-08-31' },
            { category: 'transportation', amount: 200, startDate: '2025-08-01', endDate: '2025-08-31' },
            { category: 'entertainment', amount: 150, startDate: '2025-08-01', endDate: '2025-08-31' },
        ];
        for (const budget of budgets) {
            await db.request()
                .input('category', budget.category)
                .input('amount', budget.amount)
                .input('startDate', budget.startDate)
                .input('endDate', budget.endDate)
                .query(`
          INSERT INTO budgets (category, amount, startDate, endDate) 
          VALUES (@category, @amount, @startDate, @endDate)
        `);
        }
        // Insert sample expenses
        console.log('Inserting sample expenses...');
        const expenses = [
            { amount: 25.50, category: 'food', description: 'Lunch at cafe', date: '2025-08-22', paymentMethod: 'credit_card' },
            { amount: 85.00, category: 'groceries', description: 'Weekly grocery shopping', date: '2025-08-21', paymentMethod: 'debit_card' },
            { amount: 15.00, category: 'transportation', description: 'Bus fare', date: '2025-08-22', paymentMethod: 'cash' },
            { amount: 45.00, category: 'entertainment', description: 'Movie tickets', date: '2025-08-20', paymentMethod: 'credit_card' },
            { amount: 120.00, category: 'utilities', description: 'Electricity bill', date: '2025-08-19', paymentMethod: 'bank_transfer' },
        ];
        for (const expense of expenses) {
            await db.request()
                .input('amount', expense.amount)
                .input('category', expense.category)
                .input('description', expense.description)
                .input('date', expense.date)
                .input('paymentMethod', expense.paymentMethod)
                .query(`
          INSERT INTO expenses (amount, category, description, date, paymentMethod) 
          VALUES (@amount, @category, @description, @date, @paymentMethod)
        `);
        }
        console.log('✅ Database setup completed successfully!');
        console.log('📊 Sample data inserted');
        // Verify data
        const budgetCount = await db.request().query('SELECT COUNT(*) as count FROM budgets');
        const expenseCount = await db.request().query('SELECT COUNT(*) as count FROM expenses');
        const categoryCount = await db.request().query('SELECT COUNT(*) as count FROM categories');
        console.log(`📋 Budgets: ${budgetCount.recordset[0].count}`);
        console.log(`💰 Expenses: ${expenseCount.recordset[0].count}`);
        console.log(`🏷️  Categories: ${categoryCount.recordset[0].count}`);
    }
    catch (error) {
        console.error('❌ Database setup failed:', error);
        throw error;
    }
}
// Run setup if called directly
if (require.main === module) {
    setupDatabase()
        .then(() => {
        console.log('🎉 Setup complete!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Setup failed:', error);
        process.exit(1);
    });
}

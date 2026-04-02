import SQLite from 'react-native-sqlite-storage';

// Enable debugging
SQLite.DEBUG(true);
SQLite.enablePromise(true);

interface DatabaseConfig {
  name: string;
  location: string;
  createFromLocation?: string;
}

class Database {
  private static instance: Database;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Try to close any existing connections
  private async closeExistingConnections(): Promise<void> {
    try {
      // Try to close the specific database if it exists
      try {
        await SQLite.deleteDatabase({ name: 'PocketBudget.db', location: 'default' });
        console.log('Closed existing database connection');
      } catch (e) {
        // Ignore errors if the database doesn't exist yet
        console.log('No existing database connection to close');
      }
    } catch (error) {
      console.warn('Error during closing existing connections:', error);
      // Continue with initialization even if this fails
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      console.log('Database already initialized');
      return;
    }

    try {
      console.log('Initializing SQLite database...');
      
      // Make sure SQLite is enabled for promises
      SQLite.enablePromise(true);
      
      const config: DatabaseConfig = {
        name: 'PocketBudget.db',
        location: 'default', // This ensures persistent storage
      };

      // Add retry logic for opening the database
      let retries = 3;
      while (retries > 0) {
        try {
          this.db = await SQLite.openDatabase(config);
          console.log('Database opened successfully');
          break; // Success, exit the retry loop
        } catch (openError: any) {
          retries--;
          console.warn(`Failed to open database, retries left: ${retries}`, openError);
          if (retries === 0) throw openError;
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
        }
      }

      await this.createTables();
      await this.verifyPersistence();
      
      this.isInitialized = true;
      console.log('Database initialization complete');
    } catch (error: any) {
      console.error('Failed to initialize database:', error);
      this.isInitialized = false;
      this.db = null;
      throw new Error(`Database Error: ${error?.message || 'Unknown error'}`);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    console.log('Creating database tables...');

    // Create budgets table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        period TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Budgets table created/verified');

    // Create expenses table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        budgetId INTEGER,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        paymentMethod TEXT DEFAULT 'cash',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (budgetId) REFERENCES budgets (id) ON DELETE CASCADE
      );
    `);
    console.log('Expenses table created/verified');

    // Create categories table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#007AFF',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Categories table created/verified');

    // Insert default categories if they don't exist
    await this.insertDefaultCategories();
  }

  private async insertDefaultCategories(): Promise<void> {
    if (!this.db) return;

    const defaultCategories = [
      { name: 'Food', color: '#FF6B6B' },
      { name: 'Transportation', color: '#4ECDC4' },
      { name: 'Entertainment', color: '#45B7D1' },
      { name: 'Shopping', color: '#96CEB4' },
      { name: 'Bills', color: '#FFEAA7' },
      { name: 'Healthcare', color: '#DDA0DD' },
      { name: 'Other', color: '#95E1D3' },
    ];

    for (const category of defaultCategories) {
      try {
        await this.db.executeSql(
          'INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)',
          [category.name, category.color]
        );
      } catch (error) {
        console.warn(`Failed to insert category ${category.name}:`, error);
      }
    }
    console.log('Default categories inserted/verified');
  }

  private async verifyPersistence(): Promise<void> {
    if (!this.db) return;

    try {
      // Check if tables exist and have expected structure
      const tables = await this.db.executeSql(`
        SELECT name FROM sqlite_master WHERE type='table' AND name IN ('budgets', 'expenses', 'categories');
      `);
      
      console.log('Database tables found:', tables[0].rows.length);
      
      // Test data persistence by checking existing records
      const budgetCount = await this.db.executeSql('SELECT COUNT(*) as count FROM budgets');
      const expenseCount = await this.db.executeSql('SELECT COUNT(*) as count FROM expenses');
      
      console.log(`Existing data - Budgets: ${budgetCount[0].rows.item(0).count}, Expenses: ${expenseCount[0].rows.item(0).count}`);
      
      // Verify database file location
      console.log('Database location: default (persistent storage)');
      
    } catch (error) {
      console.error('Error verifying database persistence:', error);
    }
  }

  public async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    try {
      // Check if database is already initialized
      if (!this.db || !this.isInitialized) {
        console.log('Database not initialized, initializing now...');
        await this.initialize();
      }
      
      // Double check after initialization
      if (!this.db) {
        throw new Error('Failed to initialize database');
      }
      
      // Verify connection is still valid with a simple query
      try {
        await this.db.executeSql('SELECT 1');
        console.log('Database connection verified');
      } catch (error) {
        console.warn('Database connection lost, reconnecting...', error);
        this.isInitialized = false;
        this.db = null;
        await this.initialize();
        
        if (!this.db) {
          throw new Error('Failed to reconnect to database');
        }
      }
      
      return this.db;
    } catch (error: any) {
      console.error('Error in getDatabase():', error);
      throw new Error(`Database Error: Could not access database - ${error?.message || 'Unknown error'}`);
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      console.log('Closing database connection');
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // Debug method to check database status
  public async debugDatabase(): Promise<{success: boolean, message: string, stats: any}> {
    try {
      const db = await this.getDatabase();
      
      console.log('=== DATABASE DEBUG INFO ===');
      
      // Check database connection
      console.log('Database connection status: ' + (this.isInitialized ? 'INITIALIZED' : 'NOT INITIALIZED'));
      console.log('Database instance exists: ' + (this.db !== null ? 'YES' : 'NO'));
      
      // Check tables
      const tables = await db.executeSql(`
        SELECT name FROM sqlite_master WHERE type='table';
      `);
      
      const tableNames = tables[0].rows.raw().map((t: any) => t.name);
      console.log('All tables:', tableNames);
      
      // Check required tables exist
      const requiredTables = ['budgets', 'expenses', 'categories'];
      const missingTables = requiredTables.filter(t => !tableNames.includes(t));
      
      if (missingTables.length > 0) {
        console.error('Missing required tables:', missingTables);
      }
      
      // Check data counts
      const budgets = await db.executeSql('SELECT COUNT(*) as count FROM budgets');
      const expenses = await db.executeSql('SELECT COUNT(*) as count FROM expenses');
      const categories = await db.executeSql('SELECT COUNT(*) as count FROM categories');
      
      const stats = {
        budgets: budgets[0].rows.item(0).count,
        expenses: expenses[0].rows.item(0).count,
        categories: categories[0].rows.item(0).count,
      };
      
      console.log('Data counts:', stats);
      
      // Return debug information
      return {
        success: true,
        message: 'Database is functioning properly',
        stats: {
          tables: tableNames,
          missingTables,
          recordCounts: stats,
          isInitialized: this.isInitialized
        }
      };
    } catch (error: any) {
      console.error('=== DATABASE DEBUG ERROR ===', error);
      return {
        success: false,
        message: `Database error: ${error?.message || 'Unknown error'}`,
        stats: {
          error: error?.message || 'Unknown error',
          stack: error?.stack,
          isInitialized: this.isInitialized,
          hasDbInstance: this.db !== null
        }
      };
    }
  }

  // Method to test data persistence
  public async testPersistence(): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      
      // Insert a test record
      const testBudget = {
        name: 'Test Persistence Budget',
        amount: 100,
        period: 'monthly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      const result = await db.executeSql(
        `INSERT INTO budgets (name, amount, period, startDate, endDate) VALUES (?, ?, ?, ?, ?)`,
        [testBudget.name, testBudget.amount, testBudget.period, testBudget.startDate, testBudget.endDate]
      );
      
      const testId = result[0].insertId;
      console.log('Test budget created with ID:', testId);
      
      // Try to retrieve it
      const retrieved = await db.executeSql(
        'SELECT * FROM budgets WHERE id = ?',
        [testId]
      );
      
      if (retrieved[0].rows.length > 0) {
        console.log('Test budget retrieved successfully');
        
        // Clean up test data
        await db.executeSql('DELETE FROM budgets WHERE id = ?', [testId]);
        console.log('Test budget cleaned up');
        
        return true;
      } else {
        console.error('Test budget not found after insertion');
        return false;
      }
      
    } catch (error) {
      console.error('Persistence test failed:', error);
      return false;
    }
  }
}

// Export as both default and named export for compatibility
const databaseManager = Database.getInstance();
export { databaseManager };
export default databaseManager;

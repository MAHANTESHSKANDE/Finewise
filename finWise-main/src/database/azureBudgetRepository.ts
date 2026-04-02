/**
 * Azure SQL Budget Repository - Database operations for budgets
 */

import { getConnection, sql } from './azureConfig';
import { Budget, BudgetProgress } from '../types';

export class AzureBudgetRepository {
  /**
   * Create a new budget
   */
  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      const pool = await getConnection();
      
      // Check if budget already exists for the same category and date range
      const existingBudget = await this.getBudgetByCategoryAndDateRange(
        budget.category,
        budget.startDate,
        budget.endDate
      );

      if (existingBudget) {
        throw new Error('Budget already exists for this category and date range');
      }

      const result = await pool.request()
        .input('category', sql.VarChar, budget.category)
        .input('amount', sql.Decimal(10, 2), budget.amount)
        .input('startDate', sql.Date, budget.startDate)
        .input('endDate', sql.Date, budget.endDate)
        .query(`
          INSERT INTO budgets (category, amount, startDate, endDate, createdAt, updatedAt) 
          OUTPUT INSERTED.*
          VALUES (@category, @amount, @startDate, @endDate, GETDATE(), GETDATE())
        `);

      if (result.recordset.length === 0) {
        throw new Error('Failed to create budget');
      }

      return result.recordset[0] as Budget;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(id: string): Promise<Budget | null> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('id', sql.VarChar, id)
        .query('SELECT * FROM budgets WHERE id = @id');

      return result.recordset.length > 0 ? result.recordset[0] as Budget : null;
    } catch (error) {
      console.error('Error getting budget by id:', error);
      throw error;
    }
  }

  /**
   * Get budget by category and date range
   */
  async getBudgetByCategoryAndDateRange(
    category: string,
    startDate: string,
    endDate: string
  ): Promise<Budget | null> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('category', sql.VarChar, category)
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate)
        .query(`
          SELECT * FROM budgets 
          WHERE category = @category 
          AND startDate = @startDate 
          AND endDate = @endDate
        `);

      return result.recordset.length > 0 ? result.recordset[0] as Budget : null;
    } catch (error) {
      console.error('Error getting budget by category and date range:', error);
      throw error;
    }
  }

  /**
   * Get all budgets
   */
  async getAllBudgets(): Promise<Budget[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .query('SELECT * FROM budgets ORDER BY createdAt DESC');

      return result.recordset as Budget[];
    } catch (error) {
      console.error('Error getting all budgets:', error);
      throw error;
    }
  }

  /**
   * Get active budgets (current date within date range)
   */
  async getActiveBudgets(): Promise<Budget[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .query(`
          SELECT * FROM budgets 
          WHERE GETDATE() BETWEEN startDate AND endDate
          ORDER BY createdAt DESC
        `);

      return result.recordset as Budget[];
    } catch (error) {
      console.error('Error getting active budgets:', error);
      throw error;
    }
  }

  /**
   * Update budget
   */
  async updateBudget(id: string, updates: Partial<Omit<Budget, 'id' | 'createdAt'>>): Promise<Budget> {
    try {
      const pool = await getConnection();
      
      // Build dynamic update query
      const setClause = Object.keys(updates)
        .map(key => `${key} = @${key}`)
        .join(', ');

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      const request = pool.request().input('id', sql.VarChar, id);

      // Add parameters for each update field
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'amount') {
          request.input(key, sql.Decimal(10, 2), value);
        } else if (key === 'startDate' || key === 'endDate') {
          request.input(key, sql.Date, value);
        } else {
          request.input(key, sql.VarChar, value);
        }
      });

      const result = await request.query(`
        UPDATE budgets 
        SET ${setClause}, updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

      if (result.recordset.length === 0) {
        throw new Error('Budget not found or update failed');
      }

      return result.recordset[0] as Budget;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }

  /**
   * Delete budget
   */
  async deleteBudget(id: string): Promise<boolean> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('id', sql.VarChar, id)
        .query('DELETE FROM budgets WHERE id = @id');

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }

  /**
   * Get budget progress with spent amount
   */
  async getBudgetProgress(budgetId: string): Promise<BudgetProgress | null> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('budgetId', sql.VarChar, budgetId)
        .query(`
          SELECT 
            b.*,
            ISNULL(SUM(e.amount), 0) as spent
          FROM budgets b
          LEFT JOIN expenses e ON e.category = b.category 
            AND e.date BETWEEN b.startDate AND b.endDate
          WHERE b.id = @budgetId
          GROUP BY b.id, b.category, b.amount, b.startDate, b.endDate, b.createdAt, b.updatedAt
        `);

      if (result.recordset.length === 0) {
        return null;
      }

      const budget = result.recordset[0];
      const spent = parseFloat(budget.spent) || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        remaining,
        percentage: Math.min(percentage, 100), // Cap at 100%
      } as BudgetProgress;
    } catch (error) {
      console.error('Error getting budget progress:', error);
      throw error;
    }
  }

  /**
   * Get all budget progress
   */
  async getAllBudgetProgress(): Promise<BudgetProgress[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .query(`
          SELECT 
            b.*,
            ISNULL(SUM(e.amount), 0) as spent
          FROM budgets b
          LEFT JOIN expenses e ON e.category = b.category 
            AND e.date BETWEEN b.startDate AND b.endDate
          GROUP BY b.id, b.category, b.amount, b.startDate, b.endDate, b.createdAt, b.updatedAt
          ORDER BY b.createdAt DESC
        `);

      return result.recordset.map(budget => {
        const spent = parseFloat(budget.spent) || 0;
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          ...budget,
          spent,
          remaining,
          percentage: Math.min(percentage, 100), // Cap at 100%
        } as BudgetProgress;
      });
    } catch (error) {
      console.error('Error getting all budget progress:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const azureBudgetRepository = new AzureBudgetRepository();

/**
 * Azure SQL Expense Repository - Database operations for expenses
 */

import { getConnection, sql } from './azureConfig';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';

export class AzureExpenseRepository {
  /**
   * Create a new expense
   */
  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('amount', sql.Decimal(10, 2), expense.amount)
        .input('category', sql.VarChar, expense.category)
        .input('description', sql.VarChar, expense.description)
        .input('date', sql.Date, expense.date)
        .input('paymentMethod', sql.VarChar, expense.paymentMethod)
        .query(`
          INSERT INTO expenses (amount, category, description, date, paymentMethod, createdAt, updatedAt) 
          OUTPUT INSERTED.*
          VALUES (@amount, @category, @description, @date, @paymentMethod, GETDATE(), GETDATE())
        `);

      if (result.recordset.length === 0) {
        throw new Error('Failed to create expense');
      }

      return result.recordset[0] as Expense;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string): Promise<Expense | null> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('id', sql.VarChar, id)
        .query('SELECT * FROM expenses WHERE id = @id');

      return result.recordset.length > 0 ? result.recordset[0] as Expense : null;
    } catch (error) {
      console.error('Error getting expense by id:', error);
      throw error;
    }
  }

  /**
   * Get all expenses
   */
  async getAllExpenses(): Promise<Expense[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .query('SELECT * FROM expenses ORDER BY date DESC, createdAt DESC');

      return result.recordset as Expense[];
    } catch (error) {
      console.error('Error getting all expenses:', error);
      throw error;
    }
  }

  /**
   * Get expenses by date range
   */
  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate)
        .query(`
          SELECT * FROM expenses 
          WHERE date BETWEEN @startDate AND @endDate
          ORDER BY date DESC, createdAt DESC
        `);

      return result.recordset as Expense[];
    } catch (error) {
      console.error('Error getting expenses by date range:', error);
      throw error;
    }
  }

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(category: ExpenseCategory): Promise<Expense[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('category', sql.VarChar, category)
        .query(`
          SELECT * FROM expenses 
          WHERE category = @category
          ORDER BY date DESC, createdAt DESC
        `);

      return result.recordset as Expense[];
    } catch (error) {
      console.error('Error getting expenses by category:', error);
      throw error;
    }
  }

  /**
   * Get expenses by category and date range
   */
  async getExpensesByCategoryAndDateRange(
    category: ExpenseCategory,
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('category', sql.VarChar, category)
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate)
        .query(`
          SELECT * FROM expenses 
          WHERE category = @category
          AND date BETWEEN @startDate AND @endDate
          ORDER BY date DESC, createdAt DESC
        `);

      return result.recordset as Expense[];
    } catch (error) {
      console.error('Error getting expenses by category and date range:', error);
      throw error;
    }
  }

  /**
   * Update expense
   */
  async updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense> {
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
        } else if (key === 'date') {
          request.input(key, sql.Date, value);
        } else {
          request.input(key, sql.VarChar, value);
        }
      });

      const result = await request.query(`
        UPDATE expenses 
        SET ${setClause}, updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

      if (result.recordset.length === 0) {
        throw new Error('Expense not found or update failed');
      }

      return result.recordset[0] as Expense;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  /**
   * Delete expense
   */
  async deleteExpense(id: string): Promise<boolean> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('id', sql.VarChar, id)
        .query('DELETE FROM expenses WHERE id = @id');

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  /**
   * Get total expense amount by date range
   */
  async getTotalExpensesByDateRange(startDate: string, endDate: string): Promise<number> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('startDate', sql.Date, startDate)
        .input('endDate', sql.Date, endDate)
        .query(`
          SELECT ISNULL(SUM(amount), 0) as total
          FROM expenses 
          WHERE date BETWEEN @startDate AND @endDate
        `);

      return parseFloat(result.recordset[0].total) || 0;
    } catch (error) {
      console.error('Error getting total expenses by date range:', error);
      throw error;
    }
  }

  /**
   * Get expense statistics by category
   */
  async getExpenseStatisticsByCategory(startDate?: string, endDate?: string): Promise<Array<{
    category: ExpenseCategory;
    total: number;
    count: number;
    average: number;
  }>> {
    try {
      const pool = await getConnection();
      
      let query = `
        SELECT 
          category,
          ISNULL(SUM(amount), 0) as total,
          COUNT(*) as count,
          ISNULL(AVG(amount), 0) as average
        FROM expenses
      `;

      const request = pool.request();

      if (startDate && endDate) {
        query += ' WHERE date BETWEEN @startDate AND @endDate';
        request.input('startDate', sql.Date, startDate);
        request.input('endDate', sql.Date, endDate);
      }

      query += ' GROUP BY category ORDER BY total DESC';

      const result = await request.query(query);

      return result.recordset.map(row => ({
        category: row.category as ExpenseCategory,
        total: parseFloat(row.total) || 0,
        count: parseInt(row.count) || 0,
        average: parseFloat(row.average) || 0,
      }));
    } catch (error) {
      console.error('Error getting expense statistics by category:', error);
      throw error;
    }
  }

  /**
   * Get recent expenses (last N expenses)
   */
  async getRecentExpenses(limit: number = 10): Promise<Expense[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('limit', sql.Int, limit)
        .query(`
          SELECT TOP (@limit) * FROM expenses 
          ORDER BY date DESC, createdAt DESC
        `);

      return result.recordset as Expense[];
    } catch (error) {
      console.error('Error getting recent expenses:', error);
      throw error;
    }
  }

  /**
   * Search expenses by description
   */
  async searchExpenses(searchTerm: string): Promise<Expense[]> {
    try {
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('searchTerm', sql.VarChar, `%${searchTerm}%`)
        .query(`
          SELECT * FROM expenses 
          WHERE description LIKE @searchTerm
          ORDER BY date DESC, createdAt DESC
        `);

      return result.recordset as Expense[];
    } catch (error) {
      console.error('Error searching expenses:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const azureExpenseRepository = new AzureExpenseRepository();

/**
 * Expense Repository - Database operations for expenses
 */

import { databaseManager } from './index';
import { Expense, ExpenseFilter, ExpenseCategory } from '../types';

export class ExpenseRepository {
  /**
   * Create a new expense
   */
  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    try {
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        `INSERT INTO expenses (amount, description, date, category, paymentMethod) 
         VALUES (?, ?, ?, ?, ?)`,
        [expense.amount, expense.description, expense.date, expense.category, expense.paymentMethod]
      );

      const insertId = result[0].insertId;
      
      // Fetch the created expense with timestamps
      const createdExpense = await this.getExpenseById(insertId);
      
      if (!createdExpense) {
        throw new Error('Failed to retrieve created expense');
      }

      console.log('[ExpenseRepository] Created expense:', createdExpense);
      return createdExpense;
    } catch (error) {
      console.error('[ExpenseRepository] Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: number): Promise<Expense | null> {
    try {
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        'SELECT * FROM expenses WHERE id = ?',
        [id]
      );

      if (result[0].rows.length === 0) {
        return null;
      }

      const expense = result[0].rows.item(0);
      return this.mapRowToExpense(expense);
    } catch (error) {
      console.error('[ExpenseRepository] Error getting expense by ID:', error);
      throw error;
    }
  }

  /**
   * Update an existing expense
   */
  async updateExpense(id: number, updates: Partial<Expense>): Promise<Expense> {
    try {
      const db = await databaseManager.getDatabase();
      
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.keys(updates)
        .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
        .map(key => updates[key as keyof Expense]);
      
      await db.executeSql(
        `UPDATE expenses SET ${setClause} WHERE id = ?`,
        [...values, id]
      );

      const updatedExpense = await this.getExpenseById(id);
      
      if (!updatedExpense) {
        throw new Error('Failed to retrieve updated expense');
      }

      console.log('[ExpenseRepository] Updated expense:', updatedExpense);
      return updatedExpense;
    } catch (error) {
      console.error('[ExpenseRepository] Error updating expense:', error);
      throw error;
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(id: number): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      
      await db.executeSql('DELETE FROM expenses WHERE id = ?', [id]);
      
      console.log('[ExpenseRepository] Deleted expense with ID:', id);
    } catch (error) {
      console.error('[ExpenseRepository] Error deleting expense:', error);
      throw error;
    }
  }

  /**
   * Get expenses with filtering and pagination
   */
  async getExpenses(
    filter: ExpenseFilter,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ expenses: Expense[]; total: number }> {
    const { period, startDate, endDate, category } = filter;
    try {
      const db = await databaseManager.getDatabase();
      
      let whereClauses: string[] = [];
      const params: any[] = [];

      if (category) {
        whereClauses.push('category = ?');
        params.push(category as ExpenseCategory);
      }

      if (startDate) {
        whereClauses.push('date >= ?');
        params.push(startDate);
      }

      if (endDate) {
        whereClauses.push('date <= ?');
        params.push(endDate);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Get total count
      const countResult = await db.executeSql(
        `SELECT COUNT(*) as count FROM expenses ${whereClause}`,
        params
      );
      const totalCount = countResult[0].rows.item(0).count;

      // Get expenses with pagination
      const result = await db.executeSql(
        `SELECT * FROM expenses ${whereClause} 
         ORDER BY date DESC, createdAt DESC 
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const expenses: Expense[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        expenses.push(this.mapRowToExpense(result[0].rows.item(i)));
      }

      return { expenses, total: totalCount };
    } catch (error) {
      console.error('[ExpenseRepository] Error getting expenses:', error);
      throw error;
    }
  }

  /**
   * Get expenses by date range
   */
  async getExpensesByDateRange(
    startDate: string,
    endDate: string,
    category?: ExpenseCategory
  ): Promise<Expense[]> {
    try {
      const result = await this.getExpenses({
        period: 'month', // Not used in this context
        startDate,
        endDate,
        category,
      });
      
      return result.expenses;
    } catch (error) {
      console.error('[ExpenseRepository] Error getting expenses by date range:', error);
      throw error;
    }
  }

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(category: ExpenseCategory): Promise<Expense[]> {
    try {
      const result = await this.getExpenses({
        period: 'month', // Not used in this context
        category,
      });
      
      return result.expenses;
    } catch (error) {
      console.error('[ExpenseRepository] Error getting expenses by category:', error);
      throw error;
    }
  }

  /**
   * Get category breakdown for a date range
   */
  async getCategoryBreakdown(startDate: string, endDate: string): Promise<Array<{category: string, amount: number}>> {
    try {
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        `SELECT category, SUM(amount) as amount
         FROM expenses 
         WHERE date >= ? AND date <= ?
         GROUP BY category
         ORDER BY amount DESC`,
        [startDate, endDate]
      );

      const breakdown: Array<{category: string, amount: number}> = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        breakdown.push({
          category: row.category,
          amount: parseFloat(row.amount),
        });
      }

      return breakdown;
    } catch (error) {
      console.error('[ExpenseRepository] Error getting category breakdown:', error);
      throw error;
    }
  }

  /**
   * Get total expenses for a date range
   */
  async getTotalExpenses(startDate: string, endDate: string, category?: string): Promise<number> {
    try {
      const db = await databaseManager.getDatabase();
      
      let query = `SELECT SUM(amount) as total FROM expenses WHERE date >= ? AND date <= ?`;
      const params: any[] = [startDate, endDate];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      const result = await db.executeSql(query, params);
      
      return parseFloat(result[0].rows.item(0).total) || 0;
    } catch (error) {
      console.error('[ExpenseRepository] Error getting total expenses:', error);
      throw error;
    }
  }

  /**
   * Get monthly expense trends
   */
  async getMonthlyTrends(year: number): Promise<Array<{month: string, amount: number}>> {
    try {
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        `SELECT 
           strftime('%Y-%m', date) as month,
           SUM(amount) as amount
         FROM expenses 
         WHERE strftime('%Y', date) = ?
         GROUP BY strftime('%Y-%m', date)
         ORDER BY month`,
        [year.toString()]
      );

      const trends: Array<{month: string, amount: number}> = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        trends.push({
          month: row.month,
          amount: parseFloat(row.amount),
        });
      }

      return trends;
    } catch (error) {
      console.error('[ExpenseRepository] Error getting monthly trends:', error);
      throw error;
    }
  }

  /**
   * Delete all expenses (for testing)
   */
  async deleteAllExpenses(): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      
      await db.executeSql('DELETE FROM expenses');
      
      console.log('[ExpenseRepository] Deleted all expenses');
    } catch (error) {
      console.error('[ExpenseRepository] Error deleting all expenses:', error);
      throw error;
    }
  }

  /**
   * Map database row to Expense object
   */
  private mapRowToExpense(row: any): Expense {
    return {
      id: row.id,
      amount: parseFloat(row.amount),
      description: row.description,
      date: row.date,
      category: row.category,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

// Export singleton instance
export const expenseRepository = new ExpenseRepository();

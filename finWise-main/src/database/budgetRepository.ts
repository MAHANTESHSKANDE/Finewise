/**
 * Budget Repository - Database operations for budgets
 */

import { databaseManager } from './index';
import { Budget, BudgetProgress } from '../types';
import { expenseRepository } from './expenseRepository';

export class BudgetRepository {
  /**
   * Create a new budget
   */
  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      const db = await databaseManager.getDatabase();
      
      // Check if budget already exists for the same category and date range
      const existingBudget = await this.getBudgetByCategoryAndDateRange(
        budget.category,
        budget.startDate,
        budget.endDate
      );

      if (existingBudget) {
        throw new Error('Budget already exists for this category and date range');
      }

      const result = await db.executeSql(
        `INSERT INTO budgets (category, amount, startDate, endDate) 
         VALUES (?, ?, ?, ?)`,
        [budget.category, budget.amount, budget.startDate, budget.endDate]
      );

      const insertId = result[0].insertId;
      
      // Fetch the created budget with timestamps
      const createdBudget = await this.getBudgetById(insertId);
      
      if (!createdBudget) {
        throw new Error('Failed to retrieve created budget');
      }

      console.log('[BudgetRepository] Created budget:', createdBudget);
      return createdBudget;
    } catch (error) {
      console.error('[BudgetRepository] Error creating budget:', error);
      throw error;
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(id: number): Promise<Budget | null> {
    try {
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        'SELECT * FROM budgets WHERE id = ?',
        [id]
      );

      if (result[0].rows.length === 0) {
        return null;
      }

      const budget = result[0].rows.item(0);
      return this.mapRowToBudget(budget);
    } catch (error) {
      console.error('[BudgetRepository] Error getting budget by ID:', error);
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
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        'SELECT * FROM budgets WHERE category = ? AND startDate = ? AND endDate = ?',
        [category, startDate, endDate]
      );

      if (result[0].rows.length === 0) {
        return null;
      }

      const budget = result[0].rows.item(0);
      return this.mapRowToBudget(budget);
    } catch (error) {
      console.error('[BudgetRepository] Error getting budget by category and date range:', error);
      throw error;
    }
  }

  /**
   * Update an existing budget
   */
  async updateBudget(id: number, updates: Partial<Budget>): Promise<Budget> {
    try {
      const db = await databaseManager.getDatabase();
      
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.keys(updates)
        .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
        .map(key => updates[key as keyof Budget]);
      
      await db.executeSql(
        `UPDATE budgets SET ${setClause} WHERE id = ?`,
        [...values, id]
      );

      const updatedBudget = await this.getBudgetById(id);
      
      if (!updatedBudget) {
        throw new Error('Failed to retrieve updated budget');
      }

      console.log('[BudgetRepository] Updated budget:', updatedBudget);
      return updatedBudget;
    } catch (error) {
      console.error('[BudgetRepository] Error updating budget:', error);
      throw error;
    }
  }

  /**
   * Delete a budget
   */
  async deleteBudget(id: number): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      
      await db.executeSql('DELETE FROM budgets WHERE id = ?', [id]);
      
      console.log('[BudgetRepository] Deleted budget with ID:', id);
    } catch (error) {
      console.error('[BudgetRepository] Error deleting budget:', error);
      throw error;
    }
  }

  /**
   * Get all budgets
   */
  async getBudgets(): Promise<Budget[]> {
    try {
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        'SELECT * FROM budgets ORDER BY startDate DESC, category',
        []
      );

      const budgets: Budget[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        budgets.push(this.mapRowToBudget(result[0].rows.item(i)));
      }

      return budgets;
    } catch (error) {
      console.error('[BudgetRepository] Error getting budgets:', error);
      throw error;
    }
  }

  /**
   * Get active budgets (current date within date range)
   */
  async getActiveBudgets(currentDate: string): Promise<Budget[]> {
    try {
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        'SELECT * FROM budgets WHERE ? >= startDate AND ? <= endDate ORDER BY category',
        [currentDate, currentDate]
      );

      const budgets: Budget[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        budgets.push(this.mapRowToBudget(result[0].rows.item(i)));
      }

      return budgets;
    } catch (error) {
      console.error('[BudgetRepository] Error getting active budgets:', error);
      throw error;
    }
  }

  /**
   * Get budget progress with spending information
   */
  async getBudgetProgress(budgetId: number): Promise<BudgetProgress | null> {
    try {
      const budget = await this.getBudgetById(budgetId);
      
      if (!budget) {
        return null;
      }

      // Get total spent for this budget's category and date range
      const totalSpent = await expenseRepository.getTotalExpenses(
        budget.startDate,
        budget.endDate,
        budget.category
      );

      const remaining = budget.amount - totalSpent;
      const percentage = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;
      const isOverBudget = totalSpent > budget.amount;
      const isWarning = percentage >= 80;

      return {
        budget,
        spent: totalSpent,
        remaining,
        percentage,
        isOverBudget,
        isWarning,
      };
    } catch (error) {
      console.error('[BudgetRepository] Error getting budget progress:', error);
      throw error;
    }
  }

  /**
   * Get all budget progress for active budgets
   */
  async getAllBudgetProgress(currentDate: string): Promise<BudgetProgress[]> {
    try {
      console.log('[BudgetRepository] Fetching active budgets for date:', currentDate);
      const activeBudgets = await this.getActiveBudgets(currentDate);
      console.log('[BudgetRepository] Active budgets fetched:', activeBudgets);

      const progressList: BudgetProgress[] = [];

      for (const budget of activeBudgets) {
        try {
          const progress = await this.getBudgetProgress(budget.id!);
          if (progress) {
            progressList.push(progress);
          }
        } catch (progressError) {
          console.error(`[BudgetRepository] Error calculating progress for budget ID ${budget.id}:`, progressError);
        }
      }

      console.log('[BudgetRepository] Budget progress list:', progressList);
      return progressList.sort((a, b) => b.percentage - a.percentage);
    } catch (error: any) {
      console.error('[BudgetRepository] Error getting all budget progress:', error);
      throw new Error(`Failed to fetch budget progress: ${error.message}`);
    }
  }

  /**
   * Get budgets by category
   */
  async getBudgetsByCategory(category: string): Promise<Budget[]> {
    try {
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        'SELECT * FROM budgets WHERE category = ? ORDER BY startDate DESC',
        [category]
      );

      const budgets: Budget[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        budgets.push(this.mapRowToBudget(result[0].rows.item(i)));
      }

      return budgets;
    } catch (error) {
      console.error('[BudgetRepository] Error getting budgets by category:', error);
      throw error;
    }
  }

  /**
   * Get budgets for a specific time period
   */
  async getBudgetsForPeriod(startDate: string, endDate: string): Promise<Budget[]> {
    try {
      const db = await databaseManager.getDatabase();
      
      const result = await db.executeSql(
        `SELECT * FROM budgets 
         WHERE (startDate <= ? AND endDate >= ?) 
            OR (startDate >= ? AND startDate <= ?)
            OR (endDate >= ? AND endDate <= ?)
         ORDER BY startDate DESC, category`,
        [endDate, startDate, startDate, endDate, startDate, endDate]
      );

      const budgets: Budget[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        budgets.push(this.mapRowToBudget(result[0].rows.item(i)));
      }

      return budgets;
    } catch (error) {
      console.error('[BudgetRepository] Error getting budgets for period:', error);
      throw error;
    }
  }

  /**
   * Delete all budgets (for testing)
   */
  async deleteAllBudgets(): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      
      await db.executeSql('DELETE FROM budgets');
      
      console.log('[BudgetRepository] Deleted all budgets');
    } catch (error) {
      console.error('[BudgetRepository] Error deleting all budgets:', error);
      throw error;
    }
  }

  /**
   * Map database row to Budget object
   */
  private mapRowToBudget(row: any): Budget {
    return {
      id: row.id,
      category: row.category,
      amount: parseFloat(row.amount),
      startDate: row.startDate,
      endDate: row.endDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

// Export singleton instance
export const budgetRepository = new BudgetRepository();

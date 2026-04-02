import { apiService } from '../services/apiService';
import { Expense, ExpenseCategory } from '../types';

class ApiAzureExpenseRepository {
  async getAllExpenses(): Promise<Expense[]> {
    try {
      const expenses = await apiService.expenses.getAll();
      return expenses;
    } catch (error) {
      console.error('Error in getAllExpenses:', error);
      return [];
    }
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    try {
      const expense = await apiService.expenses.getById(id);
      return expense;
    } catch (error) {
      console.error('Error in getExpenseById:', error);
      return null;
    }
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    try {
      const expenses = await apiService.expenses.getByDateRange(startDate, endDate);
      return expenses;
    } catch (error) {
      console.error('Error in getExpensesByDateRange:', error);
      return [];
    }
  }

  async getTotalExpensesByDateRange(startDate: string, endDate: string): Promise<number> {
    try {
      const result = await apiService.expenses.getTotalByDateRange(startDate, endDate);
      return result.total;
    } catch (error) {
      console.error('Error in getTotalExpensesByDateRange:', error);
      return 0;
    }
  }

  async getExpenseStatisticsByCategory(startDate?: string, endDate?: string): Promise<Array<{
    category: ExpenseCategory;
    total: number;
    count: number;
    average: number;
  }>> {
    try {
      const stats = await apiService.expenses.getStatistics(startDate, endDate);
      return stats.map(stat => ({
        ...stat,
        category: stat.category as ExpenseCategory
      }));
    } catch (error) {
      console.error('Error in getExpenseStatisticsByCategory:', error);
      return [];
    }
  }

  async getRecentExpenses(limit: number = 10): Promise<Expense[]> {
    try {
      const expenses = await apiService.expenses.getRecent(limit);
      return expenses;
    } catch (error) {
      console.error('Error in getRecentExpenses:', error);
      return [];
    }
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense | null> {
    try {
      const newExpense = await apiService.expenses.create(expense);
      return newExpense;
    } catch (error) {
      console.error('Error in createExpense:', error);
      return null;
    }
  }

  async getExpensesByCategory(category: ExpenseCategory, limit?: number): Promise<Expense[]> {
    try {
      const expenses = await apiService.expenses.getAll({ category, limit });
      return expenses;
    } catch (error) {
      console.error('Error in getExpensesByCategory:', error);
      return [];
    }
  }

  async getDailyExpenses(startDate: string, endDate: string): Promise<Array<{
    date: string;
    total: number;
    count: number;
  }>> {
    try {
      // For daily expenses, we'll need to group the results on the client side
      const expenses = await this.getExpensesByDateRange(startDate, endDate);
      
      const dailyMap = new Map<string, { total: number; count: number }>();
      
      expenses.forEach(expense => {
        const date = expense.date.split('T')[0]; // Get just the date part
        const existing = dailyMap.get(date) || { total: 0, count: 0 };
        dailyMap.set(date, {
          total: existing.total + expense.amount,
          count: existing.count + 1
        });
      });

      return Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        total: data.total,
        count: data.count
      }));
    } catch (error) {
      console.error('Error in getDailyExpenses:', error);
      return [];
    }
  }

  async getMonthlyExpenses(year: number): Promise<Array<{
    month: number;
    total: number;
    count: number;
  }>> {
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const expenses = await this.getExpensesByDateRange(startDate, endDate);
      
      const monthlyMap = new Map<number, { total: number; count: number }>();
      
      expenses.forEach(expense => {
        const month = new Date(expense.date).getMonth() + 1; // 1-12
        const existing = monthlyMap.get(month) || { total: 0, count: 0 };
        monthlyMap.set(month, {
          total: existing.total + expense.amount,
          count: existing.count + 1
        });
      });

      return Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        total: data.total,
        count: data.count
      }));
    } catch (error) {
      console.error('Error in getMonthlyExpenses:', error);
      return [];
    }
  }
}

export const apiAzureExpenseRepository = new ApiAzureExpenseRepository();

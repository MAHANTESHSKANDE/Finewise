/**
 * React Native Budget Repository using HTTP API
 * This connects to the backend API server instead of directly to Azure SQL
 */

import { Budget, BudgetProgress } from '../types';
import { apiService } from '../services/apiService';

export class ApiAzureBudgetRepository {
  /**
   * Get all budgets
   */
  async getAllBudgets(): Promise<Budget[]> {
    try {
      const budgets = await apiService.budgets.getAll();
      
      // Transform the API response to ensure string IDs
      return budgets.map((budget: any) => ({
        ...budget,
        id: budget.id.toString(), // Convert numeric ID to string
      }));
    } catch (error) {
      console.error('Error in getAllBudgets:', error);
      return [];
    }
  }

  /**
   * Get all budget progress
   */
  async getAllBudgetProgress(): Promise<BudgetProgress[]> {
    try {
      const budgetProgressData = await apiService.budgets.getProgress();
      
      // Transform the flat API response to match our BudgetProgress interface
      return budgetProgressData.map((item: any) => ({
        budget: {
          id: item.id.toString(), // Convert numeric ID to string
          category: item.category,
          amount: item.amount,
          startDate: item.startDate,
          endDate: item.endDate,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
        spent: item.spent,
        remaining: item.remaining,
        percentage: item.percentage,
        isOverBudget: item.percentage >= 100,
        isWarning: item.percentage >= 80,
      }));
    } catch (error) {
      console.error('Error in getAllBudgetProgress:', error);
      return [];
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(id: string): Promise<Budget | null> {
    try {
      const budget = await apiService.budgets.getById(id);
      return budget;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error('Error getting budget by id:', error);
      throw new Error('Failed to fetch budget');
    }
  }

  /**
   * Create a new budget
   */
  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      const newBudget = await apiService.budgets.create({
        category: budget.category,
        amount: budget.amount,
        startDate: budget.startDate,
        endDate: budget.endDate,
      });
      return newBudget;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw new Error('Failed to create budget');
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
      const budgets = await this.getAllBudgets();
      const budget = budgets.find(b => 
        b.category === category && 
        b.startDate === startDate && 
        b.endDate === endDate
      );
      return budget || null;
    } catch (error) {
      console.error('Error getting budget by category and date range:', error);
      throw new Error('Failed to fetch budget');
    }
  }

  /**
   * Get active budgets (current date within date range)
   */
  async getActiveBudgets(): Promise<Budget[]> {
    try {
      const budgets = await this.getAllBudgets();
      const today = new Date().toISOString().split('T')[0];
      
      return budgets.filter(budget => 
        today >= budget.startDate && today <= budget.endDate
      );
    } catch (error) {
      console.error('Error getting active budgets:', error);
      throw new Error('Failed to fetch active budgets');
    }
  }

  /**
   * Get budget progress with spent amount
   */
  async getBudgetProgress(budgetId: string): Promise<BudgetProgress | null> {
    try {
      const budgetProgress = await this.getAllBudgetProgress();
      return budgetProgress.find(bp => bp.budget.id === budgetId) || null;
    } catch (error) {
      console.error('Error getting budget progress:', error);
      throw new Error('Failed to fetch budget progress');
    }
  }
}

// Export singleton instance
export const apiAzureBudgetRepository = new ApiAzureBudgetRepository();

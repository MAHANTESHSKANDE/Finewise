/**
 * React Native Azure SQL Mock Repository
 * This is a temporary implementation that simulates Azure SQL data
 * In production, this should connect to a backend API
 */

import { Budget, BudgetProgress, Expense, ExpenseCategory } from '../types';

// Mock data to simulate Azure SQL database
const mockBudgets: Budget[] = [
  {
    id: '1',
    category: 'food',
    amount: 500,
    startDate: '2025-08-01',
    endDate: '2025-08-31',
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2025-08-01T00:00:00Z',
  },
  {
    id: '2',
    category: 'transportation',
    amount: 200,
    startDate: '2025-08-01',
    endDate: '2025-08-31',
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2025-08-01T00:00:00Z',
  },
];

const mockExpenses: Expense[] = [
  {
    id: '1',
    amount: 25.50,
    category: 'food',
    description: 'Lunch at cafe',
    date: '2025-08-22',
    paymentMethod: 'credit_card',
    createdAt: '2025-08-22T12:00:00Z',
    updatedAt: '2025-08-22T12:00:00Z',
  },
  {
    id: '2',
    amount: 85.00,
    category: 'groceries',
    description: 'Weekly grocery shopping',
    date: '2025-08-21',
    paymentMethod: 'debit_card',
    createdAt: '2025-08-21T10:00:00Z',
    updatedAt: '2025-08-21T10:00:00Z',
  },
  {
    id: '3',
    amount: 15.00,
    category: 'transportation',
    description: 'Bus fare',
    date: '2025-08-22',
    paymentMethod: 'cash',
    createdAt: '2025-08-22T08:00:00Z',
    updatedAt: '2025-08-22T08:00:00Z',
  },
  {
    id: '4',
    amount: 45.00,
    category: 'entertainment',
    description: 'Movie tickets',
    date: '2025-08-20',
    paymentMethod: 'credit_card',
    createdAt: '2025-08-20T19:00:00Z',
    updatedAt: '2025-08-20T19:00:00Z',
  },
  {
    id: '5',
    amount: 120.00,
    category: 'utilities',
    description: 'Electricity bill',
    date: '2025-08-19',
    paymentMethod: 'bank_transfer',
    createdAt: '2025-08-19T14:00:00Z',
    updatedAt: '2025-08-19T14:00:00Z',
  },
];

// Simulate async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockAzureBudgetRepository {
  async getAllBudgets(): Promise<Budget[]> {
    await delay(500); // Simulate network delay
    return [...mockBudgets];
  }

  async getAllBudgetProgress(): Promise<BudgetProgress[]> {
    await delay(500);
    
    return mockBudgets.map(budget => {
      // Calculate spent amount for this budget
      const spent = mockExpenses
        .filter(expense => 
          expense.category === budget.category &&
          expense.date >= budget.startDate &&
          expense.date <= budget.endDate
        )
        .reduce((total, expense) => total + expense.amount, 0);

      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        remaining,
        percentage: Math.min(percentage, 100),
      } as BudgetProgress;
    });
  }

  async getBudgetById(id: string): Promise<Budget | null> {
    await delay(300);
    return mockBudgets.find(budget => budget.id === id) || null;
  }

  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    await delay(500);
    
    const newBudget: Budget = {
      ...budget,
      id: (mockBudgets.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockBudgets.push(newBudget);
    return newBudget;
  }
}

export class MockAzureExpenseRepository {
  async getAllExpenses(): Promise<Expense[]> {
    await delay(500);
    return [...mockExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getRecentExpenses(limit: number = 10): Promise<Expense[]> {
    await delay(300);
    return [...mockExpenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    await delay(400);
    return mockExpenses.filter(expense => 
      expense.date >= startDate && expense.date <= endDate
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTotalExpensesByDateRange(startDate: string, endDate: string): Promise<number> {
    await delay(300);
    return mockExpenses
      .filter(expense => expense.date >= startDate && expense.date <= endDate)
      .reduce((total, expense) => total + expense.amount, 0);
  }

  async getExpenseStatisticsByCategory(startDate?: string, endDate?: string): Promise<Array<{
    category: ExpenseCategory;
    total: number;
    count: number;
    average: number;
  }>> {
    await delay(400);
    
    let filteredExpenses = mockExpenses;
    if (startDate && endDate) {
      filteredExpenses = mockExpenses.filter(expense => 
        expense.date >= startDate && expense.date <= endDate
      );
    }

    // Group by category
    const categoryStats = new Map<ExpenseCategory, { total: number; count: number }>();
    
    filteredExpenses.forEach(expense => {
      const existing = categoryStats.get(expense.category) || { total: 0, count: 0 };
      categoryStats.set(expense.category, {
        total: existing.total + expense.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      count: stats.count,
      average: stats.total / stats.count,
    })).sort((a, b) => b.total - a.total);
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    await delay(500);
    
    const newExpense: Expense = {
      ...expense,
      id: (mockExpenses.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockExpenses.push(newExpense);
    return newExpense;
  }
}

// Export singleton instances
export const mockAzureBudgetRepository = new MockAzureBudgetRepository();
export const mockAzureExpenseRepository = new MockAzureExpenseRepository();

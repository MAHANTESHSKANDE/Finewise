/**
 * TypeScript types and interfaces for PocketBudget app
 */

export interface Expense {
  id?: number;
  amount: number;
  description: string;
  date: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id?: number;
  category: ExpenseCategory;
  amount: number;
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseFilter {
  period: 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  color: string;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isWarning: boolean; // >= 80%
}

export interface ExpenseReport {
  period: string;
  totalExpenses: number;
  categoryBreakdown: CategoryBreakdown[];
  topCategories: CategoryBreakdown[];
  dailyAverages?: { [key: string]: number };
  monthlyTrends?: { [key: string]: number };
}

export interface AICategorizationRequest {
  description: string;
  amount?: number;
}

export interface AICategorizationResponse {
  category: ExpenseCategory;
  confidence: number;
  alternativeCategories?: ExpenseCategory[];
}

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet';

export type ExpenseCategory = 
  | 'food'
  | 'transportation'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'healthcare'
  | 'education'
  | 'travel'
  | 'groceries'
  | 'housing'
  | 'insurance'
  | 'miscellaneous';

export interface DatabaseConfig {
  name: string;
  version: string;
  location: string;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  error: string;
  warning: string;
  success: string;
  disabled: string;
  placeholder: string;
  white: string;
  border: string;
  shadow: string;
}

export interface AppTheme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    fontWeight: {
      light: '300';
      normal: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}

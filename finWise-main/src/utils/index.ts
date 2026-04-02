/**
 * Utility functions for PocketBudget app
 */

import { ExpenseCategory, PaymentMethod } from '../types';

/**
 * Date formatting utilities
 */
export class DateUtils {
  /**
   * Format date to YYYY-MM-DD string
   */
  static formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date string to display format
   */
  static formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format date to month-year display
   */
  static formatMonthYear(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }

  /**
   * Get today's date as string
   */
  static getTodayString(): string {
    return this.formatDateToString(new Date());
  }

  /**
   * Get yesterday's date as string
   */
  static getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatDateToString(yesterday);
  }

  /**
   * Get start of current week
   */
  static getWeekStart(date: Date = new Date()): string {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day;
    weekStart.setDate(diff);
    return this.formatDateToString(weekStart);
  }

  /**
   * Get end of current week
   */
  static getWeekEnd(date: Date = new Date()): string {
    const weekEnd = new Date(date);
    const day = weekEnd.getDay();
    const diff = weekEnd.getDate() - day + 6;
    weekEnd.setDate(diff);
    return this.formatDateToString(weekEnd);
  }

  /**
   * Get start of current month
   */
  static getMonthStart(date: Date = new Date()): string {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    return this.formatDateToString(monthStart);
  }

  /**
   * Get end of current month
   */
  static getMonthEnd(date: Date = new Date()): string {
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return this.formatDateToString(monthEnd);
  }

  /**
   * Get start of current year
   */
  static getYearStart(date: Date = new Date()): string {
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return this.formatDateToString(yearStart);
  }

  /**
   * Get end of current year
   */
  static getYearEnd(date: Date = new Date()): string {
    const yearEnd = new Date(date.getFullYear(), 11, 31);
    return this.formatDateToString(yearEnd);
  }

  /**
   * Get date range for period
   */
  static getDateRangeForPeriod(period: 'week' | 'month' | 'year', date: Date = new Date()): { startDate: string; endDate: string } {
    switch (period) {
      case 'week':
        return {
          startDate: this.getWeekStart(date),
          endDate: this.getWeekEnd(date),
        };
      case 'month':
        return {
          startDate: this.getMonthStart(date),
          endDate: this.getMonthEnd(date),
        };
      case 'year':
        return {
          startDate: this.getYearStart(date),
          endDate: this.getYearEnd(date),
        };
      default:
        throw new Error(`Invalid period: ${period}`);
    }
  }

  /**
   * Check if date is today
   */
  static isToday(dateString: string): boolean {
    return dateString === this.getTodayString();
  }

  /**
   * Check if date is this week
   */
  static isThisWeek(dateString: string): boolean {
    const date = new Date(dateString);
    const weekStart = new Date(this.getWeekStart());
    const weekEnd = new Date(this.getWeekEnd());
    return date >= weekStart && date <= weekEnd;
  }

  /**
   * Check if date is this month
   */
  static isThisMonth(dateString: string): boolean {
    const date = new Date(dateString);
    const monthStart = new Date(this.getMonthStart());
    const monthEnd = new Date(this.getMonthEnd());
    return date >= monthStart && date <= monthEnd;
  }

  /**
   * Get days between two dates
   */
  static getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

/**
 * Currency formatting utilities
 */
export class CurrencyUtils {
  /**
   * Format amount as currency
   */
  static formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format amount without currency symbol
   */
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Parse currency string to number
   */
  static parseCurrency(currencyString: string): number {
    const cleanString = currencyString.replace(/[^0-9.-]+/g, '');
    return parseFloat(cleanString) || 0;
  }

  /**
   * Round amount to 2 decimal places
   */
  static roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate required field
   */
  static validateRequired(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Validate positive number
   */
  static validatePositiveNumber(value: number): boolean {
    return typeof value === 'number' && value > 0 && isFinite(value);
  }

  /**
   * Validate expense category
   */
  static validateCategory(category: string): category is ExpenseCategory {
    const validCategories: ExpenseCategory[] = [
      'food', 'groceries', 'transportation', 'entertainment', 'shopping',
      'utilities', 'healthcare', 'education', 'travel', 'housing', 'insurance', 'miscellaneous'
    ];
    return validCategories.includes(category as ExpenseCategory);
  }

  /**
   * Validate payment method
   */
  static validatePaymentMethod(method: string): method is PaymentMethod {
    const validMethods: PaymentMethod[] = [
      'cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'
    ];
    return validMethods.includes(method as PaymentMethod);
  }

  /**
   * Validate date string format (YYYY-MM-DD)
   */
  static validateDateString(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate: string, endDate: string): boolean {
    if (!this.validateDateString(startDate) || !this.validateDateString(endDate)) {
      return false;
    }
    
    return new Date(startDate) <= new Date(endDate);
  }
}

/**
 * Storage utilities
 */
export class StorageUtils {
  /**
   * Generate unique ID
   */
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Check if object is empty
   */
  static isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }
}

/**
 * Performance utilities
 */
export class PerformanceUtils {
  /**
   * Debounce function
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), wait);
      }
    };
  }

  /**
   * Simple cache implementation
   */
  static createCache<T>(maxSize = 100): {
    get: (key: string) => T | undefined;
    set: (key: string, value: T) => void;
    clear: () => void;
  } {
    const cache = new Map<string, T>();

    return {
      get: (key: string) => cache.get(key),
      set: (key: string, value: T) => {
        if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value;
          if (typeof firstKey !== 'undefined') {
            cache.delete(firstKey);
          }
        }
        cache.set(key, value);
      },
      clear: () => cache.clear(),
    };
  }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
  /**
   * Log error with context
   */
  static logError(error: Error, context: string, additionalData?: any): void {
    console.error(`[${context}] Error:`, error.message);
    if (additionalData) {
      console.error(`[${context}] Additional data:`, additionalData);
    }
    console.error(`[${context}] Stack trace:`, error.stack);
  }

  /**
   * Create user-friendly error message
   */
  static getUserFriendlyMessage(error: Error): string {
    // Common error patterns and their user-friendly messages
    const errorMessages: Record<string, string> = {
      'Network Error': 'Please check your internet connection and try again.',
      'Database Error': 'There was a problem saving your data. Please try again.',
      'Validation Error': 'Please check your input and try again.',
      'Permission Error': 'You don\'t have permission to perform this action.',
      'Not Found': 'The requested item was not found.',
    };

    // Check for specific error patterns
    for (const [pattern, message] of Object.entries(errorMessages)) {
      if (error.message.includes(pattern)) {
        return message;
      }
    }

    // Return generic message for unknown errors
    return 'An unexpected error occurred. Please try again.';
  }
}

// Export commonly used utilities
export const dateUtils = DateUtils;
export const currencyUtils = CurrencyUtils;
export const validationUtils = ValidationUtils;
export const storageUtils = StorageUtils;
export const performanceUtils = PerformanceUtils;
export const errorUtils = ErrorUtils;

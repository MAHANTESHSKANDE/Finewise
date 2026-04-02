/**
 * Unit Tests for Utility Functions
 */

import { dateUtils, currencyUtils, validationUtils } from '../src/utils';

describe('DateUtils', () => {
  describe('formatDateForDisplay', () => {
    it('should format date string correctly', () => {
      expect(dateUtils.formatDateForDisplay('2023-12-25')).toBe('Dec 25, 2023');
      expect(dateUtils.formatDateForDisplay('2023-01-01')).toBe('Jan 1, 2023');
    });
  });

  describe('formatDateToString', () => {
    it('should format date for storage', () => {
      const date = new Date('2023-12-25T00:00:00.000Z');
      expect(dateUtils.formatDateToString(date)).toBe('2023-12-25');
    });
  });

  describe('getTodayString', () => {
    it('should return today as string in YYYY-MM-DD format', () => {
      const result = dateUtils.getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatMonthYear', () => {
    it('should format month-year correctly', () => {
      expect(dateUtils.formatMonthYear('2023-12-25')).toBe('December 2023');
      expect(dateUtils.formatMonthYear('2023-01-01')).toBe('January 2023');
    });
  });

  describe('getDaysBetween', () => {
    it('should calculate days between dates correctly', () => {
      expect(dateUtils.getDaysBetween('2023-01-01', '2023-01-11')).toBe(10);
      expect(dateUtils.getDaysBetween('2023-01-11', '2023-01-01')).toBe(10);
    });
  });

  describe('isToday', () => {
    it('should check if date is today', () => {
      const today = dateUtils.getTodayString();
      expect(dateUtils.isToday(today)).toBe(true);
      expect(dateUtils.isToday('2023-01-01')).toBe(false);
    });
  });

  describe('getMonthStart and getMonthEnd', () => {
    it('should return start and end of month for current month', () => {
      const date = new Date('2023-03-15');
      expect(dateUtils.getMonthStart(date)).toBe('2023-03-01');
      expect(dateUtils.getMonthEnd(date)).toBe('2023-03-31');
    });
  });

  describe('getDateRangeForPeriod', () => {
    it('should return correct date ranges for periods', () => {
      const date = new Date('2023-03-15');
      const monthRange = dateUtils.getDateRangeForPeriod('month', date);
      expect(monthRange.startDate).toBe('2023-03-01');
      expect(monthRange.endDate).toBe('2023-03-31');
    });
  });
});

describe('CurrencyUtils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(currencyUtils.formatCurrency(1234.56)).toBe('$1,234.56');
      expect(currencyUtils.formatCurrency(0)).toBe('$0.00');
      expect(currencyUtils.formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should handle negative amounts', () => {
      expect(currencyUtils.formatCurrency(-100.50)).toBe('-$100.50');
    });
  });

  describe('formatAmount', () => {
    it('should format amounts without currency symbol', () => {
      expect(currencyUtils.formatAmount(1234.56)).toBe('1,234.56');
      expect(currencyUtils.formatAmount(0)).toBe('0.00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency strings correctly', () => {
      expect(currencyUtils.parseCurrency('$1,234.56')).toBe(1234.56);
      expect(currencyUtils.parseCurrency('1,234.56')).toBe(1234.56);
      expect(currencyUtils.parseCurrency('1234.56')).toBe(1234.56);
    });

    it('should handle invalid inputs', () => {
      expect(currencyUtils.parseCurrency('invalid')).toBe(0);
      expect(currencyUtils.parseCurrency('')).toBe(0);
    });
  });

  describe('roundAmount', () => {
    it('should round amounts to 2 decimal places', () => {
      expect(currencyUtils.roundAmount(100.123)).toBe(100.12);
      expect(currencyUtils.roundAmount(100.126)).toBe(100.13);
    });
  });
});

describe('ValidationUtils', () => {
  describe('validateEmail', () => {
    it('should validate emails correctly', () => {
      expect(validationUtils.validateEmail('test@example.com')).toBe(true);
      expect(validationUtils.validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validationUtils.validateEmail('invalid-email')).toBe(false);
      expect(validationUtils.validateEmail('@example.com')).toBe(false);
      expect(validationUtils.validateEmail('test@')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should validate required fields', () => {
      expect(validationUtils.validateRequired('value')).toBe(true);
      expect(validationUtils.validateRequired('')).toBe(false);
      expect(validationUtils.validateRequired(null)).toBe(false);
      expect(validationUtils.validateRequired(undefined)).toBe(false);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(validationUtils.validatePositiveNumber(100)).toBe(true);
      expect(validationUtils.validatePositiveNumber(0.01)).toBe(true);
    });

    it('should reject non-positive numbers', () => {
      expect(validationUtils.validatePositiveNumber(0)).toBe(false);
      expect(validationUtils.validatePositiveNumber(-100)).toBe(false);
      expect(validationUtils.validatePositiveNumber(NaN)).toBe(false);
      expect(validationUtils.validatePositiveNumber(Infinity)).toBe(false);
    });
  });

  describe('validateCategory', () => {
    it('should validate expense categories', () => {
      expect(validationUtils.validateCategory('food')).toBe(true);
      expect(validationUtils.validateCategory('groceries')).toBe(true);
      expect(validationUtils.validateCategory('transportation')).toBe(true);
    });

    it('should reject invalid categories', () => {
      expect(validationUtils.validateCategory('invalid-category')).toBe(false);
      expect(validationUtils.validateCategory('')).toBe(false);
    });
  });

  describe('validatePaymentMethod', () => {
    it('should validate payment methods', () => {
      expect(validationUtils.validatePaymentMethod('cash')).toBe(true);
      expect(validationUtils.validatePaymentMethod('credit_card')).toBe(true);
      expect(validationUtils.validatePaymentMethod('debit_card')).toBe(true);
    });

    it('should reject invalid payment methods', () => {
      expect(validationUtils.validatePaymentMethod('invalid-method')).toBe(false);
      expect(validationUtils.validatePaymentMethod('')).toBe(false);
    });
  });

  describe('validateDateString', () => {
    it('should validate date strings', () => {
      expect(validationUtils.validateDateString('2023-12-25')).toBe(true);
      expect(validationUtils.validateDateString('2023-01-01')).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(validationUtils.validateDateString('invalid-date')).toBe(false);
      expect(validationUtils.validateDateString('2023-13-01')).toBe(false);
      expect(validationUtils.validateDateString('2023-02-30')).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    it('should validate date ranges', () => {
      expect(validationUtils.validateDateRange('2023-01-01', '2023-01-31')).toBe(true);
      expect(validationUtils.validateDateRange('2023-01-01', '2023-01-01')).toBe(true);
    });

    it('should reject invalid date ranges', () => {
      expect(validationUtils.validateDateRange('2023-01-31', '2023-01-01')).toBe(false);
      expect(validationUtils.validateDateRange('invalid', '2023-01-01')).toBe(false);
    });
  });
});

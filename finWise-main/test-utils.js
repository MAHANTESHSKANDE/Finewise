/**
 * Quick test for debugging budget creation and reports
 */

import { dateUtils, currencyUtils, validationUtils } from '../src/utils';

// Test utility functions
console.log('=== Testing Utility Functions ===');

// Test date utils
const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

console.log('Today string:', dateUtils.formatDateToString(today));
console.log('Tomorrow string:', dateUtils.formatDateToString(tomorrow));
console.log('Date range valid:', validationUtils.validateDateRange(
  dateUtils.formatDateToString(today),
  dateUtils.formatDateToString(tomorrow)
));

// Test currency utils
console.log('Currency format:', currencyUtils.formatCurrency(123.45));
console.log('Rounded amount:', currencyUtils.roundAmount(123.456));

// Test validation utils
console.log('Valid category (food):', validationUtils.validateCategory('food'));
console.log('Invalid category (invalid):', validationUtils.validateCategory('invalid'));
console.log('Valid amount:', validationUtils.validatePositiveNumber(100));
console.log('Invalid amount:', validationUtils.validatePositiveNumber(-10));

console.log('=== All utility tests completed ===');

export default {};

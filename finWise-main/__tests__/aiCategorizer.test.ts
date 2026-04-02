/**
 * Unit Tests for AI Categorizer Service
 */

import { aiCategorizer } from '../src/services/aiCategorizer';
import { AICategorizationRequest } from '../src/types';

describe('AICategorizer', () => {
  describe('categorizeExpense', () => {
    it('should categorize food-related expenses correctly', async () => {
      const request: AICategorizationRequest = {
        description: 'McDonald\'s hamburger',
        amount: 12.99
      };
      const response = await aiCategorizer.categorizeExpense(request);
      expect(response.category).toBe('food');
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should categorize grocery expenses correctly', async () => {
      const request: AICategorizationRequest = {
        description: 'Walmart grocery shopping',
        amount: 85.50
      };
      const response = await aiCategorizer.categorizeExpense(request);
      expect(response.category).toBe('groceries');
    });

    it('should categorize transportation expenses correctly', async () => {
      const request: AICategorizationRequest = {
        description: 'Uber ride to airport',
        amount: 45.00
      };
      const response = await aiCategorizer.categorizeExpense(request);
      expect(response.category).toBe('transportation');
    });

    it('should categorize entertainment expenses correctly', async () => {
      const request: AICategorizationRequest = {
        description: 'Movie tickets',
        amount: 25.00
      };
      const response = await aiCategorizer.categorizeExpense(request);
      expect(response.category).toBe('entertainment');
    });

    it('should fallback to miscellaneous for unknown descriptions', async () => {
      const request: AICategorizationRequest = {
        description: 'Random unknown expense xyz123',
        amount: 100.00
      };
      const response = await aiCategorizer.categorizeExpense(request);
      expect(response.category).toBe('miscellaneous');
    });

    it('should handle empty descriptions', async () => {
      const request: AICategorizationRequest = {
        description: '',
        amount: 50.00
      };
      const response = await aiCategorizer.categorizeExpense(request);
      expect(response.category).toBe('miscellaneous');
    });

    it('should return response with confidence and alternatives', async () => {
      const request: AICategorizationRequest = {
        description: 'Coffee shop',
        amount: 5.99
      };
      const response = await aiCategorizer.categorizeExpense(request);
      expect(response).toHaveProperty('category');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('alternativeCategories');
      expect(Array.isArray(response.alternativeCategories)).toBe(true);
    });
  });

  describe('getCategoryDisplayName', () => {
    it('should return properly formatted category names', () => {
      expect(aiCategorizer.getCategoryDisplayName('food')).toBe('Food & Dining');
      expect(aiCategorizer.getCategoryDisplayName('groceries')).toBe('Groceries');
      expect(aiCategorizer.getCategoryDisplayName('transportation')).toBe('Transportation');
      expect(aiCategorizer.getCategoryDisplayName('entertainment')).toBe('Entertainment');
      expect(aiCategorizer.getCategoryDisplayName('shopping')).toBe('Shopping');
      expect(aiCategorizer.getCategoryDisplayName('utilities')).toBe('Utilities');
      expect(aiCategorizer.getCategoryDisplayName('healthcare')).toBe('Healthcare');
      expect(aiCategorizer.getCategoryDisplayName('education')).toBe('Education');
      expect(aiCategorizer.getCategoryDisplayName('travel')).toBe('Travel');
      expect(aiCategorizer.getCategoryDisplayName('housing')).toBe('Housing');
      expect(aiCategorizer.getCategoryDisplayName('insurance')).toBe('Insurance');
      expect(aiCategorizer.getCategoryDisplayName('miscellaneous')).toBe('Miscellaneous');
    });
  });

  describe('getAvailableCategories', () => {
    it('should return all available categories', () => {
      const categories = aiCategorizer.getAvailableCategories();
      expect(categories).toContain('food');
      expect(categories).toContain('groceries');
      expect(categories).toContain('transportation');
      expect(categories).toContain('entertainment');
      expect(categories).toContain('shopping');
      expect(categories).toContain('utilities');
      expect(categories).toContain('healthcare');
      expect(categories).toContain('education');
      expect(categories).toContain('travel');
      expect(categories).toContain('housing');
      expect(categories).toContain('insurance');
      expect(categories).toContain('miscellaneous');
      expect(categories.length).toBe(12);
    });
  });

  describe('isValidCategory', () => {
    it('should validate expense categories correctly', () => {
      expect(aiCategorizer.isValidCategory('food')).toBe(true);
      expect(aiCategorizer.isValidCategory('groceries')).toBe(true);
      expect(aiCategorizer.isValidCategory('transportation')).toBe(true);
      expect(aiCategorizer.isValidCategory('invalid-category')).toBe(false);
      expect(aiCategorizer.isValidCategory('')).toBe(false);
    });
  });
});

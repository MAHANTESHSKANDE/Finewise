/**
 * AI Categorization Service - Uses Hugging Face API for expense categorization
 */

import axios from 'axios';
import { AICategorizationRequest, AICategorizationResponse, ExpenseCategory } from '../types';

// Hugging Face configuration
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || 'your-api-key-here';

// Category keywords for fallback classification
const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  food: ['restaurant', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'coffee', 'pizza', 'burger', 'sushi', 'takeout'],
  groceries: ['grocery', 'groceries', 'supermarket', 'market', 'store', 'walmart', 'target', 'costco', 'safeway'],
  transportation: ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'parking', 'car', 'vehicle'],
  entertainment: ['movie', 'cinema', 'theater', 'concert', 'game', 'entertainment', 'netflix', 'spotify', 'music'],
  shopping: ['shop', 'shopping', 'clothes', 'clothing', 'amazon', 'purchase', 'buy', 'mall', 'store'],
  utilities: ['electric', 'electricity', 'water', 'gas bill', 'internet', 'phone', 'utility', 'cable', 'wifi'],
  healthcare: ['doctor', 'hospital', 'medical', 'pharmacy', 'medicine', 'health', 'dental', 'clinic'],
  education: ['school', 'university', 'college', 'book', 'course', 'education', 'tuition', 'study'],
  travel: ['hotel', 'flight', 'airline', 'vacation', 'travel', 'booking', 'airbnb', 'trip'],
  housing: ['rent', 'mortgage', 'home', 'house', 'apartment', 'housing', 'property'],
  insurance: ['insurance', 'premium', 'policy', 'coverage', 'health insurance', 'car insurance'],
  miscellaneous: ['misc', 'miscellaneous', 'other', 'various', 'general'],
};

// Default categories in order of preference
const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  'food',
  'groceries',
  'transportation',
  'shopping',
  'entertainment',
  'utilities',
  'healthcare',
  'education',
  'travel',
  'housing',
  'insurance',
  'miscellaneous',
];

export class AICategorizer {
  private isDevelopment = __DEV__;

  /**
   * Categorize expense using AI
   */
  async categorizeExpense(request: AICategorizationRequest): Promise<AICategorizationResponse> {
    try {
      console.log('[AICategorizer] Categorizing expense:', request);

      // In development mode, use mock categorization
      if (this.isDevelopment || !HUGGING_FACE_API_KEY || HUGGING_FACE_API_KEY === 'your-api-key-here') {
        console.log('[AICategorizer] Using mock categorization for development');
        return this.mockCategorizeExpense(request);
      }

      // Try AI categorization first
      try {
        const aiResponse = await this.callHuggingFaceAPI(request);
        if (aiResponse) {
          console.log('[AICategorizer] AI categorization successful:', aiResponse);
          return aiResponse;
        }
      } catch (error) {
        console.warn('[AICategorizer] AI categorization failed, falling back to keyword matching:', error);
      }

      // Fallback to keyword-based categorization
      const fallbackResponse = this.keywordBasedCategorization(request);
      console.log('[AICategorizer] Using fallback categorization:', fallbackResponse);
      return fallbackResponse;

    } catch (error) {
      console.error('[AICategorizer] Error in categorization:', error);
      
      // Return default category as last resort
      return {
        category: 'miscellaneous',
        confidence: 0.1,
        alternativeCategories: ['food', 'shopping'],
      };
    }
  }

  /**
   * Mock categorization for development
   */
  private async mockCategorizeExpense(request: AICategorizationRequest): Promise<AICategorizationResponse> {
    // Simulate AI processing delay
    return new Promise<AICategorizationResponse>((resolve) => {
      setTimeout(() => {
        const result = this.keywordBasedCategorization(request);
        // Add some mock confidence and alternatives
        result.confidence = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
        result.alternativeCategories = this.getAlternativeCategories(result.category as ExpenseCategory);
        resolve(result);
      }, 500 + Math.random() * 1000); // 500-1500ms delay
    });
  }

  /**
   * Call Hugging Face API for categorization
   */
  private async callHuggingFaceAPI(request: AICategorizationRequest): Promise<AICategorizationResponse | null> {
    try {
      // Prepare the prompt for categorization
      const prompt = this.buildCategorizationPrompt(request);

      const response = await axios.post(
        HUGGING_FACE_API_URL,
        {
          inputs: prompt,
          parameters: {
            max_length: 50,
            temperature: 0.3,
            do_sample: true,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data && response.data[0] && response.data[0].generated_text) {
        const generatedText = response.data[0].generated_text.toLowerCase();
        const category = this.extractCategoryFromResponse(generatedText);
        
        if (category) {
          return {
            category,
            confidence: 0.8,
            alternativeCategories: this.getAlternativeCategories(category),
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[AICategorizer] Hugging Face API error:', error);
      return null;
    }
  }

  /**
   * Build prompt for AI categorization
   */
  private buildCategorizationPrompt(request: AICategorizationRequest): string {
    const categories = DEFAULT_CATEGORIES.join(', ');
    
    return `Categorize this expense: "${request.description}"${request.amount ? ` ($${request.amount})` : ''}
    
Available categories: ${categories}

The category is:`;
  }

  /**
   * Extract category from AI response
   */
  private extractCategoryFromResponse(response: string): ExpenseCategory | null {
    const lowerResponse = response.toLowerCase();
    
    // Look for exact category matches
    for (const category of DEFAULT_CATEGORIES) {
      if (lowerResponse.includes(category)) {
        return category;
      }
    }

    return null;
  }

  /**
   * Keyword-based categorization fallback
   */
  private keywordBasedCategorization(request: AICategorizationRequest): AICategorizationResponse {
    const description = request.description.toLowerCase();
    
    // Score each category based on keyword matches
    const categoryScores: Record<ExpenseCategory, number> = {
      food: 0,
      groceries: 0,
      transportation: 0,
      entertainment: 0,
      shopping: 0,
      utilities: 0,
      healthcare: 0,
      education: 0,
      travel: 0,
      housing: 0,
      insurance: 0,
      miscellaneous: 0,
    };

    // Calculate scores based on keyword matches
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const categoryKey = category as ExpenseCategory;
      for (const keyword of keywords) {
        if (description.includes(keyword)) {
          categoryScores[categoryKey]++;
          // Boost score for exact matches
          if (description === keyword) {
            categoryScores[categoryKey] += 2;
          }
        }
      }
    }

    // Find category with highest score
    let bestCategory: ExpenseCategory = 'miscellaneous';
    let bestScore = 0;

    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category as ExpenseCategory;
      }
    }

    // Calculate confidence based on score
    const maxPossibleScore = Math.max(...Object.values(categoryScores));
    const confidence = maxPossibleScore > 0 ? bestScore / (maxPossibleScore + 2) : 0.3;

    return {
      category: bestCategory,
      confidence,
      alternativeCategories: this.getAlternativeCategories(bestCategory),
    };
  }

  /**
   * Get alternative categories for a given category
   */
  private getAlternativeCategories(category: ExpenseCategory): ExpenseCategory[] {
    const alternatives: Record<ExpenseCategory, ExpenseCategory[]> = {
      food: ['groceries', 'entertainment'],
      groceries: ['food', 'shopping'],
      transportation: ['travel', 'miscellaneous'],
      entertainment: ['food', 'shopping'],
      shopping: ['entertainment', 'miscellaneous'],
      utilities: ['housing', 'miscellaneous'],
      healthcare: ['insurance', 'miscellaneous'],
      education: ['miscellaneous', 'shopping'],
      travel: ['transportation', 'entertainment'],
      housing: ['utilities', 'insurance'],
      insurance: ['healthcare', 'housing'],
      miscellaneous: ['shopping', 'entertainment'],
    };

    return alternatives[category] || ['miscellaneous'];
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): ExpenseCategory[] {
    return [...DEFAULT_CATEGORIES];
  }

  /**
   * Validate if a category is valid
   */
  isValidCategory(category: string): category is ExpenseCategory {
    return DEFAULT_CATEGORIES.includes(category as ExpenseCategory);
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: ExpenseCategory): string {
    const displayNames: Record<ExpenseCategory, string> = {
      food: 'Food & Dining',
      groceries: 'Groceries',
      transportation: 'Transportation',
      entertainment: 'Entertainment',
      shopping: 'Shopping',
      utilities: 'Utilities',
      healthcare: 'Healthcare',
      education: 'Education',
      travel: 'Travel',
      housing: 'Housing',
      insurance: 'Insurance',
      miscellaneous: 'Miscellaneous',
    };

    return displayNames[category] || category;
  }
}

// Export singleton instance
export const aiCategorizer = new AICategorizer();

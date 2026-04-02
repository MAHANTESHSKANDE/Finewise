/**
 * API Service for PocketBudget React Native App
 * Connects to the backend API server
 */

import { getCurrentApiUrl, ENV_CONFIG } from '../config/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getCurrentApiUrl();
  }

  /**
   * Make HTTP request to API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`[API] ${options.method || 'GET'} ${url}`);
      console.log(`[API] Base URL: ${this.baseUrl}`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Use minimal headers like curl
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'PocketBudget-RN/1.0',
          ...(options.method === 'POST' && { 'Content-Type': 'application/json' }),
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      console.log(`[API] Response status: ${response.status}`);
      console.log(`[API] Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] HTTP Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<T> = await response.json();
      console.log(`[API] Response data:`, result);
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data as T;
    } catch (error) {
      console.error(`[API] Network Error in ${endpoint}:`, error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error(`Cannot connect to API server at ${this.baseUrl}. Please check:\n1. Backend server is running on port 3000\n2. Network security config allows HTTP traffic\n3. Using correct URL for your platform\n4. Android: Use 10.0.2.2:3000 for emulator\n5. iOS: Use localhost:3000 for simulator`);
      }
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout - API server at ${this.baseUrl} took too long to respond`);
      }
      
      throw error;
    }
  }

  /**
   * Budget API Methods
   */
  budgets = {
    getAll: () => this.request<any[]>('/budgets'),
    
    getProgress: () => this.request<any[]>('/budgets/progress'),
    
    getById: (id: string) => this.request<any>(`/budgets/${id}`),
    
    create: (budget: {
      category: string;
      amount: number;
      startDate: string;
      endDate: string;
    }) => this.request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    }),
  };

  /**
   * Expense API Methods
   */
  expenses = {
    getAll: (params?: {
      startDate?: string;
      endDate?: string;
      category?: string;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      if (params?.category) query.append('category', params.category);
      if (params?.limit) query.append('limit', params.limit.toString());
      
      const queryString = query.toString();
      const endpoint = queryString ? `/expenses?${queryString}` : '/expenses';
      
      return this.request<any[]>(endpoint);
    },
    
    getRecent: (limit: number = 10) => 
      this.request<any[]>(`/expenses/recent?limit=${limit}`),
    
    getByDateRange: (startDate: string, endDate: string) =>
      this.request<any[]>(`/expenses?startDate=${startDate}&endDate=${endDate}`),
    
    getTotalByDateRange: (startDate: string, endDate: string) =>
      this.request<{ total: number }>(`/expenses/total?startDate=${startDate}&endDate=${endDate}`),
    
    getStatistics: (startDate?: string, endDate?: string) => {
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      
      const queryString = query.toString();
      const endpoint = queryString ? `/expenses/stats?${queryString}` : '/expenses/stats';
      
      return this.request<Array<{
        category: string;
        total: number;
        count: number;
        average: number;
      }>>(endpoint);
    },
    
    getById: (id: string) => this.request<any>(`/expenses/${id}`),
    
    create: (expense: {
      amount: number;
      category: string;
      description: string;
      date: string;
      paymentMethod: string;
    }) => this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),
  };

  /**
   * Health check - Test connectivity to backend
   */
  async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const healthUrl = `${this.baseUrl.replace('/api', '')}/health`;
      console.log(`[API] Health check: ${healthUrl}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'PocketBudget-RN/1.0',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`[API] Health check response status: ${response.status}`);
      
      if (!response.ok) {
        return { 
          success: false, 
          message: `Backend API returned ${response.status}: ${response.statusText}` 
        };
      }
      
      const result = await response.json();
      console.log(`[API] Health check result:`, result);
      
      if (result.status === 'healthy') {
        return { success: true, message: 'Backend API is healthy' };
      } else {
        return { success: false, message: 'Backend API returned unhealthy status' };
      }
    } catch (error) {
      console.error('[API] Health check failed:', error);
      
      if (error.name === 'AbortError') {
        return { 
          success: false, 
          message: `Health check timeout - cannot reach backend API at ${this.baseUrl}` 
        };
      }
      
      return { 
        success: false, 
        message: `Cannot reach backend API: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export the class for testing with different URLs
export { ApiService };

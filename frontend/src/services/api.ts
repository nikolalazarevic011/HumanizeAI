import axios from 'axios';
import { HumanizeRequest, HumanizeResponse, ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle auth errors
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it
      localStorage.removeItem('auth_token');
      // Optionally trigger a page reload or redirect to login
      window.location.reload();
    }
    
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const humanizationApi = {
  // Humanize text
  humanize: async (request: HumanizeRequest): Promise<HumanizeResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<HumanizeResponse>>('/humanize', request);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to humanize text');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || 'Network error occurred');
    }
  },

  // Get available styles
  getStyles: async () => {
    try {
      const response = await apiClient.get<ApiResponse>('/humanize/styles');
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get styles');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || 'Network error occurred');
    }
  },

  // Health check
  health: async () => {
    try {
      const response = await apiClient.get<ApiResponse>('/health');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Health check failed');
    }
  },
};

export default humanizationApi;
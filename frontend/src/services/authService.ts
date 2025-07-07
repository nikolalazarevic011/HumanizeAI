import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
  message?: string;
  timestamp: string;
}

interface LoginResponse {
  user: {
    id: string;
    username: string;
    lastLogin?: string;
  };
  token: string;
}

interface VerifyResponse {
  user: {
    id: string;
    username: string;
  };
  valid: boolean;
}

class AuthService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await this.apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
        username,
        password,
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      throw new Error('Network error occurred');
    }
  }

  async verifyToken(token: string): Promise<ApiResponse<VerifyResponse>> {
    try {
      const response = await this.apiClient.get<ApiResponse<VerifyResponse>>('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      throw new Error('Network error occurred');
    }
  }

  async logout(token: string): Promise<ApiResponse> {
    try {
      const response = await this.apiClient.post<ApiResponse>('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      
      throw new Error('Network error occurred');
    }
  }
}

export const authService = new AuthService();

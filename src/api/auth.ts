import apiClient from './client';
import {
  LoginRequest,
  LoginResponse,
  VerifyResponse,
  ChangePasswordRequest,
  ResetPasswordRequest,
} from '@/types/user';

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', data),
  logout: () => apiClient.post<{ success: boolean; message: string }>('/auth/logout'),
  verify: () => apiClient.get<VerifyResponse>('/auth/verify'),
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<{ success: boolean; message: string }>('/auth/change-password', data),
  forgotPassword: (email: string) =>
    apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { email }),
  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', data),
};

export default authApi;

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: number | string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreate {
  email: string;
  password?: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UserUpdate {
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface VerifyResponse {
  valid: boolean;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/types/user';
import { AuthContext } from './auth-context';
import authApi from '@/api/auth';
import toast from 'react-hot-toast';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('loan_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const token = localStorage.getItem('loan_auth_token');
  const isAuthenticated = !!token && !!user;

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('loan_auth_token');
    localStorage.removeItem('loan_user');
    setUser(null);
  }, []);

  const verify = useCallback(async () => {
    const storedToken = localStorage.getItem('loan_auth_token');
    if (!storedToken) {
      setIsInitialized(true);
      return;
    }

    try {
      const response = await authApi.verify();
      if (response.data.valid && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('loan_user', JSON.stringify(response.data.user));
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsInitialized(true);
    }
  }, [logout]);

  useEffect(() => {
    verify();
  }, [verify]);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('loan_auth_token', receivedToken);
      localStorage.setItem('loan_user', JSON.stringify(receivedUser));
      setUser(receivedUser);
      toast.success(`Welcome back, ${receivedUser.fullName}!`);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string } | string;
          headers?: Record<string, string>;
        };
        message?: string;
      };
      const status = axiosErr.response?.status;
      const rawData = axiosErr.response?.data;

      let msg = typeof rawData === 'object' && rawData !== null ? rawData.message || rawData.error : undefined;

      if (!msg) {
        if (typeof rawData === 'string' && (rawData.includes('<!DOCTYPE') || rawData.includes('<html'))) {
          msg = 'Authentication API routing failed. The server returned HTML instead of a JSON API response.';
        } else if (status === 401) {
          msg = 'Invalid credentials. Please verify your email and password.';
        } else if (status === 403) {
          msg = 'Account is deactivated. Please contact an administrator.';
        } else if (status === 429) {
          msg = 'Too many login attempts. Please wait 15 minutes and try again.';
        } else if (!axiosErr.response) {
          msg = 'Cannot connect to backend server. Is the API server running?';
        } else {
          msg = 'Login failed due to a server error. Please check backend logs.';
        }
      }
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authApi.changePassword({ currentPassword, newPassword });
      toast.success(response.data.message || 'Password changed successfully');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Failed to change password.';
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermission = (requiredRoles?: string[]): boolean => {
    if (!user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (user.role === 'admin') return true;
    return requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isInitialized,
        login,
        logout,
        verify,
        changePassword,
        checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

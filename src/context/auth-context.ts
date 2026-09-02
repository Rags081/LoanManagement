import { createContext } from 'react';
import { User } from '@/types/user';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  verify: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkPermission: (requiredRoles?: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

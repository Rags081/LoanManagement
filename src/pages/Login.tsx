import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Form/Input';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginSchemaType } from '@/utils/validation';
import { APP_NAME } from '@/utils/constants';
import { Lock, Mail, AlertCircle, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const redirectPath = searchParams.get('redirect') || '/';

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setAuthError(null);
    try {
      await login(data.email, data.password);
      navigate(redirectPath, { replace: true });
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
          msg = 'Unable to reach backend API server. Please ensure the backend is running.';
        } else {
          msg = 'An unexpected server error occurred. Please verify database and backend status.';
        }
      }
      setAuthError(msg);
    }
  };

  const handleFillDemo = () => {
    setValue('email', 'admin@loanmanagement.com');
    setValue('password', 'Admin@123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-600/30">
              ₹
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{APP_NAME}</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to manage loans & capital</p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@loanmanagement.com"
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  alert('Password reset link has been dispatched to your email if account exists.')
                }
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
              Sign In
            </Button>
          </form>
        </Card>

        {/* Demo Credentials Helper Box */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-xs text-slate-600 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Demo Administrator Account</p>
              <p className="text-slate-500 mt-0.5">
                <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">admin@loanmanagement.com</code> /{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Admin@123</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-primary-600 hover:text-primary-700 font-semibold whitespace-nowrap"
          >
            Auto-fill
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

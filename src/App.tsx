import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Layout from '@/components/common/Layout';

// Lazy Loaded Pages for Optimized Chunking & Performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Borrowers = lazy(() => import('@/pages/Borrowers'));
const Loans = lazy(() => import('@/pages/Loans'));
const LoanDetails = lazy(() => import('@/pages/LoanDetails'));
const Payments = lazy(() => import('@/pages/Payments'));
const Capital = lazy(() => import('@/pages/Capital'));
const Reports = lazy(() => import('@/pages/Reports'));
const ImportExport = lazy(() => import('@/pages/ImportExport'));
const Settings = lazy(() => import('@/pages/Settings'));
const Login = lazy(() => import('@/pages/Login'));
const Unauthorized = lazy(() => import('@/pages/Unauthorized'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PageLoader: React.FC = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="flex flex-col items-center space-y-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-md"></div>
      <p className="text-sm font-medium text-slate-500">Loading module...</p>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  fontSize: '14px',
                  borderRadius: '8px',
                },
              }}
            />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Protected Routes inside Layout */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Dashboard: All authenticated users */}
                    <Route index element={<Dashboard />} />

                    {/* Borrowers: Admin, Operator */}
                    <Route
                      path="borrowers"
                      element={
                        <ProtectedRoute requiredRoles={['admin', 'operator']}>
                          <Borrowers />
                        </ProtectedRoute>
                      }
                    />

                    {/* Loans: Admin, Operator */}
                    <Route
                      path="loans"
                      element={
                        <ProtectedRoute requiredRoles={['admin', 'operator']}>
                          <Loans />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="loans/:id"
                      element={
                        <ProtectedRoute requiredRoles={['admin', 'operator']}>
                          <LoanDetails />
                        </ProtectedRoute>
                      }
                    />

                    {/* Payments: Admin, Operator */}
                    <Route
                      path="payments"
                      element={
                        <ProtectedRoute requiredRoles={['admin', 'operator']}>
                          <Payments />
                        </ProtectedRoute>
                      }
                    />

                    {/* Capital Management: Admin Only */}
                    <Route
                      path="capital"
                      element={
                        <ProtectedRoute requiredRoles={['admin']}>
                          <Capital />
                        </ProtectedRoute>
                      }
                    />

                    {/* Reports: Admin, Operator, Viewer */}
                    <Route
                      path="reports"
                      element={
                        <ProtectedRoute requiredRoles={['admin', 'operator', 'viewer']}>
                          <Reports />
                        </ProtectedRoute>
                      }
                    />

                    {/* Data Import/Export: Admin, Operator */}
                    <Route
                      path="import-export"
                      element={
                        <ProtectedRoute requiredRoles={['admin', 'operator']}>
                          <ImportExport />
                        </ProtectedRoute>
                      }
                    />

                    {/* Settings: Admin Only */}
                    <Route
                      path="settings"
                      element={
                        <ProtectedRoute requiredRoles={['admin']}>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Fallback 404 / Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

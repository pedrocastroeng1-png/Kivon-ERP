import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppLayout } from '@/src/shared/components/layout/AppLayout';
import LoginPage from '@/src/features/auth/pages/LoginPage';
import DashboardPage from '@/src/features/admin/pages/DashboardPage';
import DailyRegisterPage from '@/src/features/daily-register/pages/DailyRegisterPage';
import { useAuth } from './providers/AuthProvider';

// A simple wrapper to protect admin routes
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  
  if (loading) return null;
  
  if (profile?.profiles?.code !== 'admin') {
    return <Navigate to="/diarias" replace />;
  }
  
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <AdminRoute>
            <DashboardPage />
          </AdminRoute>
        ),
      },
      {
        path: 'diarias',
        element: <DailyRegisterPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

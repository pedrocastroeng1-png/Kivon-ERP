import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppLayout } from '@/src/shared/components/layout/AppLayout';
import LoginPage from '@/src/features/auth/pages/LoginPage';
import UpdatePasswordPage from '@/src/features/auth/pages/UpdatePasswordPage';
import DashboardPage from '@/src/features/admin/pages/DashboardPage';
import DailyRegisterPage from '@/src/features/daily-register/pages/DailyRegisterPage';
import DailyReportsPage from '@/src/features/daily-reports/pages/DailyReportsPage';
import JobRolesPage from '@/src/features/job-roles/pages/JobRolesPage';
import ProjectsPage from '@/src/features/projects/pages/ProjectsPage';
import EmployeesPage from '@/src/features/employees/pages/EmployeesPage';
import UsersPage from '@/src/features/users/pages/UsersPage';
import ReportsPage from '@/src/features/reports/pages/ReportsPage';
import DownloadsPage from '@/src/features/downloads/pages/DownloadsPage';
import NotificationsPage from '@/src/features/admin/notifications/pages/NotificationsPage';
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
    path: '/update-password',
    element: <UpdatePasswordPage />,
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
      {
        path: 'fechamento-diario',
        element: <DailyReportsPage />,
      },
      {
        path: 'funcionarios',
        element: (
          <AdminRoute>
            <EmployeesPage />
          </AdminRoute>
        ),
      },
      {
        path: 'obras',
        element: (
          <AdminRoute>
            <ProjectsPage />
          </AdminRoute>
        ),
      },
      {
        path: 'cargos',
        element: (
          <AdminRoute>
            <JobRolesPage />
          </AdminRoute>
        ),
      },
      {
        path: 'relatorios',
        element: (
          <AdminRoute>
            <ReportsPage />
          </AdminRoute>
        ),
      },
      {
        path: 'usuarios',
        element: (
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        ),
      },
      {
        path: 'admin/notifications',
        element: (
          <AdminRoute>
            <NotificationsPage />
          </AdminRoute>
        ),
      },
      {
        path: 'downloads',
        element: <DownloadsPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RegulationsPage from './pages/RegulationsPage';
import RegulationDetailPage from './pages/RegulationDetailPage';
import SearchPage from './pages/SearchPage';
import AIQueryPage from './pages/AIQueryPage';
import UploadPage from './pages/UploadPage';
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/layout/Layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="regulations" element={<RegulationsPage />} />
        <Route path="regulations/:id" element={<RegulationDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="ai-query" element={<AIQueryPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;

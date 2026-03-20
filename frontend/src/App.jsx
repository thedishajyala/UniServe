import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import HomePage from './pages/HomePage';
import CreateOrderPage from './pages/CreateOrderPage';
import PartnersPage from './pages/PartnersPage';
import ChatPage from './pages/ChatPage';
import TrackingPage from './pages/TrackingPage';
import ReviewPage from './pages/ReviewPage';
import EarningsPage from './pages/EarningsPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="full-center">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>Loading UniServe...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!user.profile_complete) return <Navigate to="/setup" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.profile_complete) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/setup" element={<ProfileSetupPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/order/create" element={<ProtectedRoute><CreateOrderPage /></ProtectedRoute>} />
      <Route path="/order/:orderId/partners" element={<ProtectedRoute><PartnersPage /></ProtectedRoute>} />
      <Route path="/chat/:orderId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/order/:orderId/track" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
      <Route path="/order/:orderId/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
      <Route path="/earnings" element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                fontSize: 14,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

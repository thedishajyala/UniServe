import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { useNotifications } from './hooks/useNotifications';
import toast from 'react-hot-toast';

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

function GlobalSocketListeners() {
  const socket = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notify } = useNotifications();

  React.useEffect(() => {
    if (!socket || !user) return;

    // Globally connect to their personal room
    socket.emit('join_user_room', { userId: user._id });

    // Listen for global chat notifications
    const handleNewMessage = ({ orderId, senderName, content }) => {
      // Don't toast if we are currently looking at that exact chat window!
      if (window.location.pathname === `/chat/${orderId}`) return;

      toast((t) => (
        <div style={{ cursor: 'pointer', flex: 1, padding: '4px 0' }} onClick={() => {
          toast.dismiss(t.id);
          navigate(`/chat/${orderId}`);
        }}>
          <p style={{ fontWeight: 700, marginBottom: 2 }}>💬 New message from {senderName}</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{content?.slice(0, 40)}{content?.length > 40 ? '...' : ''}</p>
        </div>
      ), { duration: 4000, position: 'top-center' });

      notify(`New message from ${senderName}`, content, `/chat/${orderId}`);
    };

    socket.on('new_chat_message', handleNewMessage);

    return () => {
      socket.off('new_chat_message', handleNewMessage);
    };
  }, [socket, user, navigate, notify]);

  return null;
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
          <GlobalSocketListeners />
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

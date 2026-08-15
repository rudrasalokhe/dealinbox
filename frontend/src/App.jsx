import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { CopilotModal } from './components/CopilotModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { EnquiryDetailPage } from './pages/EnquiryDetailPage';
import { HeatmapPage } from './pages/HeatmapPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PositioningPage } from './pages/PositioningPage';
import { NegotiationReplayPage } from './pages/NegotiationReplayPage';
import { ResponsePage } from './pages/ResponsePage';
import { PublicPage } from './pages/PublicPage';
import { BrandPortalPage } from './pages/BrandPortalPage';
import { SettingsPage } from './pages/SettingsPage';
import { UpgradePage } from './pages/UpgradePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--t3)' }}>Loading DealInbox...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const LayoutShell = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isPublicRoute =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/@') ||
    location.pathname.startsWith('/track/');

  if (!user || isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="os-shell">
      <Sidebar />
      <main className="os-main">
        <Navbar />
        <section className="os-content">{children}</section>
        <CopilotModal />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <LayoutShell>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/@:username" element={<PublicPage />} />
            <Route path="/track/:token" element={<BrandPortalPage />} />

            {/* Protected Workspace Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/enquiries" element={<ProtectedRoute><EnquiriesPage /></ProtectedRoute>} />
            <Route path="/enquiries/:eid" element={<ProtectedRoute><EnquiryDetailPage /></ProtectedRoute>} />
            <Route path="/enquiries/:eid/respond" element={<ProtectedRoute><ResponsePage /></ProtectedRoute>} />
            <Route path="/enquiries/:eid/replay" element={<ProtectedRoute><NegotiationReplayPage /></ProtectedRoute>} />
            <Route path="/heatmap" element={<ProtectedRoute><HeatmapPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/positioning" element={<ProtectedRoute><PositioningPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/upgrade" element={<ProtectedRoute><UpgradePage /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutShell>
      </Router>
    </AuthProvider>
  );
}

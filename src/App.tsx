import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ProposalWizard } from './pages/ProposalWizard';
import { ProposalDetailPage } from './pages/ProposalDetailPage';
import { ProposalReviewPage } from './pages/ProposalReviewPage';
import { JoinProposalPage } from './pages/JoinProposalPage';
import { ProfilePage } from './pages/ProfilePage';
import { useAuth } from './contexts/AuthContext';

function NavigationLogger() {
  const location = useLocation();
  useEffect(() => {
    console.log('[Nav]', location.pathname, location.search);
  }, [location]);
  return null;
}

function DashboardRedirect() {
  const { activeRole, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const roles = profile?.roles?.length ? profile.roles : profile?.role ? [profile.role] : [];

  if (activeRole === 'organizer' || (!activeRole && roles.includes('organizer'))) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  return <Navigate to="/officer/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationLogger />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer/dashboard"
            element={
              <ProtectedRoute requiredRole="officer">
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute requiredRole="organizer">
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/events"
            element={
              <ProtectedRoute requiredRole="organizer">
                <EventsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/events/:id"
            element={
              <ProtectedRoute requiredRole="organizer">
                <EventDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/proposals/new"
            element={
              <ProtectedRoute requiredRole="officer">
                <ProposalWizard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/proposals/:id/edit"
            element={
              <ProtectedRoute requiredRole="officer">
                <ProposalWizard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/proposals/:id/join"
            element={
              <ProtectedRoute>
                <JoinProposalPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/proposals/:id"
            element={
              <ProtectedRoute>
                <ProposalDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/proposals/:id/review"
            element={
              <ProtectedRoute requiredRole="organizer">
                <ProposalReviewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

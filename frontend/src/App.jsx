import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import MainLand from './pages/MainLand.jsx';
import LandingPage from './pages/LandingPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardHome from './pages/DashboardHome.jsx';
import EventsPage from './pages/EventsPage.jsx';
import CreateEventPage from './pages/CreateEventPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';
import EditEventPage from './pages/EditEventPage.jsx';
import PayoutsPage from './pages/PayoutsPage.jsx';
import PromoEmailPage from './pages/PromoEmailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import CertificatePage from './pages/CertificatePage.jsx';
import PublicEventPage from './pages/PublicEventPage.jsx';
import PublicRegistrationPage from './pages/PublicRegistrationPage.jsx';
import AcceptInvitePage from './pages/AcceptInvitePage.jsx';
import CheckInPage from './pages/CheckInPage.jsx';
import TicketPage from './pages/TicketPage.jsx';
import {
  PrivacyPolicyPage,
  TermsPage,
  ContactPage,
  RefundPolicyPage
} from './pages/LegalPages';
import PricingPage from './pages/PricingPage.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<MainLand/>} />
          <Route path="/discover" element={<DiscoverPage/>} />
          <Route path="/org" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
          <Route path="/e/:slug" element={<PublicEventPage />} />
          <Route path="/e/:slug/register" element={<PublicRegistrationPage />} />
          <Route path="/ticket/:ticketId" element={<TicketPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
          <Route path="/dashboard/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/dashboard/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
          <Route path="/dashboard/events/create" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
          <Route path="/dashboard/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
          <Route path="/dashboard/events/:id/edit" element={<ProtectedRoute><EditEventPage /></ProtectedRoute>} />
          <Route path="/dashboard/certificates" element={<ProtectedRoute><CertificatePage /></ProtectedRoute>} />
          <Route path="/dashboard/payouts" element={<ProtectedRoute><PayoutsPage /></ProtectedRoute>} />
          <Route path="/dashboard/promo" element={<ProtectedRoute><PromoEmailPage /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/checkin/:eventId" element={<ProtectedRoute><CheckInPage /></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

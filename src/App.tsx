import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GymDataProvider } from './context/GymDataContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { MemberProfilePage } from './pages/MemberProfilePage';
import { MembershipsPage } from './pages/MembershipsPage';
import { RenewalsPage } from './pages/RenewalsPage';
import { AttendancePage } from './pages/AttendancePage';
import { PaymentsPage } from './pages/PaymentsPage';
import { RevenuePage } from './pages/RevenuePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { BirthdaysPage } from './pages/BirthdaysPage';
import { FestivalWishesPage } from './pages/FestivalWishesPage';
import { ReportsPage } from './pages/ReportsPage';
import { StaffPage } from './pages/StaffPage';
import { SettingsPage } from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#0E0F11] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-orange-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  if (isAuthLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <GymDataProvider>
            <BrowserRouter>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicOnlyRoute>
                      <ForgotPasswordPage />
                    </PublicOnlyRoute>
                  }
                />

                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/members" element={<MembersPage />} />
                  <Route path="/members/:id" element={<MemberProfilePage />} />
                  <Route path="/memberships" element={<MembershipsPage />} />
                  <Route path="/renewals" element={<RenewalsPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/payments" element={<PaymentsPage />} />
                  <Route path="/revenue" element={<RevenuePage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/enquiries" element={<EnquiriesPage />} />
                  <Route path="/communication/birthdays" element={<BirthdaysPage />} />
                  <Route path="/communication/festivals" element={<FestivalWishesPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/staff" element={<StaffPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </GymDataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

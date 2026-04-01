import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import LandingPage from "./components/pages/LandingPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import GeneratePage from "./components/pages/GeneratePage";
import HistoryPage from "./components/pages/HistoryPage";
import AnalyticsPage from "./components/pages/AnalyticsPage";
import PricingPage from "./components/pages/PricingPage";
import AuthPage from "./components/pages/AuthPage";

function ProtectedRoute({ children }) {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/sign-in/*" element={<AuthPage mode="signIn" />} />
        <Route path="/sign-up/*" element={<AuthPage mode="signUp" />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<GeneratePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

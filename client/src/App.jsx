import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import LandingPage    from "./components/pages/LandingPage";
import PricingPage    from "./components/pages/PricingPage";
import AuthPage       from "./components/pages/AuthPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import GeneratePage   from "./components/pages/GeneratePage";
import HistoryPage    from "./components/pages/HistoryPage";
import FavoritesPage  from "./components/pages/FavoritesPage";
import AnalyticsPage  from "./components/pages/AnalyticsPage";
import SettingsPage   from "./components/pages/SettingsPage";
import HelpPage       from "./components/pages/HelpPage";

function ProtectedRoute({ children }) {
  const { isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--line)", borderTopColor: "var(--clay)", animation: "dash-spin .8s linear infinite" }} />
        <style>{`@keyframes dash-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/pricing"   element={<PricingPage />} />
        <Route path="/sign-in/*" element={<AuthPage mode="signIn" />} />
        <Route path="/sign-up/*" element={<AuthPage mode="signUp" />} />

        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
        >
          <Route index               element={<GeneratePage />}  />
          <Route path="history"      element={<HistoryPage />}   />
          <Route path="favorites"    element={<FavoritesPage />} />
          <Route path="analytics"    element={<AnalyticsPage />} />
          <Route path="settings"     element={<SettingsPage />}  />
          <Route path="help"         element={<HelpPage />}      />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

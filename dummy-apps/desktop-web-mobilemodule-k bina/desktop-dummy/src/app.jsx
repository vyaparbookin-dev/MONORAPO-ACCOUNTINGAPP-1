import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { CompanyProvider } from "./contexts/CompanyContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SecurityTracker } from "./components/SecurityTracker";
import AppNavigator from "./navigation/AppNavigator"; // Import the AppNavigator component

// ... (ComingSoonPage and ErrorBoundary components remain unchanged)

const App = () => {
  useEffect(() => {
    // Desktop app start होते ही security tracker active हो जाएगा
    SecurityTracker.track("APP_STARTED", { platform: "desktop", timestamp: new Date() });
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <ErrorBoundary>
        <Router>
          <CompanyProvider>
            <AppNavigator /> {/* Render AppNavigator here */}
          </CompanyProvider>
        </Router>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
};

export default App;
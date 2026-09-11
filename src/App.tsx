import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { RobotProvider } from "./context/RobotContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";

import BuildPage from "./pages/BuildPage";
import RunPage from "./pages/RunPage";
import DashboardPage from "./pages/DashboardPage";
import MarketplacePage from "./pages/MarketplacePage";
import AcademyPage from "./pages/AcademyPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import MainMenuPage from "./pages/MainMenuPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import LandingPage from "./pages/LandingPage";
import { authService } from "./services/authService";
import AICopilotWidget from "./components/Copilot/AICopilotWidget";

function AppContent() {
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    const guestDismissed = sessionStorage.getItem("omnibrick_guest_dismissed");
    
    // Automatically redirect unregistered pilots to the dedicated Onboarding Page
    const exemptPaths = ["/onboarding", "/register", "/login", "/landing"];
    if (!isAuth && !guestDismissed && !exemptPaths.includes(location.pathname)) {
      nav("/onboarding", { replace: true });
    }
  }, [location.pathname, nav]);

  const showNavbar = location.pathname !== "/onboarding" && location.pathname !== "/landing";

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col font-sans">
      {showNavbar && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<MainMenuPage />} />
          <Route path="/menu" element={<MainMenuPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/register" element={<RegisterPage defaultMode="register" />} />
          <Route path="/login" element={<RegisterPage defaultMode="login" />} />
          <Route path="/build" element={<BuildPage />} />
          <Route path="/run" element={<RunPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/academy" element={<AcademyPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AICopilotWidget />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SubscriptionProvider>
          <RobotProvider>
            <AppContent />
          </RobotProvider>
        </SubscriptionProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

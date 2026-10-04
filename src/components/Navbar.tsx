import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Bot, Play, Wrench, LayoutDashboard, GraduationCap, 
  Users, User, Sparkles, PlusCircle, ShoppingBag, Palette, Blocks, Home
} from "lucide-react";
import { useSubscription } from "../context/SubscriptionContext";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect } from "react";
import PaywallModal from "./PaywallModal";
import MobileAuthModal from "./MobileAuthModal";
import ThemeModal from "./ThemeModal";
import LegoAssemblyGuideModal from "./LegoAssemblyGuideModal";
import { authService, type AuthUser } from "../services/authService";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isPro, addBricks } = useSubscription();
  const { themeConfig } = useTheme();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [legoGuideOpen, setLegoGuideOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  useEffect(() => {
    return authService.subscribe((u) => setAuthUser(u));
  }, []);

  const desktopLinks = [
    { to: "/", label: "Hub", icon: Home },
    { to: "/build", label: "Build", icon: Wrench },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { to: "/academy", label: "Academy", icon: GraduationCap },
    { to: "/community", label: "Community", icon: Users },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* ─── DESKTOP & TABLET TOP NAVIGATION ─── */}
      <nav className="h-14 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40">
        
        {/* Left: Brand / Home Link */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group" title="Главное меню / Home">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-black text-base tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400">
              BRAIN BRICK
            </span>
          </Link>
          <span className="hidden lg:inline text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Shipathon 2026
          </span>
        </div>

        {/* Center: Main App Links */}
        <div className="hidden md:flex items-center gap-1">
          {desktopLinks.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  active
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <l.icon className="w-3.5 h-3.5" />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: RevenueCat Pro & Bricks Balance */}
        <div className="flex items-center gap-2.5">
          {/* Pro Badge */}
          {isPro ? (
            <button
              onClick={() => setPaywallOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>PRO ACTIVE</span>
            </button>
          ) : (
            <button
              onClick={() => setPaywallOpen(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 transition-all"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Upgrade Pro</span>
            </button>
          )}

          {/* Bricks Currency Counter */}
          <button
            onClick={() => addBricks(250)}
            title="Click to add +250 test Bricks"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all group"
          >
            <span className="text-xs font-bold text-amber-300 font-mono">🧱 {profile.bricksBalance}</span>
            <PlusCircle className="w-3 h-3 text-amber-400/60 group-hover:text-amber-300 transition-colors" />
          </button>

          {/* 3D Presentation Link */}
          <a
            href="./presentation.html"
            title="Открыть интерактивную 3D-презентацию"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer shadow-sm group"
          >
            <span className="text-xs">📐</span>
            <span className="hidden md:inline text-[11px] font-bold">3D Презентация</span>
          </a>

          {/* LEGO Assembly Guide Quick-Trigger */}
          <button
            onClick={() => setLegoGuideOpen(true)}
            title="LEGO Mindstorms 51515 Hardware Assembly Guide"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-sm group"
          >
            <span className="text-xs">🧱</span>
            <span className="hidden lg:inline text-[11px] font-bold">LEGO Guide</span>
          </button>

          {/* Programmer Theme Selector Button */}
          <button
            onClick={() => setThemeModalOpen(true)}
            title={`Active Theme: ${themeConfig.name}. Click to switch theme`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm group"
          >
            <div 
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/30"
              style={{ backgroundColor: themeConfig.accentHex }}
            />
            <Palette className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="hidden xl:inline text-[11px] font-mono text-slate-400 group-hover:text-slate-200">
              {themeConfig.name.split(" ")[0]}
            </span>
          </button>

          {/* Auth Button or Profile Link */}
          {!authUser ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/register"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25 transition-all"
              >
                <Sparkles className="w-3 h-3 text-slate-950" />
                <span>Регистрация (+500 🧱)</span>
              </Link>
              <Link
                to="/login"
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all"
              >
                Войти
              </Link>
            </div>
          ) : (
            <Link
              to="/profile"
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-md cursor-pointer ${
                location.pathname === "/profile"
                  ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 ring-2 ring-cyan-400 shadow-cyan-500/30 scale-105"
                  : "bg-gradient-to-br from-cyan-600 to-blue-600 text-white hover:scale-105 shadow-cyan-500/10"
              }`}
              title={`Logged in as ${authUser.username}. Open Profile`}
            >
              {authUser.username.charAt(0).toUpperCase()}
            </Link>
          )}
        </div>
      </nav>

      {/* ─── MOBILE-FIRST BOTTOM DOCK (md:hidden) ─── */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800 z-40 flex items-center justify-around px-2 md:hidden pb-safe">
        {[
          { to: "/", label: "Hub", icon: Home },
          { to: "/build", label: "Build", icon: Wrench },
          { to: "/run", label: "Run", icon: Play, hero: true },
          { to: "/dashboard", label: "Stats", icon: LayoutDashboard },
          { to: "/marketplace", label: "Market", icon: ShoppingBag },
          { to: "/profile", label: "Profile", icon: User },
        ].map((item) => {
          const active = location.pathname === item.to;

          if (item.hero) {
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-transform ${
                  active 
                    ? "bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 scale-110 shadow-cyan-500/40 animate-pulse" 
                    : "bg-gradient-to-tr from-cyan-600 to-blue-700 text-white shadow-cyan-900/50"
                }`}>
                  <item.icon className="w-6 h-6 fill-current" />
                </div>
                <span className="text-[10px] font-bold uppercase mt-1 text-cyan-400">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center p-1 transition-colors ${
                active ? "text-cyan-400" : "text-slate-400 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
      <MobileAuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ThemeModal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      <LegoAssemblyGuideModal 
        isOpen={legoGuideOpen} 
        onClose={() => setLegoGuideOpen(false)} 
        onConnectLego={() => {
          setLegoGuideOpen(false);
          navigate("/run");
        }} 
      />
    </>
  );
}

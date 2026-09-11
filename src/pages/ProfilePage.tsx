import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  User, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Award, 
  CheckCircle2, 
  Layers, 
  Bot, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  TrendingUp, 
  Palette, 
  Check, 
  Trophy, 
  Cpu, 
  Radio, 
  Play, 
  History, 
  Wifi, 
  Terminal, 
  Wrench, 
  GitFork, 
  Star, 
  Calendar, 
  UserPlus, 
  UserCheck, 
  Shield, 
  Activity,
  MapPin
} from "lucide-react";
import { useSubscription } from "../context/SubscriptionContext";
import { useRobot } from "../context/RobotContext";
import { useTheme } from "../context/ThemeContext";
import { buildStorage } from "../services/buildStorage";
import { pilotDirectory, type CommunityPilot } from "../services/communityPilots";
import PaywallModal from "../components/PaywallModal";
import MobileAuthModal from "../components/MobileAuthModal";
import { authService, type AuthUser } from "../services/authService";
import type { RobotBuild } from "../types";
import PageOverviewBanner from "../components/PageOverviewBanner";

export default function ProfilePage() {
  const nav = useNavigate();
  const { username: paramUsername } = useParams<{ username?: string }>();
  const { pilot, isPro, tier, upgradeToPro, setTierOverride, addBricks } = useSubscription();
  const { selectBuild } = useRobot();
  const { theme, setTheme, availableThemes } = useTheme();

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<"overview" | "fleet" | "membership" | "achievements" | "appearance">("overview");

  useEffect(() => {
    return authService.subscribe((u) => setAuthUser(u));
  }, []);

  const myBuilds = buildStorage.getRobotBuilds();
  const allBuilds = buildStorage.getAllBuilds();

  // Determine if viewing own profile or another community member
  const isOwnProfile = !paramUsername || paramUsername.toLowerCase() === pilot.username.toLowerCase();
  const currentUsername = isOwnProfile ? pilot.username : paramUsername;

  // Retrieve community pilot data
  const [currentPilot, setCurrentPilot] = useState<CommunityPilot>(() =>
    pilotDirectory.getPilot(currentUsername)
  );

  useEffect(() => {
    setCurrentPilot(pilotDirectory.getPilot(currentUsername));
  }, [currentUsername, pilot.username]);

  const handleToggleFollow = () => {
    const nextState = pilotDirectory.toggleFollow(currentPilot.username);
    setCurrentPilot((prev) => ({
      ...prev,
      isFollowing: nextState,
      followersCount: nextState ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1),
    }));
  };

  // Pilot Level and XP
  const { pilotLevel, currentXp, nextLevelXp, xpPercent } = useMemo(() => {
    const lvl = currentPilot.level || 7;
    const reqXp = 500;
    const curXp = 340;
    const pct = Math.round((curXp / reqXp) * 100);
    return { pilotLevel: lvl, currentXp: curXp, nextLevelXp: reqXp, xpPercent: pct };
  }, [currentPilot.level]);

  // Builds published by this pilot
  const pilotBuilds = useMemo(() => {
    if (isOwnProfile) return myBuilds;
    return allBuilds.filter(b => 
      b.author.toLowerCase() === currentPilot.username.toLowerCase() ||
      currentPilot.publishedBuildIds.includes(b.id)
    );
  }, [isOwnProfile, myBuilds, allBuilds, currentPilot]);

  // Achievements
  const achievements = [
    {
      id: "shipathon-pioneer",
      title: "Shipathon 2026 Pioneer",
      category: "Core",
      description: "Registered next-generation autonomous robotics pilot.",
      icon: "🚀",
      unlocked: true,
      progress: "100%",
    },
    {
      id: "lego-master",
      title: "Mindstorms Specialist",
      category: "Hardware",
      description: "Directly paired LEGO Robot Inventor 51515 / SPIKE Prime via Web Bluetooth LWP3.",
      icon: "🤖",
      unlocked: true,
      progress: "Connected",
    },
    {
      id: "cognitive-vision",
      title: "Neural Visionary",
      category: "AI",
      description: "Configured multimodal vision pipeline with closed-loop optical object detection.",
      icon: "👁️",
      unlocked: true,
      progress: "Active",
    },
    {
      id: "brick-tycoon",
      title: "Bricks Millionaire",
      category: "Economy",
      description: "Accumulated over 1,000 Bricks 🧱 in wallet balance.",
      icon: "🧱",
      unlocked: isOwnProfile ? pilot.bricksBalance >= 1000 : true,
      progress: isOwnProfile ? `${pilot.bricksBalance}/1,000` : "Achieved",
    },
    {
      id: "tool-caller",
      title: "MCP Tool Architect",
      category: "AI",
      description: "Integrated custom Model Context Protocol tool contracts for differential drive.",
      icon: "🛠️",
      unlocked: true,
      progress: "Verified",
    },
    {
      id: "master-pilot",
      title: "Autonomous Ace",
      category: "Core",
      description: "Successfully completed live autonomous missions with zero collisions.",
      icon: "🏆",
      unlocked: true,
      progress: "Completed",
    },
  ];

  const handleLaunchBuild = (b: RobotBuild) => {
    selectBuild(b);
    nav("/run");
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem("brainbrick_onboarding_v2");
    sessionStorage.removeItem("brainbrick_guest_dismissed");
    nav("/onboarding");
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-28 md:pb-12 text-slate-100">
      <PageOverviewBanner
        title={isOwnProfile ? "Паспорт пилота" : `Профиль @${currentPilot.username}`}
        badge={`LVL ${pilotLevel} • ${tier.toUpperCase()}`}
        description="Управление подпиской RevenueCat, кастомизация 7 кибер-тем, статистика налёта и коллекция разблокированных ачивок."
        actionButton={isPro ? undefined : {
          label: "💎 Оформить PRO",
          onClick: () => setPaywallOpen(true),
        }}
      />
      
      {/* ─── PILOT IDENTITY & ROBLOX LIVE PRESENCE BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-blue-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar & Rank Badge */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-1 shadow-xl shadow-cyan-500/20">
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-4xl font-black text-white">
                {currentPilot.avatar}
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-mono font-black shadow-md border-2 border-slate-950">
              LVL {pilotLevel}
            </span>
          </div>

          {/* User Details & Callouts */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentPilot.username}
              </h1>

              {/* Roblox-style Live Activity Badge */}
              {currentPilot.liveStatus.isOnline ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{currentPilot.liveStatus.activity}</span>
                </div>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Offline
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-bold">@{currentPilot.callsign}</span>
              <span>•</span>
              <span className="text-amber-300 font-semibold">{currentPilot.rank}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3 h-3 text-slate-500" />
                {currentPilot.location}
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {currentPilot.bio}
            </p>

            {/* Level XP Progress Bar */}
            <div className="pt-1 max-w-md mx-auto md:mx-0">
              <div className="flex justify-between text-[11px] font-mono mb-1 text-slate-400">
                <span className="text-cyan-400 font-bold">XP Progress</span>
                <span>{currentXp} / {nextLevelXp} XP to Level {pilotLevel + 1}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Social Follow or Edit ID Action */}
          <div className="flex items-center gap-2 shrink-0">
            {isOwnProfile ? (
              authUser ? (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:border-cyan-500/50 active:scale-95"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Аккаунт: {authUser.username}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/register"
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/25 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-slate-950" />
                    <span>Регистрация (+500 🧱)</span>
                  </Link>
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all"
                  >
                    Войти
                  </Link>
                </div>
              )
            ) : (
              <button
                onClick={handleToggleFollow}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                  currentPilot.isFollowing
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-cyan-500/25"
                }`}
              >
                {currentPilot.isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow Pilot</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Social & Community Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-500 text-[10px] uppercase">Followers</div>
            <div className="text-base font-black text-cyan-300 mt-0.5">
              {currentPilot.followersCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-500 text-[10px] uppercase">Following</div>
            <div className="text-base font-black text-white mt-0.5">
              {currentPilot.followingCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-500 text-[10px] uppercase">Robot Models</div>
            <div className="text-base font-black text-amber-300 mt-0.5">
              {currentPilot.huggingFaceStats.robotModels}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-500 text-[10px] uppercase">Total Forks</div>
            <div className="text-base font-black text-purple-300 mt-0.5">
              {currentPilot.huggingFaceStats.totalForks}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
            <div className="text-slate-500 text-[10px] uppercase">Bricks Balance</div>
            <div className="text-base font-black text-emerald-400 mt-0.5">
              {isOwnProfile ? `${pilot.bricksBalance.toLocaleString()} 🧱` : "1,450 🧱"}
            </div>
          </div>
        </div>
      </div>

      {/* ─── NAVIGATION PILL TABS ─── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto text-xs font-semibold">
        {[
          { id: "overview", label: "Overview & Heatmap", icon: Activity },
          { id: "fleet", label: `Models & Blueprints (${pilotBuilds.length})`, icon: Bot },
          { id: "membership", label: "Membership & RevenueCat", icon: CreditCard },
          { id: "achievements", label: "Achievements", icon: Trophy },
          { id: "appearance", label: "Visual Themes", icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         TAB 1: OVERVIEW, GITHUB CONTRIBUTION HEATMAP & ROBLOX GEAR
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">

          {/* 1. GITHUB-STYLE CONTRIBUTION ACTIVITY HEATMAP */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Autonomous Activity & Commits Heatmap (GitHub Style)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {currentPilot.contributions.reduce((acc, c) => acc + c.count, 0)} actions in last 14 weeks
              </span>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="flex gap-1.5 min-w-max py-2">
                {/* 14 weeks of 7 days */}
                {Array.from({ length: 14 }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1.5">
                    {currentPilot.contributions.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => {
                      const levelColors = [
                        "bg-slate-950 border-slate-800/80 hover:border-slate-700",
                        "bg-emerald-950/70 border-emerald-800/50 hover:border-emerald-600",
                        "bg-emerald-700/80 border-emerald-600/70 hover:border-emerald-500",
                        "bg-emerald-500 border-emerald-400 hover:border-emerald-300",
                        "bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/40 hover:scale-110",
                      ];
                      return (
                        <div
                          key={day.date}
                          title={`${day.date}: ${day.count} missions / build revisions`}
                          className={`w-3.5 h-3.5 rounded-sm border transition-all cursor-pointer ${levelColors[day.level]}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
              <span>Autonomous runs & prompt compiles contribute to activity</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-950 border border-slate-800" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-950 border border-emerald-800" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-700 border border-emerald-600" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-300" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* 2. ROBLOX-STYLE GEAR & HARDWARE LOADOUT */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Hardware Gear & Loadout (Roblox Inventory Style)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {currentPilot.gearInventory.length} Items Equipped
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentPilot.gearInventory.map((gear) => {
                const rarityClasses = {
                  legendary: "border-amber-500/40 bg-amber-950/20 text-amber-300 shadow-amber-500/5",
                  epic: "border-purple-500/40 bg-purple-950/20 text-purple-300 shadow-purple-500/5",
                  rare: "border-blue-500/40 bg-blue-950/20 text-blue-300 shadow-blue-500/5",
                  common: "border-slate-800 bg-slate-950/60 text-slate-400",
                };
                return (
                  <div
                    key={gear.id}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center text-center space-y-1.5 transition-transform hover:scale-105 ${rarityClasses[gear.rarity]}`}
                  >
                    <span className="text-3xl filter drop-shadow-md">{gear.icon}</span>
                    <span className="text-xs font-bold text-white line-clamp-1">{gear.name}</span>
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-900/80 border border-current font-bold">
                      {gear.rarity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. HUGGINGFACE-STYLE MODELS & MCP TOOLS OVERVIEW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>Robot Models</span>
              </div>
              <div className="text-xl font-black text-white">
                {currentPilot.huggingFaceStats.robotModels}
              </div>
              <span className="text-[10px] text-slate-500">Autonomous blueprints</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prompt Behaviors</span>
              </div>
              <div className="text-xl font-black text-emerald-300">
                {currentPilot.huggingFaceStats.promptBehaviors}
              </div>
              <span className="text-[10px] text-slate-500">Cognitive instructions</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>MCP Tools</span>
              </div>
              <div className="text-xl font-black text-amber-300">
                {currentPilot.huggingFaceStats.mcpTools}
              </div>
              <span className="text-[10px] text-slate-500">Tool execution contracts</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase">
                <GitFork className="w-3.5 h-3.5 text-purple-400" />
                <span>Community Forks</span>
              </div>
              <div className="text-xl font-black text-purple-300">
                {currentPilot.huggingFaceStats.totalForks}
              </div>
              <span className="text-[10px] text-slate-500">Downloaded by pilots</span>
            </div>
          </div>

          {/* Reset Sandbox walkthrough (Own profile only) */}
          {isOwnProfile && (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-300">Shipathon Review Sandbox</span>
                <p className="text-slate-500 text-[11px]">Пройти 4-шаговый интерактивный курс онбординга</p>
              </div>
              <Link
                to="/onboarding"
                className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Онбординг (/onboarding)</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         TAB 2: ROBOT FLEET & MODELS
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "fleet" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Robot Blueprints & Models ({pilotBuilds.length})
            </h3>
            {isOwnProfile && (
              <Link 
                to="/build" 
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>+ Create New in Studio</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pilotBuilds.map((build) => {
              const isRobot = build.type === "robot";
              return (
                <div 
                  key={build.id} 
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{build.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {isRobot ? `Chassis: ${(build as RobotBuild).hardware.chassis.toUpperCase()}` : "Behavior Model"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        v{build.version}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {build.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwnProfile && isRobot ? (
                        <>
                          <Link
                            to={`/build?edit=${build.id}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                          >
                            Configure
                          </Link>
                          <button
                            onClick={() => handleLaunchBuild(build as RobotBuild)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Run</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            buildStorage.forkBuild(build.id, pilot.callsign);
                            alert(`🎉 Cloned '${build.name}' into your studio library!`);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <GitFork className="w-3 h-3" />
                          <span>Fork Model</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         TAB 3: MEMBERSHIP & REVENUECAT ENTITLEMENTS
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "membership" && (
        <div className="space-y-6">
          {/* Holographic VIP Membership Card */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span className="font-mono text-xs uppercase tracking-widest text-cyan-300 font-bold">
                    Brain Brick • Shipathon Pass
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {tier === "lifetime"
                    ? "👑 Founder Lifetime Pass"
                    : isPro
                    ? "Neural Nexus VIP Tier"
                    : "Standard Explorer Pass"}
                </h3>
              </div>
              <div className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold uppercase">
                {tier.toUpperCase()}
              </div>
            </div>

            <div className="font-mono text-sm sm:text-base tracking-widest text-slate-300">
              BB-2026-NEXUS-8842-PILOT
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-indigo-500/20">
              <div className="space-y-0.5 font-mono text-xs text-slate-400">
                <div>PILOT: <span className="text-white font-bold">{currentPilot.username.toUpperCase()}</span></div>
                <div>CALLSIGN: <span className="text-cyan-400">{currentPilot.callsign}</span></div>
                <div>ENTITLEMENT: <span className="text-emerald-400">{isPro ? "pro_features: ACTIVE" : "standard: LIMITED"}</span></div>
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => setPaywallOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  {isPro ? "Открыть Store & Управление" : "Перейти в Store ($9.99/mo)"}
                </button>
              )}
            </div>
          </div>

          {/* RevenueCat Developer Sandbox Controls */}
          {isOwnProfile && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    RevenueCat Shipathon Sandbox Simulator
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Purchases Capacitor SDK</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Test in-app purchase entitlements instantly in the browser without sandbox credit card friction.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setTierOverride("free")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    tier === "free" ? "bg-slate-800 text-white border border-slate-600" : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  Set Free Tier
                </button>
                <button
                  onClick={() => setTierOverride("pro")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    tier === "pro" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  Set Pro Active
                </button>
                <button
                  onClick={() => setTierOverride("lifetime")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    tier === "lifetime" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  👑 Set Lifetime Founder
                </button>
                <button
                  onClick={() => addBricks(500)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  +500 🧱 Add Test Bricks
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         TAB 4: ACHIEVEMENTS & TROPHIES
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "achievements" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Pilot Honors & Milestones</h3>
              <p className="text-xs text-slate-400">Unlock achievements by building robots, passing quizzes, and deploying to hardware</p>
            </div>
            <div className="text-right">
              <div className="text-base font-black text-amber-300 font-mono">
                {achievements.filter(a => a.unlocked).length} / {achievements.length}
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase">Unlocked</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {achievements.map((ach) => (
              <div 
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  ach.unlocked
                    ? "bg-slate-900/90 border-slate-800 shadow-sm hover:border-slate-700"
                    : "bg-slate-950/40 border-slate-900 opacity-60"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                  ach.unlocked
                    ? "bg-slate-800 border-slate-700 shadow-inner"
                    : "bg-slate-950 border-slate-900 grayscale"
                }`}>
                  {ach.icon}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {ach.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    {ach.description}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono">
                    <span className={ach.unlocked ? "text-emerald-400 font-bold" : "text-slate-500"}>
                      {ach.unlocked ? "✓ UNLOCKED" : "LOCKED"}
                    </span>
                    <span className="text-slate-500">{ach.progress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         TAB 5: VISUAL THEMES
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "appearance" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Cockpit Visual Theme</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch instantly between Minimalist OLED Black, Clean White, and popular programmer palettes.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {availableThemes.length} Schemes Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableThemes.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? "bg-slate-800 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-[1.01]"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl border flex items-center justify-center shadow-inner relative overflow-hidden shrink-0"
                      style={{ 
                        backgroundColor: opt.bgHex, 
                        borderColor: isSelected ? opt.accentHex : "rgba(255,255,255,0.15)" 
                      }}
                    >
                      <div 
                        className="w-5 h-5 rounded-full shadow-md"
                        style={{ backgroundColor: opt.accentHex }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {opt.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {opt.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="pl-3 shrink-0">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-slate-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
      <MobileAuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

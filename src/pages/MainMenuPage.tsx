import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bot, Play, Wrench, LayoutDashboard, ShoppingBag, 
  GraduationCap, Users, User, Sparkles, Battery, 
  Compass, Radio, ArrowRight, ArrowUpRight, ShieldCheck, 
  Layers, ChevronRight, Zap, Palette, BookOpen, Globe
} from "lucide-react";
import { useRobot } from "../context/RobotContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useTheme } from "../context/ThemeContext";
import { buildStorage } from "../services/buildStorage";
import { aiVisionService } from "../services/aiVisionService";
import { authService, type AuthUser } from "../services/authService";
import PaywallModal from "../components/PaywallModal";
import LegoAssemblyGuideModal from "../components/LegoAssemblyGuideModal";

export default function MainMenuPage() {
  const navigate = useNavigate();
  const { activeBuild, sessionActive, telemetry, adapterMode, transcript } = useRobot();
  const { profile, isPro, pilot } = useSubscription();
  const { themeConfig } = useTheme();

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [legoGuideOpen, setLegoGuideOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  useEffect(() => {
    return authService.subscribe((u) => setAuthUser(u));
  }, []);

  const robotBuilds = buildStorage.getRobotBuilds();
  const aiConfig = aiVisionService.getConfig();

  const platformSections = [
    {
      id: "run",
      to: "/run",
      title: "Кокпит управления (Run Cockpit)",
      badge: sessionActive ? "🟢 Активен" : "Готов к запуску",
      badgeColor: sessionActive ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      icon: Play,
      gradient: "from-cyan-500 to-blue-600",
      description: "Живые эмоциональные глаза робота, диалог голосом через микрофон, распознавание через веб-камеру, Web Audio звуки и 2D-арена.",
      stats: `Режим: ${adapterMode === "lego_spike" ? "LEGO 51515" : "2D Арена"} • ${transcript.length} событий`,
      buttonLabel: "Войти в кокпит",
      highlight: true,
    },
    {
      id: "build",
      to: "/build",
      title: "Студия сборок (Build Studio)",
      badge: `${robotBuilds.length} робота`,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: Wrench,
      gradient: "from-amber-500 to-orange-600",
      description: "Генерация роботов из текстовых намерений, настройка семантических пинов моторов, 4-шаговый гайд по сборке LEGO и экспорт в JSON.",
      stats: "Флагманы: Red Cube Hunter, Arc Racer, Titan Claw",
      buttonLabel: "Открыть студию",
    },
    {
      id: "dashboard",
      to: "/dashboard",
      title: "Центр телеметрии (Dashboard)",
      badge: "Цикл 20Гц",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      icon: LayoutDashboard,
      gradient: "from-blue-500 to-indigo-600",
      description: "Мониторинг сенсоров, курса по гироскопу, скорости моторов A/B, системных логов и экспорт официального аудиторского отчета миссии.",
      stats: `Батарея ${telemetry.batteryLevel}% • Задержка <15ms`,
      buttonLabel: "Смотреть телеметрию",
    },
    {
      id: "marketplace",
      to: "/marketplace",
      title: "Маркетплейс сборок (Marketplace)",
      badge: "70% Роялти",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      icon: ShoppingBag,
      gradient: "from-purple-500 to-pink-600",
      description: "Каталог готовых роботов и MCP-инструментов сообщества. Клонирование (Fork) в 1 клик и авторские отчисления в валюте Bricks.",
      stats: "Проверенные спецификации • 1-Click Fork",
      buttonLabel: "В маркетплейс",
    },
    {
      id: "academy",
      to: "/academy",
      title: "Академия робототехники (Academy)",
      badge: "6 уроков + Квизы",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      icon: GraduationCap,
      gradient: "from-emerald-500 to-teal-600",
      description: "Интерактивный курс: архитектура NPU смартфона, семантические пины, протокол MCP, BLE LWP3 протокол LEGO и встроенные покупки RevenueCat.",
      stats: "Награды: +250 Bricks за каждый квиз",
      buttonLabel: "Начать обучение",
    },
    {
      id: "community",
      to: "/community",
      title: "Сообщество пилотов (Community)",
      badge: "Roblox Presence",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      icon: Users,
      gradient: "from-rose-500 to-red-600",
      description: "Лента проектов с прикрепленными сборками, обсуждения, каталог робототехников с живым онлайн-статусом и инвентарем оборудования.",
      stats: "Синхронизация постов • Pilot Directory",
      buttonLabel: "К сообществу",
    },
    {
      id: "profile",
      to: "/profile",
      title: "Паспорт робототехника (Profile)",
      badge: `Ранг: ${pilot.rank || "Пилот"}`,
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      icon: User,
      gradient: "from-cyan-500 to-emerald-600",
      description: "14-недельный GitHub Heatmap активности коммитов и миссий, VIP-карта Neural Nexus, Roblox-экипировка и сетка из 7 тем для программистов.",
      stats: `Тема: ${themeConfig.name} • ${profile.bricksBalance} Bricks`,
      buttonLabel: "Мой профиль",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#030712] text-white p-3 sm:p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── GUEST PILOT WELCOME & REGISTRATION CALLOUT ─── */}
        {!authUser && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shrink-0 shadow-lg shadow-cyan-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-white">
                    Приветствуем в Brain Brick, новый пилот!
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    +500 🧱 Бонус
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  Ты в гостевом режиме. Пройди вводный инструктаж или получи свой <strong>Паспорт Пилота</strong>, чтобы сохранять свои сборки и получить стартовые 500 Bricks!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Link
                to="/onboarding"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Онбординг</span>
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Регистрация (+500 🧱)</span>
              </Link>
            </div>
          </div>
        )}

        {/* ─── HERO SYSTEM OVERVIEW BANNER ─── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-5 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 space-y-6">
            
            {/* Top Greeting & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    🚀 RevenueCat Shipathon 2026
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Next Gen Award
                  </span>
                  <Link
                    to="/landing"
                    className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer"
                    title="Открыть промо-лендинг Brain Brick"
                  >
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>Промо-лендинг</span>
                  </Link>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mt-2">
                  Центр управления <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400">Brain Brick</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
                  Платформа автономного воплощенного интеллекта: смартфон выступает когнитивным NPU-мозгом, а LEGO Mindstorms 51515 — физическим шасси на колесах.
                </p>
              </div>

              {/* Fast Pro & Bricks Widget */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setPaywallOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 text-xs font-bold text-indigo-300 transition-all cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>{isPro ? "PRO АКТИВЕН" : "Upgrade Pro"}</span>
                </button>

                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 font-mono">
                  <span>🧱</span>
                  <span>{profile.bricksBalance}</span>
                </div>
              </div>
            </div>

            {/* Live Robot & System Status Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Активный робот</span>
                <span className="text-sm font-bold text-white truncate block">{activeBuild?.name || "Cyber Rover"}</span>
                <span className="text-[10px] text-cyan-400 font-mono block">Шасси: {activeBuild?.hardware.chassis.toUpperCase()}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Статус связи</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${sessionActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  <span className="text-sm font-bold text-white">{sessionActive ? "В сети (20Hz)" : "Ожидание"}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">{adapterMode === "lego_spike" ? "LEGO 51515 Hub" : "2D Симулятор"}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Бортовой ИИ</span>
                <span className="text-sm font-bold text-cyan-300 block">{aiConfig.provider === "gemini" ? "Gemini ER-2" : "Gemma 4"}</span>
                <span className="text-[10px] text-emerald-400 font-mono block">Мультимодальный Vision</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Батарея и звук</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-400 font-mono">{telemetry.batteryLevel}%</span>
                  <span className="text-xs text-slate-400">🔋</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">Web Audio Procedural</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/run"
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Запустить робота в кокпите</span>
              </Link>

              <Link
                to="/build"
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm transition-all"
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Студия конфигураций</span>
              </Link>

              <button
                onClick={() => setLegoGuideOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-sm transition-all cursor-pointer"
              >
                <span>🧱</span>
                <span>Гайд по сборке LEGO 51515</span>
              </button>

              <Link
                to="/onboarding"
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all cursor-pointer"
                title="Запустить пошаговый вводный инструктаж платформы"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Инструктаж (Онбординг)</span>
              </Link>
            </div>

          </div>
        </div>

        {/* ─── SECTION TITLE ─── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Разделы платформы и быстрый переход
            </h2>
            <p className="text-xs text-slate-400">
              Выбирай нужный модуль для управления, конструирования, телеметрии или обучения
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            7 модулей готовы к работе
          </span>
        </div>

        {/* ─── 7 ECOSYSTEM HUB CARDS ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platformSections.map((sec) => (
            <div
              key={sec.id}
              className={`rounded-3xl p-5 border transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden ${
                sec.highlight
                  ? "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-cyan-500/40 ring-1 ring-cyan-500/20 hover:border-cyan-400"
                  : "bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-3">
                {/* Header: Icon, Title & Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${sec.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                    <sec.icon className="w-5 h-5 text-slate-950" />
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${sec.badgeColor} font-bold`}>
                    {sec.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-3">
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {sec.stats}
                </div>

                <Link
                  to={sec.to}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    sec.highlight
                      ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 font-black"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white"
                  }`}
                >
                  <span>{sec.buttonLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}

          {/* 8th Card: RevenueCat Pro & Monetization */}
          <div className="rounded-3xl p-5 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-purple-950/40 flex flex-col justify-between group shadow-xl">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-bold">
                  {isPro ? "PRO ACTIVE" : "Shipathon SDK"}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  RevenueCat Экономика & Подписка
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Подписка Pro открывает неограниченные запросы к Gemini 3.8 Flash и Gemma 4, а создатели роботов получают 70% роялти в Bricks.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-3">
              <div className="text-[11px] font-mono text-indigo-300 truncate">
                Кнопка симуляции для судей доступна
              </div>

              <button
                onClick={() => setPaywallOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <span>Пейволл и симуляция Pro</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Paywall & LEGO Modals */}
      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
      <LegoAssemblyGuideModal 
        isOpen={legoGuideOpen} 
        onClose={() => setLegoGuideOpen(false)} 
        onConnectLego={() => {
          setLegoGuideOpen(false);
          navigate("/run");
        }} 
      />
    </div>
  );
}

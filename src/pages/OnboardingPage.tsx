import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Bot, Sparkles, ArrowRight, ArrowLeft, Check, Compass, 
  Wrench, Radio, Lock, User, Eye, EyeOff, Award, Play, 
  Layers, ShieldCheck, Home, CheckCircle2, ChevronRight, Zap
} from "lucide-react";
import { authService, type AuthUser } from "../services/authService";
import { useSubscription } from "../context/SubscriptionContext";
import { useRobot } from "../context/RobotContext";
import { soundService } from "../services/soundService";
import { buildStorage } from "../services/buildStorage";

const AVATAR_OPTIONS = [
  { emoji: "🤖", label: "Robot Core" },
  { emoji: "🧠", label: "Neural Brain" },
  { emoji: "⚡", label: "Volt Racer" },
  { emoji: "🦾", label: "Cyborg Arm" },
  { emoji: "🚀", label: "Deep Space" },
  { emoji: "🏎️", label: "Arc Speeder" },
  { emoji: "👾", label: "Glitch Pilot" },
  { emoji: "🛡️", label: "Sentinel" },
];

const ROBOT_OPTIONS = [
  {
    id: "build-red-cube-hunter",
    tag: "rover",
    badge: "Флагман",
    title: "Red Cube Hunter",
    desc: "Поиск и захват объектов через компьютерное зрение Gemini VLM и ультразвуковой сонар.",
    icon: Bot,
    gradient: "from-cyan-500 to-blue-600",
    specs: "2 мотора • Камера 320x240 • 20Hz Loop",
  },
  {
    id: "build-kinematics-racer",
    tag: "racer",
    badge: "Скорость",
    title: "Kinematics Arc Racer",
    desc: "Дифференциальный привод для скоростных заездов, расчет дуг поворота и дрифт.",
    icon: Compass,
    gradient: "from-amber-500 to-orange-600",
    specs: "2 мотора • Гироскоп • Арена 800x500",
  },
  {
    id: "build-titan-claw",
    tag: "arm",
    badge: "Манипуляция",
    title: "Titan Claw 3-DoF",
    desc: "3-осевая роботизированная клешня для захвата и перемещения грузов по координатам.",
    icon: Wrench,
    gradient: "from-purple-500 to-indigo-600",
    specs: "3 сервопривода • Inverse Kinematics",
  },
  {
    id: "build-companion-pet",
    tag: "pet",
    badge: "ИИ Друг",
    title: "Companion Pet",
    desc: "Эмоциональный робот-компаньон с живыми анимированными глазами и распознаванием голоса.",
    icon: Sparkles,
    gradient: "from-pink-500 to-rose-600",
    specs: "Robot Eyes UI • Web Audio SFX • Микрофон",
  },
];

const HARDWARE_OPTIONS = [
  {
    id: "mock_simulator",
    title: "Виртуальная 2D-Арена (Рекомендуется)",
    badge: "Мгновенный старт",
    desc: "Тестируй робота прямо в браузере с 2D-физикой, виртуальным сонаром и симуляцией камеры без реального железа.",
    icon: "🌐",
  },
  {
    id: "lego_spike",
    title: "LEGO Mindstorms 51515 / SPIKE Prime",
    badge: "Web Bluetooth BLE",
    desc: "Беспроводное подключение смартфона к хабу LEGO по протоколу LWP3. Управление моторами A/B и датчиками.",
    icon: "🧱",
  },
  {
    id: "diy_esp32",
    title: "DIY Микроконтроллер (ESP32 / Arduino)",
    badge: "Кастомное шасси",
    desc: "Подключение по Wi-Fi WebSocket или USB Serial. Открытый API манифеста для любых микросхем.",
    icon: "⚡",
  },
];

export default function OnboardingPage() {
  const nav = useNavigate();
  const { updateProfile, addBricks } = useSubscription();
  const { setAdapterMode, selectBuild } = useRobot();

  const [step, setStep] = useState(1);
  const [selectedRobotId, setSelectedRobotId] = useState("build-red-cube-hunter");
  const [selectedHardware, setSelectedHardware] = useState("mock_simulator");
  const [selectedAvatar, setSelectedAvatar] = useState("🤖");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<AuthUser | null>(null);

  const selectedRobot = ROBOT_OPTIONS.find((r) => r.id === selectedRobotId) || ROBOT_OPTIONS[0];

  const handleNextStep = (next: number) => {
    soundService.playRobotChirp();
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRegisterAndFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = authService.register(username, password);
      setLoading(false);

      if (!res.success) {
        setError(res.error || "Ошибка регистрации");
        return;
      }

      if (res.user) {
        // Award welcome bounty +500 bricks
        addBricks(500);

        // Update profile identity
        updateProfile({
          username: res.user.username,
          callsign: `${res.user.username}-Lead`,
          rank: "Пилот I ранга",
        });

        // Set adapter mode
        setAdapterMode(selectedHardware === "lego_spike" ? "lego_spike" : "mock_simulator");

        // Select chosen robot build
        const robot = buildStorage.getRobotById(selectedRobotId);
        if (robot) {
          selectBuild(robot);
        }

        // Save preferences
        localStorage.setItem("brainbrick_onboarding_v2", "true");
        localStorage.setItem("brainbrick_user_avatar", selectedAvatar);

        soundService.playHappyFanfare();
        setCreatedUser(res.user);
        setStep(5); // Final celebration screen
      }
    }, 300);
  };

  const handleGuestFinish = () => {
    localStorage.setItem("brainbrick_onboarding_v2", "true");
    sessionStorage.setItem("brainbrick_guest_dismissed", "true");
    setAdapterMode(selectedHardware === "lego_spike" ? "lego_spike" : "mock_simulator");
    const robot = buildStorage.getRobotById(selectedRobotId);
    if (robot) {
      selectBuild(robot);
    }
    soundService.playRobotChirp();
    nav("/run");
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Cyber Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full mx-auto space-y-6 relative z-10 my-auto">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Brain Brick Onboarding
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  Шаг {step} из 4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Интерактивный курс подготовки пилота робототехники
              </p>
            </div>
          </div>

          <button
            onClick={handleGuestFinish}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            Пропустить в кокпит →
          </button>
        </div>

        {/* Top Progress Bar */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s <= step
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm shadow-cyan-500/30"
                  : "bg-slate-800/80"
              }`}
            />
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
           STEP 1: КОНЦЕПЦИЯ И ХУК ПЛАТФОРМЫ
           ═══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>RevenueCat Shipathon 2026 • Next Gen Award</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Твой смартфон — это <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400">мозг робота</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Традиционные автономные роботы требуют тяжелых и дорогих компьютеров за $500+ (NVIDIA Jetson / Raspberry Pi 5). 
                <strong> Brain Brick</strong> решает эту проблему элегантно: твой телефон уже оснащён HD-камерой, стерео-микрофоном, динамиками и NPU-чипом искусственного интеллекта.
              </p>
            </div>

            {/* Cognitive Architecture Visual Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>1. Когнитивный мозг (Смартфон)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Perception
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Мультимодальное зрение <strong>Gemini Robotics ER-2</strong>, голосовое общение на русском и английском языках, синтез речи и звуки Web Audio API.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-950 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 font-mono flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-blue-400" />
                    <span>2. Спинной рефлекс (Моторы)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Action Loop
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Быстрый контур управления с частотой <strong>20 Гц</strong>: приводы колес LEGO Mindstorms 51515, ультразвуковые датчики или мгновенная виртуальная 2D-арена.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleNextStep(2)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <span>Отлично! Выбрать архитектуру робота</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
           STEP 2: ВЫБОР ПЕРВОЙ СБОРКИ РОБОТА
           ═══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Выбери своего первого робота
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Каждый чертёж содержит готовую кинематическую схему, системный промпт для ИИ и набор инструментов:
              </p>
            </div>

            {/* Grid of 4 Robot Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {ROBOT_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRobotId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRobotId(item.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-slate-950/90 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl bg-gradient-to-tr ${item.gradient} text-slate-950 shadow-md`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-white">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {item.desc}
                    </p>

                    <div className="text-[10px] font-mono text-cyan-400/80 pt-1 border-t border-slate-800/80">
                      {item.specs}
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleNextStep(1)}
                className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Назад</span>
              </button>
              <button
                onClick={() => handleNextStep(3)}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <span>Далее: Аппаратная среда ({selectedRobot.title})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
           STEP 3: АППАРАТНАЯ СРЕДА (СИМУЛЯТОР / LEGO / DIY)
           ═══════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Выбери среду исполнения
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Brain Brick поддерживает как физических роботов, так и работу без железа:
              </p>
            </div>

            <div className="space-y-3">
              {HARDWARE_OPTIONS.map((hw) => {
                const isSelected = selectedHardware === hw.id;
                return (
                  <button
                    key={hw.id}
                    onClick={() => setSelectedHardware(hw.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-950/90 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{hw.icon}</span>
                        <div>
                          <span className="text-sm font-black text-white">{hw.title}</span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">{hw.desc}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0 font-bold">
                        {hw.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleNextStep(2)}
                className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Назад</span>
              </button>
              <button
                onClick={() => handleNextStep(4)}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <span>Далее: Создать Паспорт Пилота (+500 🧱)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
           STEP 4: РЕГИСТРАЦИЯ ПАСПОРТА ПИЛОТА & БОНУС
           ═══════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Выдача Паспорта Пилота
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  🎁 +500 🧱 Bricks Бонус
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Задай позывной и пароль, чтобы сохранять свои сборки и получить стартовый капитал:
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterAndFinish} className="space-y-4">
              {/* Avatar Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Выбери голографический аватар</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Roblox Identity</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedAvatar(opt.emoji)}
                      className={`p-2 rounded-xl border text-xl flex items-center justify-center transition-all cursor-pointer ${
                        selectedAvatar === opt.emoji
                          ? "bg-cyan-500/20 border-cyan-400 scale-110 shadow-md shadow-cyan-500/25"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                      title={opt.label}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Позывной пилота (Логин)</span>
                  <span className="text-[10px] text-slate-500 font-mono">От 2 символов</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Например: CyberPilot или Beknur"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Пароль доступа</span>
                  <span className="text-[10px] text-slate-500 font-mono">От 4 символов</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Starter Bounty Summary Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-cyan-500/10 border border-amber-500/30 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-mono font-bold text-amber-300">
                  <span>🎁 В твой стартовый набор входит:</span>
                  <span>+500 🧱</span>
                </div>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <div>✓ Чертёж <strong>{selectedRobot.title}</strong> в твоём флоте</div>
                  <div>✓ Среда: <strong>{HARDWARE_OPTIONS.find(h => h.id === selectedHardware)?.title}</strong></div>
                  <div>✓ Личный позывной, звание «Пилот I ранга» и роялти 70%</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleNextStep(3)}
                  className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Назад</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Регистрация...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Завершить онбординг (+500 🧱)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleGuestFinish}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Продолжить в гостевом режиме без регистрации →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
           STEP 5: ФИНАЛЬНОЕ ПРАЗДНОВАНИЕ (LAUNCH CELEBRATION)
           ═══════════════════════════════════════════════════════════════════ */}
        {step === 5 && createdUser && (
          <div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-1 shadow-xl shadow-cyan-500/25">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-4xl">
                {selectedAvatar}
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Онбординг пройден! Паспорт выдан!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Добро пожаловать в экипаж, {createdUser.username}!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Позывной: <strong className="text-cyan-300 font-mono">{createdUser.username}-Lead</strong> • Баланс: <strong className="text-amber-300 font-mono">500 🧱 Bricks</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-300 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <span>🤖 Активный робот готов:</span>
                <span className="text-cyan-300">{selectedRobot.title}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Все системы восприятия, виртуальный контур моторов и Web Audio синтезатор активированы.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => nav("/run")}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Запустить робота в кокпите (/run)</span>
              </button>

              <button
                onClick={() => nav("/")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Перейти в главное меню (/menu)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

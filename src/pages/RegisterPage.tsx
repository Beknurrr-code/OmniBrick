import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { 
  Bot, Sparkles, Lock, User, Eye, EyeOff, Check, 
  ArrowRight, ShieldCheck, Zap, Award, Compass, Wrench, 
  ChevronRight, AlertCircle, Home
} from "lucide-react";
import { authService, type AuthUser } from "../services/authService";
import { useSubscription } from "../context/SubscriptionContext";
import { soundService } from "../services/soundService";

interface Props {
  defaultMode?: "register" | "login";
}

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

const SPECIALTIES = [
  {
    id: "rover",
    icon: "🏎️",
    title: "Наземные роверы (Rovers)",
    desc: "Дифференциальный привод, объезд препятствий и захват целей",
  },
  {
    id: "arm",
    icon: "🦾",
    title: "Робоманипуляторы (Arms)",
    desc: "Обратная кинематика, захват и сортировка объектов",
  },
  {
    id: "vision",
    icon: "👁️",
    title: "Компьютерное зрение (VLM)",
    desc: "Мультимодальные модели Gemini ER-2, детекция цветов и меток",
  },
  {
    id: "lego",
    icon: "🧱",
    title: "LEGO Mindstorms 51515",
    desc: "Связка со смартфоном по BLE LWP3, моторы A/B и ультразвук",
  },
];

export default function RegisterPage({ defaultMode = "register" }: Props) {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "login" ? "login" : defaultMode;

  const { updateProfile, addBricks } = useSubscription();

  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("🤖");
  const [selectedSpecialty, setSelectedSpecialty] = useState("rover");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState<AuthUser | null>(null);

  useEffect(() => {
    const current = authService.getCurrentUser();
    if (current && !registeredSuccess) {
      // User is already logged in
    }
  }, [registeredSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (mode === "register") {
        const res = authService.register(username, password);
        setLoading(false);

        if (!res.success) {
          setError(res.error || "Ошибка регистрации");
          return;
        }

        if (res.user) {
          // Grant welcome bounty: +500 Bricks
          addBricks(500);

          // Update profile
          updateProfile({
            username: res.user.username,
            callsign: `${res.user.username}-Lead`,
            rank: "Пилот I ранга",
          });

          // Mark onboarding as complete
          localStorage.setItem("omnibrick_onboarding_v2", "true");
          localStorage.setItem("omnibrick_user_avatar", selectedAvatar);
          localStorage.setItem("omnibrick_user_specialty", selectedSpecialty);

          soundService.playHappyFanfare();
          setRegisteredSuccess(res.user);
        }
      } else {
        const res = authService.login(username, password);
        setLoading(false);

        if (!res.success) {
          setError(res.error || "Ошибка входа в систему");
          return;
        }

        if (res.user) {
          updateProfile({
            username: res.user.username,
            callsign: `${res.user.username}-Lead`,
          });
          localStorage.setItem("omnibrick_onboarding_v2", "true");
          soundService.playRobotChirp();
          nav("/");
        }
      }
    }, 300);
  };

  const handleGuestContinue = () => {
    localStorage.setItem("omnibrick_onboarding_v2", "true");
    sessionStorage.setItem("omnibrick_guest_dismissed", "true");
    nav("/");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#030712] text-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Cybernetic Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/5 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto space-y-6 relative z-10">
        
        {/* Navigation Breadcrumb back to Hub */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>В главное меню</span>
          </Link>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Shipathon 2026 Core
          </span>
        </div>

        {/* ─── SUCCESS SCREEN AFTER REGISTRATION ─── */}
        {registeredSuccess ? (
          <div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-1 shadow-xl shadow-cyan-500/25">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-4xl">
                {selectedAvatar}
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Паспорт Пилота успешно выдан!</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Добро пожаловать, {registeredSuccess.username}!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Позывной: <strong className="text-cyan-300 font-mono">{registeredSuccess.username}-Lead</strong> • Ранг: Пилот I ранга
              </p>
            </div>

            {/* Welcome Bounty Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-cyan-500/10 border border-amber-500/30 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                  🎁 Приветственный бонус
                </span>
                <span className="text-xs font-black font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  +500 🧱 Bricks
                </span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Чертёж <strong>Red Cube Hunter</strong> добавлен в твою библиотеку</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Доступ к публикации сборок в Маркетплейсе с роялти 70%</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Синхронизация профиля и наград Академии</span>
                </li>
              </ul>
            </div>

            {/* Next Steps Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => nav("/run")}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <span>Войти в кокпит управления</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => nav("/build")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
              >
                Открыть Студию сборок
              </button>
            </div>
          </div>
        ) : (
          /* ─── REGISTRATION & LOGIN CARD ─── */
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            
            {/* Header Identity */}
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Bot className="w-7 h-7 text-slate-950" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight pt-1">
                {mode === "register" ? "Паспорт Пилота OmniBrick" : "Вход в систему Пилота"}
              </h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {mode === "register"
                  ? "Создай цифровую личность для автономного управления роботами и получи +500 🧱 Bricks."
                  : "Авторизуйся, чтобы получить доступ к своим чертежам и балансу Bricks."}
              </p>
            </div>

            {/* Mode Tabs (Register / Login) */}
            <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Создать паспорт (+500 🧱)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Войти в аккаунт
              </button>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Avatar Selector (Only for Register Mode) */}
              {mode === "register" && (
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
              )}

              {/* Username / Callsign Input */}
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

              {/* Specialty Selection (Only for Register Mode) */}
              {mode === "register" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Основная специализация</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Hardware Focus</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SPECIALTIES.map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setSelectedSpecialty(spec.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedSpecialty === spec.id
                            ? "bg-cyan-950/40 border-cyan-500/60 shadow-sm shadow-cyan-500/10"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                          <span>{spec.icon}</span>
                          <span className="truncate">{spec.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {spec.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Обработка запроса...</span>
                ) : mode === "register" ? (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Создать Паспорт Пилота (+500 🧱)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Войти в систему</span>
                  </>
                )}
              </button>

              {/* Onboarding & Guest Fallback */}
              <div className="pt-2 flex flex-col items-center gap-2 text-center">
                <Link
                  to="/onboarding"
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer font-medium"
                >
                  📖 Пройти вводный интерактивный онбординг (/onboarding) →
                </Link>
                <button
                  type="button"
                  onClick={handleGuestContinue}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Продолжить в гостевом режиме без регистрации →
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

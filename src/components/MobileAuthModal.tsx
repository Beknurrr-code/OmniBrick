import { useState, useEffect } from "react";
import { X, Lock, User, Eye, EyeOff, Check, LogOut, ArrowRight, Loader2 } from "lucide-react";
import { authService, type AuthUser } from "../services/authService";
import { useSubscription } from "../context/SubscriptionContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MobileAuthModal({ isOpen, onClose, onSuccess }: Props) {
  const { updateProfile } = useSubscription();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  useEffect(() => {
    return authService.subscribe((u) => setCurrentUser(u));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPassword("");
      setCurrentUser(authService.getCurrentUser());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = isRegister
        ? authService.register(username, password)
        : authService.login(username, password);

      setLoading(false);

      if (!res.success) {
        setError(res.error || "Ошибка авторизации");
        return;
      }

      if (res.user) {
        updateProfile({
          username: res.user.username,
          callsign: `${res.user.username}-Lead`,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    }, 250);
  };

  const handleLogout = () => {
    authService.logout();
    updateProfile({
      username: "Pilot",
      callsign: "Guest",
    });
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-950 border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative text-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {currentUser ? (
          /* Already Logged In State */
          <div className="space-y-4 py-2 text-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 font-bold text-lg">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-slate-400">Вы вошли как</p>
              <h3 className="text-lg font-bold text-white tracking-tight">{currentUser.username}</h3>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Выйти
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        ) : (
          /* Minimalist Login & Register Form */
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isRegister ? "Регистрация" : "Вход"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRegister ? "Создайте аккаунт для сохранения роботов" : "Войдите в свой аккаунт Brain Brick"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Логин
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ваш логин"
                    required
                    autoFocus
                    autoComplete="username"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Пароль
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    required
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRegister ? (
                  "Создать аккаунт"
                ) : (
                  "Войти"
                )}
              </button>
            </form>

            <div className="text-center pt-1 border-t border-slate-900">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                {isRegister
                  ? "Уже есть аккаунт? Войти"
                  : "Нет аккаунта? Зарегистрироваться"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

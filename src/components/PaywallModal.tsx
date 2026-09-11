import { useState } from "react";
import {
  Sparkles,
  X,
  Check,
  ShieldCheck,
  Zap,
  Crown,
  Coins,
  Cpu,
  RefreshCw,
  Gift,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useSubscription } from "../context/SubscriptionContext";
import {
  AVAILABLE_IAP_PACKAGES,
  type IAPProductPackage,
} from "../services/subscriptionService";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "subscriptions" | "bricks" | "lifetime";
}

export default function PaywallModal({
  isOpen,
  onClose,
  defaultTab = "subscriptions",
}: PaywallModalProps) {
  const {
    isPro,
    tier,
    pilot,
    purchasePackage,
    restorePurchases,
    setTierOverride,
    addBricks,
  } = useSubscription();

  const [activeTab, setActiveTab] = useState<"subscriptions" | "bricks" | "lifetime">(defaultTab);
  const [selectedSubPlan, setSelectedSubPlan] = useState<"monthly_pro" | "annual_pro">("annual_pro");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const showNotification = (text: string, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleBuy = async (pkg: IAPProductPackage) => {
    setPurchasingId(pkg.id);
    try {
      const res = await purchasePackage(pkg.id);
      if (res.success) {
        showNotification(res.message);
        if (pkg.category === "subscription" || pkg.category === "lifetime") {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        showNotification(res.message, true);
      }
    } catch (e: any) {
      showNotification("Ошибка платежа: " + (e.message || "попробуйте позже"), true);
    } finally {
      setPurchasingId(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await restorePurchases();
      if (res.isPro) {
        showNotification("✓ Доступ успешно восстановлен!");
        setTimeout(() => onClose(), 1200);
      } else {
        showNotification("Активных покупок в Store не найдено", true);
      }
    } catch (e: any) {
      showNotification("Ошибка восстановления: " + (e.message || "сбой"), true);
    } finally {
      setRestoring(false);
    }
  };

  const subscriptionPackages = AVAILABLE_IAP_PACKAGES.filter(p => p.category === "subscription");
  const brickPackages = AVAILABLE_IAP_PACKAGES.filter(p => p.category === "bricks");
  const lifetimePackages = AVAILABLE_IAP_PACKAGES.filter(p => p.category === "lifetime");

  const currentSelectedSub = subscriptionPackages.find(p => p.id === selectedSubPlan) || subscriptionPackages[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b1120] border border-purple-500/40 rounded-3xl max-w-xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center justify-center gap-2">
            Brain Brick Store
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 normal-case font-semibold">
              RevenueCat 2026
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
            Разблокируйте передовые модели NPU Gemini, синтез автономных навыков и строительные блоки 🧱
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "subscriptions"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>PRO Подписки</span>
          </button>
          <button
            onClick={() => setActiveTab("bricks")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "bricks"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Bricks 🧱 ({pilot.bricksBalance})</span>
          </button>
          <button
            onClick={() => setActiveTab("lifetime")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "lifetime"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Вечный доступ ⚡</span>
          </button>
        </div>

        {/* Dynamic Tab Body */}
        <div className="space-y-4">
          
          {/* TAB 1: SUBSCRIPTIONS */}
          {activeTab === "subscriptions" && (
            <div className="space-y-3.5">
              {/* Plan Toggle Selector */}
              <div className="grid grid-cols-2 gap-2.5">
                {subscriptionPackages.map((pkg) => {
                  const isSelected = selectedSubPlan === pkg.id;
                  const isAnnual = pkg.id === "annual_pro";
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedSubPlan(pkg.id as any)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? "bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/40"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {pkg.badge && (
                        <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[9px] font-black uppercase text-slate-950 tracking-wider shadow">
                          {pkg.badge}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-300">{isAnnual ? "Годовой план" : "Месячный план"}</div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl sm:text-2xl font-black text-white">{pkg.price}</span>
                          <span className="text-[11px] text-slate-400">/{isAnnual ? "год" : "мес"}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-purple-300 font-mono flex items-center gap-1">
                        <Gift className="w-3 h-3 text-amber-400" />
                        <span>+{pkg.bricksIncluded?.toLocaleString()} Bricks бонус</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Features List */}
              <div className="p-4 bg-purple-950/20 rounded-2xl border border-purple-500/20 space-y-2 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1 flex items-center justify-between">
                  <span>Включено в тариф {currentSelectedSub.name}:</span>
                  <span className="text-[10px] font-mono text-cyan-400">Google Gemini Embodied</span>
                </div>
                {currentSelectedSub.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Upgrade Button */}
              <button
                onClick={() => handleBuy(currentSelectedSub)}
                disabled={purchasingId !== null || isPro}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {purchasingId === currentSelectedSub.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Оформление через RevenueCat...</span>
                  </>
                ) : isPro ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Brain Brick PRO Активен ({tier.toUpperCase()})</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>
                      Активировать {currentSelectedSub.name} • {currentSelectedSub.price}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: BRICKS RECHARGE */}
          {activeTab === "bricks" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-slate-400">Ваш текущий баланс:</span>
                <span className="font-mono font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {pilot.bricksBalance.toLocaleString()} 🧱
                </span>
              </div>

              <div className="space-y-2.5">
                {brickPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 relative overflow-hidden group"
                  >
                    {pkg.badge && (
                      <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-xl bg-gradient-to-l from-amber-500 to-orange-500 text-[9px] font-black text-slate-950 uppercase tracking-wider">
                        {pkg.badge}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🧱</span>
                        <h4 className="text-xs font-black text-white">{pkg.name}</h4>
                      </div>
                      <div className="text-sm font-black text-amber-300 font-mono">
                        +{pkg.bricksIncluded?.toLocaleString()} Bricks
                      </div>
                      <p className="text-[10px] text-slate-400 max-w-[240px] leading-tight">
                        {pkg.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleBuy(pkg)}
                      disabled={purchasingId !== null}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 shrink-0 cursor-pointer active:scale-95 transition-all"
                    >
                      {purchasingId === pkg.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <span>{pkg.price}</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIFETIME UNLOCKS */}
          {activeTab === "lifetime" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Разовые покупки навсегда: без ежемесячных списаний и без продления подписок.
              </p>

              <div className="space-y-3">
                {lifetimePackages.map((pkg) => {
                  const isFounder = pkg.id === "lifetime_founder";
                  return (
                    <div
                      key={pkg.id}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden space-y-3 ${
                        isFounder
                          ? "bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900/60 border-indigo-500/50"
                          : "bg-slate-900/60 border-cyan-500/30"
                      }`}
                    >
                      {pkg.badge && (
                        <div className="absolute top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">
                          {pkg.badge}
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                            {isFounder ? <Crown className="w-4 h-4 text-amber-400" /> : <Cpu className="w-4 h-4 text-cyan-400" />}
                            {pkg.name}
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-1 max-w-sm">
                            {pkg.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-white">{pkg.price}</span>
                          <div className="text-[10px] text-slate-400 font-mono">навсегда</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[11px] text-slate-300">
                        {pkg.features.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleBuy(pkg)}
                        disabled={purchasingId !== null || (isFounder && tier === "lifetime")}
                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                          isFounder
                            ? "bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-black shadow-lg shadow-orange-500/20"
                            : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                        }`}
                      >
                        {purchasingId === pkg.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Обработка Store...</span>
                          </>
                        ) : isFounder && tier === "lifetime" ? (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Founder Pass уже активирован</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Купить навсегда • {pkg.price}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-xs font-mono flex items-center justify-between animate-in fade-in ${
              feedback.isError
                ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
            }`}
          >
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Footer & Store Compliance */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={handleRestore}
              disabled={restoring || purchasingId !== null}
              className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 font-mono cursor-pointer"
            >
              {restoring ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                  <span>Восстановление...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>Восстановить покупки (Restore Purchases)</span>
                </>
              )}
            </button>

            <span className="text-[10px] text-slate-500 font-mono">
              Capacitor Purchases v13.5
            </span>
          </div>

          {/* Quick Sandbox for Shipathon Reviewers */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            <span className="text-amber-400 font-bold">⚡ Shipathon Review Sandbox:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTierOverride("pro");
                  addBricks(500);
                  showNotification("PRO режим симулирован (+500 🧱)");
                }}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                [PRO]
              </button>
              <button
                onClick={() => {
                  setTierOverride("lifetime");
                  addBricks(3000);
                  showNotification("Founder Lifetime симулирован (+3000 🧱)");
                }}
                className="text-purple-400 hover:underline cursor-pointer"
              >
                [Lifetime]
              </button>
              <button
                onClick={() => {
                  addBricks(1000);
                  showNotification("+1,000 🧱 Bricks начислено!");
                }}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                [+1k 🧱]
              </button>
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 pt-0.5">
            <span className="hover:text-slate-400 cursor-pointer">Условия использования</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Политика конфиденциальности</span>
            <span>•</span>
            <span>Автоматическое продление</span>
          </div>
        </div>

      </div>
    </div>
  );
}

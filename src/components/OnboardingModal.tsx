import React, { useState } from "react";
import { 
  Sparkles, Bot, Wrench, Compass, ArrowRight, Check, X, 
  Cpu, Award, ShieldCheck, UserCheck, Play, ArrowLeft, Radio
} from "lucide-react";
import { soundService } from "../services/soundService";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWithAI: (prompt: string) => void;
  onGoRegister?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartWithAI,
  onGoRegister,
}) => {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState("rover");
  const [selectedSetup, setSelectedSetup] = useState("just_explore");

  if (!isOpen) return null;

  const handleFinish = (action?: "ai" | "register" | "guest") => {
    localStorage.setItem("omnibrick_onboarding_v2", "true");
    onClose();

    if (action === "register") {
      soundService.playHappyFanfare();
      if (onGoRegister) {
        onGoRegister();
      } else {
        window.location.href = "/register";
      }
    } else if (action === "ai") {
      soundService.playRobotChirp();
      onStartWithAI("Build me a robot that finds a red cube.");
    } else {
      soundService.playRobotChirp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-100">
        
        {/* Top Header & Progress */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                  OmniBrick Onboarding
                </h2>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Shipathon 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Шаг {step} из 4 • Вводный инструктаж</p>
            </div>
          </div>

          <button
            onClick={() => handleFinish("guest")}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Пропустить инструктаж"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* ─── STEP 1: Концепция платформы ─── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>📱 Смартфон как мозг робота</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Традиционные роботы требуют дорогих компьютеров за $500+. 
                <strong> OmniBrick</strong> превращает твой телефон в когнитивный NPU-мозг, 
                управляющий моторами на частоте 20 Гц.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white">Когнитивный мозг (Смартфон)</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Камера для зрения Gemini VLM, микрофон для голоса пилота и Web Audio синтезатор.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white">Физический рефлекс (LEGO / Арена)</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Управление моторами по BLE (LEGO Mindstorms 51515) или мгновенная 2D-симуляция.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundService.playRobotChirp();
                setStep(2);
              }}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <span>Понятно! Выбрать первого робота</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 2: Какого робота ты хочешь построить? ─── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Выбери архитектуру первого робота
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ИИ может мгновенно сгенерировать конфигурацию моторов и сенсоров:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "rover", title: "Red Cube Hunter", desc: "Поиск кубиков через камеру", icon: Bot, badge: "Флагман" },
                { id: "racer", title: "Kinematics Racer", desc: "Скоростной диф. привод", icon: Compass, badge: "Дрифт" },
                { id: "arm", title: "Titan Claw 3-DoF", desc: "Роборука-манипулятор", icon: Wrench, badge: "Манипуляция" },
                { id: "pet", title: "Companion Pet", desc: "Эмоциональные живые глаза", icon: Sparkles, badge: "ИИ Друг" },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedGoal === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedGoal(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-xs font-black text-white truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-3.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
              >
                Назад
              </button>
              <button
                onClick={() => {
                  soundService.playRobotChirp();
                  setStep(3);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <span>Далее: Режим запуска</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Выбор аппаратной среды ─── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Аппаратная конфигурация
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                OmniBrick работает и без физических деталей, и с реальным шасси:
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: "just_explore",
                  title: "Виртуальная 2D Арена (Рекомендуется)",
                  badge: "20Гц Симулятор",
                  desc: "Мгновенное тестирование в браузере: физика, виртуальные сенсоры и трассировка пути без деталей.",
                },
                {
                  id: "have_robot",
                  title: "LEGO Mindstorms 51515 / SPIKE Prime",
                  badge: "Web Bluetooth BLE",
                  desc: "Подключение смартфона к хабу через Bluetooth LWP3 с контролем моторов A/B и ультразвука.",
                },
                {
                  id: "want_to_build",
                  title: "Сборка с нуля (DIY Arduino / ESP32)",
                  badge: "Академия",
                  desc: "Интерактивные схемы распиновки и гайды в Академии для самостоятельной пайки.",
                },
              ].map((setup) => {
                const isSelected = selectedSetup === setup.id;
                return (
                  <button
                    key={setup.id}
                    onClick={() => setSelectedSetup(setup.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white">{setup.title}</div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {setup.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{setup.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setStep(2)}
                className="py-2.5 px-3.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
              >
                Назад
              </button>
              <button
                onClick={() => {
                  soundService.playHappyFanfare();
                  setStep(4);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <span>Финал: Паспорт Пилота</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: Паспорт Пилота и Приветственный Бонус ─── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>🎫 Получи Паспорт Пилота</span>
                <span className="text-xs font-mono font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  +500 🧱 Bricks
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Зарегистрируй позывной, чтобы сохранять свои сборки роботов и получить стартовый капитал:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-slate-950 to-blue-950/60 border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Стартовый набор новичка</span>
                </span>
                <span className="text-xs font-black font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  500 🧱
                </span>
              </div>

              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Личный позывной и голографический Roblox-аватар</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Готовый чертёж робота <strong>Red Cube Hunter</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Публикация сборок в Маркетплейсе с роялти 70%</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleFinish("register")}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Зарегистрировать Паспорт (+500 🧱)</span>
              </button>

              <button
                onClick={() => handleFinish("ai")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>Попробовать сгенерировать робота с ИИ</span>
              </button>

              <button
                onClick={() => handleFinish("guest")}
                className="w-full py-2 px-4 text-center text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Продолжить как Гость в симуляторе →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

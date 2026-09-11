import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Bot, Sparkles, X, Send, ArrowRight, Volume2, VolumeX, 
  HelpCircle, Zap, Compass, Wrench, Shield, CheckCircle2,
  RefreshCw, ChevronRight, MessageSquare
} from "lucide-react";
import { soundService } from "../../services/soundService";
import { useRobot } from "../../context/RobotContext";

interface CopilotMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: number;
  actionButton?: {
    label: string;
    path?: string;
    onClick?: () => void;
  };
}

interface ContextPrompt {
  label: string;
  query: string;
}

export default function AICopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { activeBuild } = useRobot();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: "Привет, пилот! Я бортовой Копилот Brain Brick. Я помогу разобраться в приложении, подключить LEGO-хаб, настроить зрение или собрать нового робота. Чем помочь?",
      timestamp: Date.now(),
      actionButton: {
        label: "🚀 Быстрый старт: Академия",
        path: "/academy",
      },
    },
  ]);

  // Contextual Quick Prompts based on active route
  const getContextPrompts = (): ContextPrompt[] => {
    const path = location.pathname;
    if (path.includes("/build")) {
      return [
        { label: "Как создать робота?", query: "Как создать нового робота в студии?" },
        { label: "Что такое MCP?", query: "Объясни простыми словами, что такое MCP инструменты?" },
        { label: "Собери робота с клешней", query: "Собери мне робота-манипулятора с клешней" },
      ];
    }
    if (path.includes("/run")) {
      return [
        { label: "Как подключить BLE?", query: "Как подключить LEGO Mindstorms 51515 по Bluetooth?" },
        { label: "Почему не едет вперед?", query: "Почему робот блокирует движение вперед?" },
        { label: "Как работает камера?", query: "Как смартфон распознает объекты камерой?" },
      ];
    }
    if (path.includes("/marketplace")) {
      return [
        { label: "Как заработать Bricks?", query: "Как я могу заработать Bricks на своих сборках?" },
        { label: "Как опубликовать билд?", query: "Как выставить своего робота на продажу?" },
      ];
    }
    if (path.includes("/academy")) {
      return [
        { label: "Что такое LWP3?", query: "Что такое протокол LEGO Wireless Protocol LWP3?" },
        { label: "Зачем телефон роботу?", query: "Зачем использовать смартфон как мозг робота?" },
      ];
    }
    return [
      { label: "С чего начать?", query: "Я новичок. С чего мне начать в Brain Brick?" },
      { label: "Как запустить симулятор?", query: "Как протестировать робота в 3D симуляторе без железа?" },
      { label: "Что умеет платформа?", query: "Расскажи кратко обо всех возможностях Brain Brick" },
    ];
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ru-RU";
      utterance.rate = 1.1;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Copilot TTS error:", e);
    }
  };

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputVal).trim();
    if (!q) return;

    soundService.playRobotChirp();

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      const lower = q.toLowerCase();
      let answer = "";
      let action: CopilotMessage["actionButton"] = undefined;

      if (lower.includes("новичок") || lower.includes("с чего начать") || lower.includes("start")) {
        answer = "Добро пожаловать в будущее робототехники! Вот 3 простых шага:\n1. Зайди в Академию (`/academy`) и изучи 1-й урок о концепции смартфона как мозга.\n2. В Студии (`/build`) выбери готовый шаблон, например 'Cyber Rover Alpha'.\n3. Нажми 'Run' и запусти его в 3D-симуляторе или подключи реальный LEGO хаб!";
        action = { label: "📚 Открыть Академию", path: "/academy" };
      } else if (lower.includes("bluetooth") || lower.includes("ble") || lower.includes("подключ") || lower.includes("хаб") || lower.includes("lego")) {
        answer = "Чтобы подключить LEGO Mindstorms 51515 или SPIKE Prime:\n1. Включи Bluetooth на телефоне/компьютере.\n2. Включи хаб LEGO нажатием центральной кнопки (светодиод начнет мигать).\n3. На странице /run выбери режим 'LEGO 51515' и нажми 'Connect BLE'. Браузер или приложение найдет хаб по протоколу LWP3!";
        action = { label: "🎮 Перейти в режим Run", path: "/run" };
      } else if (lower.includes("не едет") || lower.includes("блокирует") || lower.includes("дистанци") || lower.includes("препятстви")) {
        answer = "У нашего робота работает встроенная Кинематическая Защита (Embodied Safety)! Прежде чем включить моторы, ИИ проверяет ультразвуковой сонар. Если препятствие ближе 25 см, разгон блокируется, чтобы робот не сломал шестеренки. Отодвинь препятствие или скомандуй 'назад' / 'налево'!";
        action = { label: "👀 Проверить Сенсоры в Run", path: "/run" };
      } else if (lower.includes("mcp") || lower.includes("инструмент")) {
        answer = "MCP (Model Context Protocol) — это открытый стандарт от Anthropic, который мы адаптировали для роботов. Вместо того чтобы просто писать текст, нейросеть вызывает реальные инструменты: 'drive_motors', 'turn_robot', 'scan_visual_environment', 'calculate_safe_drive'. Робот превращается в действующего физического агента!";
        action = { label: "🛠️ Посмотреть MCP в Билдере", path: "/build" };
      } else if (lower.includes("камер") || lower.includes("зрен") || lower.includes("видеть") || lower.includes("видео")) {
        answer = "Смартфон крепится на робота камерой вперед. Поток 20 FPS передается в локальную или облачную VLM-модель (Gemini 2.5 Flash / Gemma / Ollama). ИИ находит красный куб, людей или препятствия и передает координаты в колесные моторы.";
        action = { label: "📷 Открыть Видеопоток", path: "/run" };
      } else if (lower.includes("симулятор") || lower.includes("без желез") || lower.includes("virtual")) {
        answer = "В Brain Brick есть полноценная 3D Виртуальная Арена на Three.js! Перейди в `/run` и переключи адаптер на 'Virtual Simulation Arena'. Там можно управлять виртуальным ровером, раскидывать кубики и тестировать зрение без реального конструктора.";
        action = { label: "🌐 Запустить 3D Арену", path: "/run" };
      } else if (lower.includes("brick") || lower.includes("заработ") || lower.includes("монет") || lower.includes("купить")) {
        answer = "Bricks 🧱 — это внутренняя валюта робототехников. Ты получаешь Bricks за прохождение тестов в Академии (по 50 Bricks за урок), а также 70% роялти от каждой покупки твоей сборки другими пилотами на Маркетплейсе!";
        action = { label: "🛍️ Зайти на Маркетплейс", path: "/marketplace" };
      } else if (lower.includes("клешн") || lower.includes("манипулятор") || lower.includes("arm")) {
        answer = "Отличная идея! Я рекомендую использовать манипулятор 'Titan Claw 01' с 3 моторами: M1 (поворот базы), M2 (наклон стрелы), M3 (захват клешни). Ты можешь создать его в Студии в 1 клик через AI Builder!";
        action = { label: "⚙️ Открыть Студию", path: "/build" };
      } else {
        answer = `Я понял твой запрос: "${q}". Я зафиксировал параметры в бортовом журнале. Рекомендую проверить статус на вкладке Dashboard или протестировать команды в Run!`;
        action = { label: "📊 Открыть Dashboard", path: "/dashboard" };
      }

      const copilotMsg: CopilotMessage = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        text: answer,
        timestamp: Date.now(),
        actionButton: action,
      };

      setMessages(prev => [...prev, copilotMsg]);
      setIsTyping(false);
      speakText(answer);
    }, 600);
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes("/build")) return "Студия Сборок (/build)";
    if (p.includes("/run")) return "Боевой Запуск (/run)";
    if (p.includes("/dashboard")) return "Центр Телеметрии (/dashboard)";
    if (p.includes("/marketplace")) return "Маркетплейс (/marketplace)";
    if (p.includes("/academy")) return "Академия Робототехники (/academy)";
    if (p.includes("/community")) return "Сообщество Пилотов (/community)";
    if (p.includes("/profile")) return "Паспорт Пилота (/profile)";
    return "Главное Меню";
  };

  return (
    <>
      {/* ─── Floating Cyber Orb Button ─── */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => {
              setIsOpen(true);
              soundService.playRobotChirp();
            }}
            className="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white font-medium shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-200 border border-cyan-400/40"
            title="Открыть ИИ-Копилот платформы"
          >
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
            </span>

            <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-cyan-300/40 group-hover:rotate-12 transition-transform">
              <Bot className="w-5 h-5 text-cyan-300" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5 text-cyan-200">
                Copilot AI <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              </div>
              <div className="text-[10px] text-gray-300 font-mono">Помощник пилота</div>
            </div>
          </button>
        )}
      </div>

      {/* ─── Expandable Cyber Drawer / Modal ─── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[420px] max-h-[85vh] h-[600px] flex flex-col bg-gray-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-800/80 bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-gray-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Brain Brick Copilot</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">v2.5</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {getPageTitle()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={`p-2 rounded-xl transition-colors ${speechEnabled ? "text-cyan-400 hover:bg-cyan-950/50" : "text-gray-500 hover:bg-gray-800"}`}
                title={speechEnabled ? "Озвучка включена" : "Озвучка выключена"}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800/80 transition-colors"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed text-sm ${
                    m.sender === "user"
                      ? "bg-gradient-to-br from-cyan-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-cyan-900/30"
                      : "bg-gray-900/90 text-gray-200 border border-gray-800 rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  {m.text}

                  {/* Contextual Action Button */}
                  {m.actionButton && (
                    <div className="mt-3 pt-2.5 border-t border-gray-700/60">
                      <button
                        onClick={() => {
                          if (m.actionButton?.path) {
                            navigate(m.actionButton.path);
                            setIsOpen(false);
                          } else if (m.actionButton?.onClick) {
                            m.actionButton.onClick();
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
                      >
                        {m.actionButton.label}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 font-mono px-1">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono py-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                <span>Копилот думает...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Context Hints */}
          <div className="px-4 py-2 bg-gray-900/40 border-t border-gray-800/80 overflow-x-auto no-scrollbar flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono shrink-0 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Подсказки:
            </span>
            {getContextPrompts().map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-gray-800 hover:bg-cyan-950/60 hover:text-cyan-300 text-gray-300 border border-gray-700/60 hover:border-cyan-500/40 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-gray-900/90 border-t border-gray-800 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Спроси Копилота о роботе или приложении..."
              className="flex-1 bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 outline-none transition-all font-sans"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputVal.trim() || isTyping}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 text-white shadow-md shadow-cyan-900/30 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
}

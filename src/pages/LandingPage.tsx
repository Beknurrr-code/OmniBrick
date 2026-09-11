import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bot, Sparkles, Play, Wrench, LayoutDashboard, ShoppingBag, 
  GraduationCap, Users, User, ArrowRight, Check, Compass, 
  Radio, Zap, ShieldCheck, ChevronDown, ChevronUp, Star, 
  Cpu, Battery, Eye, MessageSquare, ExternalLink, Award, 
  HelpCircle, Layers, Smartphone
} from "lucide-react";
import { soundService } from "../services/soundService";

export default function LandingPage() {
  const nav = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    soundService.playRobotChirp();
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const handleStartOnboarding = () => {
    soundService.playHappyFanfare();
    nav("/onboarding");
  };

  const features = [
    {
      icon: Eye,
      title: "Мультимодальное зрение Gemini VLM",
      desc: "Робот 'видит' мир через веб-камеру смартфона: распознаёт объекты, кубики LEGO, ориентиры и препятствия с низкой задержкой.",
      badge: "Vision",
      color: "from-cyan-500 to-blue-600",
    },
    {
      icon: Radio,
      title: "Когнитивный контур 20 Гц",
      desc: "Архитектура делит робота на когнитивный NPU-мозг (телефон) и спинной рефлекс моторов (LEGO/ESP32) с циклом опроса 20 раз в секунду.",
      badge: "20Hz Loop",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Smartphone,
      title: "LEGO Mindstorms 51515 & BLE",
      desc: "Прямое беспроводное подключение по протоколу LWP3. Управление моторами A/B, чтение сонара и 4-шаговый интерактивный гид по сборке.",
      badge: "Hardware",
      color: "from-amber-500 to-orange-600",
    },
    {
      icon: Award,
      title: "Экономика Bricks и 70% роялти",
      desc: "Монетизация через RevenueCat: получай 70% авторских отчислений за каждую скачанную сообществом сборку или промпт.",
      badge: "RevenueCat",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  const robots = [
    {
      name: "Red Cube Hunter",
      tagline: "Флагман компьютерного зрения",
      desc: "Находит красные кубики через камеру, вычисляет пеленг и подъезжает к цели на расстояние 15 см.",
      icon: "🏎️",
      specs: "2 мотора • Камера • Ультразвуковой сонар",
    },
    {
      name: "Kinematics Arc Racer",
      tagline: "Скоростной дифференциальный болид",
      desc: "Расчёт кинематических дуг поворота, быстрый объезд препятствий и агрессивный дрифт.",
      icon: "⚡",
      specs: "2 мотора • Гироскоп • Арена 800x500",
    },
    {
      name: "Titan Claw 3-DoF",
      tagline: "Роботизированная клешня",
      desc: "Обратная кинематика (IK) для захвата, подъёма и сортировки физических грузов.",
      icon: "🦾",
      specs: "3 сервопривода • Inverse Kinematics",
    },
    {
      name: "Companion Pet",
      tagline: "Эмоциональный ИИ-питомец",
      desc: "Живые эмоциональные глаза робота, распознавание голоса и научно-фантастические звуки Web Audio.",
      icon: "🤖",
      specs: "Robot Eyes UI • Web Audio SFX • Микрофон",
    },
  ];

  const faqs = [
    {
      q: "Нужен ли мне настоящий физический робот для работы с Brain Brick?",
      a: "Нет! В платформу встроен полноценный 2D-симулятор арены с физикой движения, трассировкой лучей сонара и виртуальной камерой. Ты можешь тестировать алгоритмы прямо в браузере без единой физической детали.",
    },
    {
      q: "Какое оборудование поддерживается для физических сборок?",
      a: "Официально поддерживаются наборы LEGO Mindstorms 51515 и LEGO SPIKE Prime (через Web Bluetooth по протоколу LWP3), а также любые DIY-микроконтроллеры ESP32, Arduino и Raspberry Pi Pico через открытый WebSocket/Serial API.",
    },
    {
      q: "Как смартфон выступает в роли 'мозга'?",
      a: "Смартфон закрепляется на шасси робота. Его камера заменяет дорогие машинные сенсоры, микрофон слушает команды пилота, нейрочип обрабатывает промпты и зрение Gemini, а микроконтроллер робота просто исполняет команды моторов с частотой 20 Гц.",
    },
    {
      q: "Что такое валюта Bricks и как работает монетизация RevenueCat?",
      a: "Bricks 🧱 — внутренняя валюта платформы. Пилоты зарабатывают её за прохождение уроков Академии и получают 70% роялти за форки их сборок другими пользователями. Подписка Brain Brick Pro через RevenueCat открывает безлимитные вызовы облачных моделей Gemini ER-2 и Gemma.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      
      {/* ─── 1. TOP MARKETING NAVBAR ─── */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/landing" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400">
              BRAIN BRICK
            </span>
          </Link>
          <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Shipathon 2026
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Возможности</a>
          <a href="#architecture" className="hover:text-white transition-colors">Архитектура 20Гц</a>
          <a href="#fleet" className="hover:text-white transition-colors">Флот роботов</a>
          <a href="#pricing" className="hover:text-white transition-colors">Тарифы</a>
          <a href="#faq" className="hover:text-white transition-colors">Частые вопросы</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
          >
            Войти
          </Link>
          <button
            onClick={handleStartOnboarding}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Начать онбординг (+500 🧱)</span>
          </button>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ─── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        {/* Background Radial Ambient Lights */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-cyan-500/40 text-xs text-cyan-300 font-mono shadow-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>RevenueCat Shipathon 2026 • Next Gen Award Nominee</span>
          </div>

          {/* Big Punchy Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Преврати свой смартфон в <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400">
              бортовой ИИ-мозг для роботов
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Brain Brick объединяет HD-камеру, микрофон и NPU твоего телефона с LEGO Mindstorms 51515 и 2D-симулятором. 
            Компьютерное зрение Gemini VLM, когнитивный контур 20 Гц и готовые инструменты в одном приложении.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={handleStartOnboarding}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-2xl shadow-cyan-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Пройти интерактивный онбординг (+500 🧱)</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <Link
              to="/run"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
              <span>Запустить симулятор в браузере</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 max-w-3xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">20 Гц</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Когнитивный цикл</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono">Gemini ER-2</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Зрение VLM в реальном времени</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">LEGO 51515</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Web Bluetooth LWP3</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">70% Роялти</div>
              <div className="text-[11px] text-slate-400 mt-0.5">RevenueCat Economy</div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 3. THE REVOLUTION: SMARTPHONE AS ROBOT BRAIN ─── */}
      <section id="architecture" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-950/50">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">Архитектурный переворот</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Зачем тратить $500 на Jetson, если в твоём кармане уже есть всё?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Brain Brick разделяет робота на два независимых слоя: высокоуровневый когнитивный мозг и низкоуровневый спинной рефлекс.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Left Card: The Old Expensive Way */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold">
                <span>❌ Старый традиционный подход</span>
              </div>
              <h3 className="text-lg font-black text-white">Дорого, тяжело и неудобно</h3>
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Тяжёлый бортовой компьютер ($500+ за NVIDIA Jetson / Raspberry Pi 5 + обвес).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Огромный павербанк, съедающий грузоподъёмность и разряжающийся за 15 минут.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Сложная настройка Linux драйверов камеры, CSI-шлейфов и USB-модемов.</span>
                </li>
              </ul>
            </div>

            {/* Right Card: The Brain Brick Way */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-500/40 space-y-4 shadow-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>✨ Инновация Brain Brick</span>
              </div>
              <h3 className="text-lg font-black text-white">Смартфон на шасси + BLE Рефлекс</h3>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Телефон — это зрение и голос:</strong> Камера 4K, микрофон со стерео-распознаванием, динамик для чирпов и 5G-связь.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Микроконтроллер — это рефлексы:</strong> LEGO 51515 или ESP32 крутит моторы A/B на частоте 20 Гц без задержек.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Zero Driver Setup:</strong> Работает прямо из браузера через Web Bluetooth или в 2D виртуальной арене.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 4. CORE FEATURES (4 PILLARS) ─── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">Возможности</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Полный стек автономной робототехники
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Всё необходимое от распознавания образов до публикации авторских манифестов в едином хабе:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div 
                  key={f.title}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3 group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${f.color} flex items-center justify-center text-slate-950 shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white tracking-tight">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── 5. ROBOT FLEET SHOWCASE ─── */}
      <section id="fleet" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-950/50">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">Чертёжная мастерская</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Готовые флагманские конфигурации
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Выбирай готового робота или создавай свой манифест из текстовых намерений в Студии сборок:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {robots.map((r) => (
              <div
                key={r.name}
                className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-3 shadow-lg hover:border-cyan-500/40 transition-all"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
                    {r.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{r.name}</h3>
                    <span className="text-[10px] text-cyan-400 font-mono block">{r.tagline}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                  {r.specs}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link
              to="/build"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all shadow-md"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Открыть Студию сборок (/build)</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ─── 6. PRICING & REVENUECAT ECONOMY ─── */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">Монетизация RevenueCat</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Прозрачные тарифы и экономика Bricks
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Начни бесплатно в симуляторе или оформи PRO-доступ с безлимитными облачными моделями Gemini:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
            
            {/* Free Tier */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono uppercase text-slate-400 font-bold">Бесплатный старт</span>
                  <div className="text-3xl font-black text-white mt-1">$0 <span className="text-xs text-slate-500 font-normal">навсегда</span></div>
                  <p className="text-xs text-slate-400 mt-1">Идеально для новичков, обучения в Академии и тестов в симуляторе.</p>
                </div>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2D виртуальная арена с физикой</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>6 уроков Академии с заработком Bricks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Экспорт и импорт сборок в JSON</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+500 🧱 Bricks приветственный бонус</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleStartOnboarding}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Начать бесплатно
              </button>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/50 space-y-5 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-mono font-black uppercase tracking-wider shadow-md">
                RevenueCat Pro
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono uppercase text-indigo-300 font-bold">Neural Nexus Pro</span>
                  <div className="text-3xl font-black text-white mt-1">$9.99 <span className="text-xs text-slate-400 font-normal">/ месяц</span></div>
                  <p className="text-xs text-slate-300 mt-1">Максимальная производительность для автономных миссий и соревнований.</p>
                </div>
                <ul className="text-xs text-slate-200 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Безлимитные мультимодальные вызовы Gemini ER-2</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Голографическая VIP-карта Neural Nexus</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>7 тем оформления для программистов</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Публикация в Маркетплейсе с роялти 70%</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleStartOnboarding}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
              >
                Оформить PRO подписку
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ─── 7. FAQ SECTION ─── */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-950/50">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">FAQ</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Часто задаваемые вопросы
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── 8. FINAL CALL TO ACTION ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-5 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-2xl shadow-cyan-500/30">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Готов собрать своего первого автономного робота?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Пройди 4-шаговый онбординг, выбери сборку, получи позывной пилота и стартовые 500 Bricks прямо сейчас.
          </p>
          <div className="pt-2">
            <button
              onClick={handleStartOnboarding}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm inline-flex items-center gap-2 shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Запустить Brain Brick (Онбординг)</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 9. FOOTER ─── */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              BB
            </div>
            <span className="font-bold text-slate-300">Brain Brick</span>
            <span>• Created by Beknur (15 y.o., Astana, Kazakhstan)</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <Link to="/onboarding" className="hover:text-cyan-300 transition-colors">Онбординг</Link>
            <Link to="/run" className="hover:text-cyan-300 transition-colors">Кокпит</Link>
            <Link to="/build" className="hover:text-cyan-300 transition-colors">Студия</Link>
            <Link to="/academy" className="hover:text-cyan-300 transition-colors">Академия</Link>
            <Link to="/marketplace" className="hover:text-cyan-300 transition-colors">Маркетплейс</Link>
            <Link to="/register" className="hover:text-cyan-300 transition-colors">Регистрация</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

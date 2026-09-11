import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  GraduationCap, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Cpu, 
  Brain, 
  Radio, 
  ArrowRight, 
  Wrench, 
  Terminal, 
  ShieldCheck, 
  X, 
  Award,
  ExternalLink
} from "lucide-react";
import { useSubscription } from "../context/SubscriptionContext";
import { buildStorage } from "../services/buildStorage";
import PageOverviewBanner from "../components/PageOverviewBanner";

interface AcademyLesson {
  id: string;
  category: "Getting Started" | "Build Robots" | "AI & Agents" | "Tools" | "MCP" | "Advanced Robotics";
  title: string;
  duration: string;
  rewardBricks: number;
  description: string;
  summary: string;
  bulletPoints: string[];
  codeExample?: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  starterBuildId?: string;
}

const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: "lesson-phone-brain",
    category: "Getting Started",
    title: "The Smartphone as a Robot Brain",
    duration: "5 min",
    rewardBricks: 100,
    description: "Why mounting a mobile phone on a low-cost microcontroller disrupts traditional expensive robotics.",
    summary: "Traditional robots require expensive onboard computers ($500+ NVIDIA Jetson or Raspberry Pi 5) that drain batteries quickly. OmniBrick turns this inside out: your smartphone already has high-definition vision cameras, microphones, stereo speakers, high-speed 5G/Wi-Fi, and a neural processing engine.",
    bulletPoints: [
      "The Smartphone acts as the Cognitive Brain (Perception, Vision, LLM, Speech).",
      "The Microcontroller (ESP32, Arduino, LEGO Spike) acts as the Spinal Reflex (Motor PWM, Sonar pins).",
      "Decoupled communication eliminates messy driver bugs and allows instant OTA updates.",
    ],
    codeExample: `// OmniBrick Cognitive Split:
Smartphone (Camera / NPU / Audio)
      │  (MCP Tool Commands over BLE / Virtual Bus)
      ▼
Microcontroller (M1 Left Motor, M2 Right Motor, S1 Sonar)`,
    quiz: {
      question: "What is the primary role of the microcontroller in OmniBrick's architecture?",
      options: [
        "Running heavy multimodal computer vision models",
        "Acting as the spinal reflex for low-level motor PWM and sensor reading",
        "Rendering the 3D graphics viewport",
        "Handling user cloud authentication",
      ],
      correctIndex: 1,
      explanation: "The microcontroller handles fast hardware reflexes and pulse-width modulation, while the phone handles AI perception.",
    },
    starterBuildId: "build-red-cube-hunter",
  },
  {
    id: "lesson-hardware-manifest",
    category: "Build Robots",
    title: "Hardware Manifests & Semantic Pin Mapping",
    duration: "6 min",
    rewardBricks: 150,
    description: "Eliminating hardcoded pin numbers in favor of semantic roles like drive_left and gripper.",
    summary: "Writing code with hardcoded pins (like 'digitalWrite(12, HIGH)') makes code brittle and non-portable. OmniBrick introduces the Hardware Manifest, where physical pins are bound to functional semantic roles.",
    bulletPoints: [
      "Roles: drive_left, drive_right, arm_lift, gripper, head_pan.",
      "Hardware changes never break AI logic: if you swap pin M1 for M3, you only update the manifest.",
      "AI can inspect the manifest and automatically reason about available actuators.",
    ],
    codeExample: `// Hardware Manifest Example:
motors: [
  { port: "M1", role: "drive_left", maxPower: 100 },
  { port: "M2", role: "drive_right", maxPower: 100 }
]`,
    quiz: {
      question: "Why does OmniBrick use semantic roles instead of raw pin numbers?",
      options: [
        "To make robots heavier",
        "To decouple AI behavior from physical wiring so builds remain portable",
        "Because pins cannot handle PWM signals",
        "To prevent motors from rotating",
      ],
      correctIndex: 1,
      explanation: "Semantic roles allow the same AI behavior to run on Lego, Arduino, ESP32, or simulation without rewriting code.",
    },
    starterBuildId: "build-red-cube-hunter",
  },
  {
    id: "lesson-mcp-protocol",
    category: "MCP",
    title: "Model Context Protocol (MCP) in Robotics",
    duration: "8 min",
    rewardBricks: 200,
    description: "Standardizing how autonomous AI agents discover and invoke physical robot tools.",
    summary: "Model Context Protocol (MCP) is the universal bridge between AI reasoning and physical world actions. In OmniBrick, each capability is exposed as a standardized tool with structured inputs and outputs.",
    bulletPoints: [
      "Tools: detect_object, drive_motors, turn_robot, stop_robot, speak_voice.",
      "Strict input validation guarantees motor speeds stay within safe bounds (-100 to +100%).",
      "Creators can publish reusable MCP tool bundles to the Marketplace.",
    ],
    codeExample: `// MCP Tool Execution:
const result = await mcp.execute("drive_motors", {
  leftSpeed: 60,
  rightSpeed: 60,
  durationMs: 1000
});`,
    quiz: {
      question: "What does MCP provide in OmniBrick?",
      options: [
        "A battery charging algorithm",
        "A standardized tool discovery and invocation interface for AI agents",
        "A physical plastic shell for Lego bricks",
        "A Bluetooth antenna driver",
      ],
      correctIndex: 1,
      explanation: "MCP gives the AI model structured tools to perceive and actuate the robot.",
    },
    starterBuildId: "build-red-cube-hunter",
  },
  {
    id: "lesson-perception-action",
    category: "AI & Agents",
    title: "The Autonomous Perception-Action Loop",
    duration: "7 min",
    rewardBricks: 150,
    description: "How multimodal vision and continuous reasoning loops drive intelligent autonomy.",
    summary: "The perception-action loop runs continuously at 20Hz: Perceive → Reason → Decide → Act. If the camera detects a red cube at 180cm with a +12° bearing, the AI computes the angular delta and pulses the drive motors.",
    bulletPoints: [
      "Perceive: Camera scans field of view (FOV) and locates target bounding boxes.",
      "Reason: AI checks guidelines (e.g. keep 20cm clearance from walls).",
      "Act: MCP dispatches motor commands and speaks status aloud.",
    ],
    codeExample: `// Perception-Action Loop:
Camera Feed → detect_object("red cube")
      ↓ (Bearing: +12°, Distance: 180cm)
AI Reasoning → "Target locked, aligning heading"
      ↓
MCP Tool Call → drive_motors(left=60, right=60)`,
    quiz: {
      question: "What sequence represents the core autonomous cycle in OmniBrick?",
      options: [
        "Charge → Sleep → Restart",
        "Perceive → Reason → Decide → Act",
        "Compile → Debug → Crash",
        "Drive → Accelerate → Burnout",
      ],
      correctIndex: 1,
      explanation: "Robotic agents perceive sensory inputs, reason over guidelines, and execute tool calls in continuous cycles.",
    },
    starterBuildId: "build-red-cube-hunter",
  },
  {
    id: "lesson-lego-mindstorms",
    category: "Build Robots",
    title: "LEGO Mindstorms 51515 & SPIKE Prime Integration",
    duration: "6 min",
    rewardBricks: 180,
    description: "Connecting the Robot Inventor STM32 hub directly via Web Bluetooth LWP3 without custom firmware.",
    summary: "LEGO Robot Inventor 51515 and SPIKE Prime hubs run an STM32F413 processor with official LEGO Wireless Protocol v3 (LWP3). OmniBrick communicates with the hub directly over Bluetooth Low Energy, streaming motor speeds to Ports A & B and displaying pixel faces on the 5x5 LED matrix.",
    bulletPoints: [
      "Official LWP3 service UUID: 00001623-1212-efde-1623-785feabcd123.",
      "Zero flashing required: the robot operates with stock firmware out-of-the-box.",
      "Hardware safety auto-brake triggers via ultrasonic sensor when distance < 18cm.",
    ],
    codeExample: `// LWP3 Direct Port Drive:
legoAdapter.driveMotors({
  leftSpeed: 70,   // Port A
  rightSpeed: 70,  // Port B
  durationMs: 800
});`,
    quiz: {
      question: "Does LEGO Mindstorms 51515 require flashing custom third-party firmware for OmniBrick?",
      options: [
        "Yes, you must solder an ESP32 chip onto the motherboard",
        "No, it connects natively via Web Bluetooth using official LEGO Wireless Protocol v3 (LWP3)",
        "Yes, you need to flash a custom Linux kernel",
        "No, it only connects using an HDMI cable",
      ],
      correctIndex: 1,
      explanation: "OmniBrick speaks standard LEGO LWP3 protocol directly over Web Bluetooth, keeping your LEGO hub completely stock.",
    },
    starterBuildId: "build-red-cube-hunter",
  },
  {
    id: "lesson-revenuecat-economy",
    category: "Getting Started",
    title: "RevenueCat Paywalls & Bricks Economy",
    duration: "5 min",
    rewardBricks: 150,
    description: "How OmniBrick implements in-app purchases, entitlement gating, and creator royalties for Shipathon 2026.",
    summary: "For the RevenueCat Shipathon 2026, OmniBrick combines subscription tiers with an in-app Bricks 🧱 economy. Entitlements gate advanced features like Unlimited Multimodal Cloud Vision, while Bricks reward learning and empower community marketplace trade.",
    bulletPoints: [
      "RevenueCat Purchases SDK gates 'pro_features' and 'neural_nexus_pro' entitlements.",
      "Bricks 🧱 are earned by completing Academy quizzes and publishing popular builds.",
      "Creators receive a 70% royalty on all community forks and downloads.",
    ],
    codeExample: `// RevenueCat Entitlement Check:
const { customerInfo } = await Purchases.getCustomerInfo();
const isPro = customerInfo.entitlements.active["pro_features"] !== undefined;`,
    quiz: {
      question: "How do creators earn Bricks 🧱 in the OmniBrick ecosystem?",
      options: [
        "By manually clicking the battery indicator 10,000 times",
        "By publishing builds to the Marketplace where other pilots fork them with 70% royalty share",
        "By deleting their robot configuration files",
        "Bricks cannot be earned, only purchased with real cash",
      ],
      correctIndex: 1,
      explanation: "Creators monetize their robot designs, prompts, and MCP tool bundles with real community royalties!",
    },
    starterBuildId: "build-red-cube-hunter",
  },
];

export default function AcademyPage() {
  const nav = useNavigate();
  const { pilot, addBricks } = useSubscription();
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("omnibrick_completed_lessons");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const categories = [
    "All",
    "Getting Started",
    "Build Robots",
    "AI & Agents",
    "MCP",
  ];

  const filteredLessons = ACADEMY_LESSONS.filter(
    (l) => activeCategory === "All" || l.category === activeCategory
  );

  const handleOpenLesson = (l: AcademyLesson) => {
    setSelectedLesson(l);
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
  };

  const handleClaimReward = (l: AcademyLesson) => {
    if (completedLessonIds.has(l.id)) return;

    addBricks(l.rewardBricks);
    const updated = new Set(completedLessonIds).add(l.id);
    setCompletedLessonIds(updated);
    localStorage.setItem("omnibrick_completed_lessons", JSON.stringify(Array.from(updated)));
    alert(`🎉 Congratulations! You earned +${l.rewardBricks} Bricks 🧱! Your wallet has been updated.`);
  };

  const handleOpenInBuild = (starterBuildId?: string) => {
    if (starterBuildId) {
      nav(`/build?edit=${starterBuildId}`);
    } else {
      nav("/build");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <PageOverviewBanner
          title="Академия робототехники"
          badge={`${ACADEMY_LESSONS.length} уроков • +950 🧱`}
          description="Обучающие модули по мобильному ИИ, кинематике роботов, MCP протоколам и экономике Shipathon 2026 с наградами в Bricks."
          actionButton={{
            label: "Перейти в маркет",
            to: "/marketplace",
          }}
        />
      </div>

      {/* Top Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Robotics Academy
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              Master mobile AI robotics, hardware abstraction, and MCP tool engineering. Earn Bricks 🧱 as you learn.
            </p>
          </div>

          {/* Wallet progress */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-2xl">🧱</span>
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">Available Balance</div>
              <div className="text-base font-black text-amber-300 font-mono">
                {pilot.bricksBalance.toLocaleString()} 🧱
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs (Section 20) */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredLessons.map((lesson) => {
            const isCompleted = completedLessonIds.has(lesson.id);

            return (
              <div
                key={lesson.id}
                className={`group relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? "bg-slate-900/40 border-emerald-500/30"
                    : "bg-slate-900/70 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/90 shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {lesson.category}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5 group-hover:text-indigo-300 transition-colors">
                        {lesson.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 shrink-0">
                      <span>+{lesson.rewardBricks}</span>
                      <span>🧱</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {lesson.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lesson.duration}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 font-mono">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenLesson(lesson)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                      >
                        Start Lesson
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE LESSON MODAL / DRAWER (Section 20) */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedLesson.category}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">{selectedLesson.title}</h2>
              </div>
              <button
                onClick={() => setSelectedLesson(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Lesson Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs leading-relaxed text-slate-300 pr-1">
              <p className="text-sm font-medium text-slate-200">{selectedLesson.summary}</p>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Key Principles:</h4>
                {selectedLesson.bulletPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              {selectedLesson.codeExample && (
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Architecture Blueprint:</span>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/20 text-indigo-200 font-mono text-xs overflow-x-auto leading-relaxed">
                    {selectedLesson.codeExample}
                  </pre>
                </div>
              )}

              {/* Interactive Quiz / Challenge */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Knowledge Check (+{selectedLesson.rewardBricks} 🧱)
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-200">{selectedLesson.quiz.question}</p>

                <div className="space-y-2">
                  {selectedLesson.quiz.options.map((opt, idx) => {
                    const isSelected = selectedQuizAnswer === idx;
                    const isCorrect = idx === selectedLesson.quiz.correctIndex;

                    let btnStyle = "bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-400";
                    if (quizSubmitted) {
                      if (isCorrect) btnStyle = "bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold";
                      else if (isSelected && !isCorrect) btnStyle = "bg-red-950/50 border-red-500 text-red-200";
                    } else if (isSelected) {
                      btnStyle = "bg-indigo-950/60 border-indigo-400 text-white font-semibold";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={quizSubmitted}
                        onClick={() => setSelectedQuizAnswer(idx)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <p className="text-xs text-indigo-200 bg-indigo-950/60 p-2.5 rounded-lg border border-indigo-500/30">
                    💡 {selectedLesson.quiz.explanation}
                  </p>
                )}

                {!quizSubmitted ? (
                  <button
                    disabled={selectedQuizAnswer === null}
                    onClick={() => {
                      setQuizSubmitted(true);
                      if (selectedQuizAnswer === selectedLesson.quiz.correctIndex) {
                        handleClaimReward(selectedLesson);
                      }
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedLesson(null);
                        handleOpenInBuild(selectedLesson.starterBuildId);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Build Studio
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

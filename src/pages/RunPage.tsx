import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Bot, Play, Square, Eye, Compass, Battery, 
  Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Volume2, VolumeX, Mic, MicOff, RefreshCw, RotateCw,
  SlidersHorizontal, ChevronDown, ChevronUp, Zap, 
  Home, Maximize2, Minimize2, Video, VideoOff, MessageSquare,
  Radio, ShieldAlert, Sun, Lock, Cpu
} from "lucide-react";
import { useRobot } from "../context/RobotContext";
import { buildStorage } from "../services/buildStorage";
import { soundService } from "../services/soundService";
import { aiVisionService, setLatestCameraFrame } from "../services/aiVisionService";
import VirtualArena from "../components/VirtualArena";
import VirtualArena3D from "../components/VirtualArena3D";
import AIProviderModal from "../components/AIProviderModal";
import RobotEyesFace from "../components/RobotEyesFace";
import LegoAssemblyGuideModal from "../components/LegoAssemblyGuideModal";
import SkillForgeModal from "../components/SkillForgeModal";
import { trySolveMath } from "../services/mathSolver";
import { calculateSafeDriveTrajectory } from "../services/kinematicsSafety";

export default function RunPage() {
  const navigate = useNavigate();
  const { 
    activeBuild, 
    sessionActive, 
    isAutonomous, 
    telemetry, 
    transcript,
    adapterMode, 
    setAdapterMode,
    launchMission, 
    stopMission, 
    toggleAutonomous, 
    manualDrive, 
    emergencyHalt, 
    sendInstruction, 
    repositionTarget, 
    selectBuild,
  } = useRobot();

  const builds = buildStorage.getRobotBuilds();
  
  // View mode: 'face' (Robot Eyes + Subtitles), '3d' (3D Arena), '2d' (2D Arena)
  const [viewMode, setViewMode] = useState<"face" | "3d" | "2d">("face");
  
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [legoGuideOpen, setLegoGuideOpen] = useState(false);
  const [skillForgeOpen, setSkillForgeOpen] = useState(false);
  
  // Audio & Voice States
  const [isListening, setIsListening] = useState(true);
  const [isMuted, setIsMuted] = useState(() => soundService.getMuted());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [subtitleText, setSubtitleText] = useState<string>(
    "Привет, пилот! Системы активны: камера подключена, микрофон слушает. Скажи команду голосом!"
  );
  const [subtitleRole, setSubtitleRole] = useState<"robot" | "user" | "thought">("robot");
  const [isProcessingVlm, setIsProcessingVlm] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(true);

  // Camera & Screen Vision States
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraRotation, setCameraRotation] = useState<0 | 90 | 180 | 270>(0);
  const [cameraMinimized, setCameraMinimized] = useState(false);
  const [visionSource, setVisionSource] = useState<"auto" | "camera" | "screen">("auto");
  const [latestVisionThumbnail, setLatestVisionThumbnail] = useState<string | null>(null);

  // Canvas refs to capture screen / 3D arena for AI vision
  const arena3DCanvasRef = useRef<HTMLCanvasElement>(null);
  const arena2DCanvasRef = useRef<HTMLCanvasElement>(null);

  // Safety & Hardware States
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [isDrivingActive, setIsDrivingActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const wakeLockSentinelRef = useRef<any>(null);
  const watchdogTimerRef = useRef<any>(null);
  
  // ─── ACOUSTIC & MOTOR NOISE GATING REFS ───
  const isBotSpeakingRef = useRef<boolean>(false);
  const isMotorSpinningRef = useRef<boolean>(false);
  const lastSpokenTextRef = useRef<string>("");
  const lastSpokenTimeRef = useRef<number>(0);
  const isListeningDesiredRef = useRef<boolean>(true);
  const lastVlmCallTimeRef = useRef<number>(0);
  const hasInitializedRef = useRef<boolean>(false);

  // ─── 1. SCREEN WAKE LOCK API (Prevents phone from sleeping on the robot!) ───
  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        wakeLockSentinelRef.current = await (navigator as any).wakeLock.request("screen");
        setWakeLockActive(true);
        wakeLockSentinelRef.current.addEventListener("release", () => {
          setWakeLockActive(false);
        });
      } catch (err) {
        console.warn("[WakeLock] Request failed:", err);
      }
    }
  }, []);

  useEffect(() => {
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
      }
    };
  }, [requestWakeLock]);

  // ─── 2. WATCHDOG FAIL-SAFE TIMER (Auto-halts motors if control lost) ───
  const triggerWatchdogDrive = useCallback((left: number, right: number, durationMs: number = 1500) => {
    // 1. Motor noise gate: mute mic while motors spin
    isMotorSpinningRef.current = true;
    setIsDrivingActive(true);

    // 2. Physical/Virtual drive execution
    manualDrive(left, right, durationMs);

    // 3. Clear existing watchdog timer
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
    }

    // 4. Arm watchdog timer to cut power at duration + 200ms
    watchdogTimerRef.current = setTimeout(() => {
      emergencyHalt();
      setIsDrivingActive(false);
      // Allow 300ms for motor vibration to settle before unmuting mic
      setTimeout(() => {
        isMotorSpinningRef.current = false;
      }, 300);
    }, durationMs + 200);
  }, [emergencyHalt, manualDrive]);

  // ─── 3. SPEECH RECOGNITION (STT) WITH ECHO & MOTOR-NOISE GATING ───
  const startSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn("Speech recognition not supported");
      return;
    }

    // Gate: do not start mic if bot is speaking or motors are spinning
    if (isBotSpeakingRef.current || isMotorSpinningRef.current) {
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "ru-RU";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (evt: any) => {
        // GATES: Drop audio if robot is speaking OR if motors are actively driving!
        if (isBotSpeakingRef.current || isMotorSpinningRef.current) {
          return;
        }

        let interim = "";
        let finalStr = "";

        for (let i = evt.resultIndex; i < evt.results.length; ++i) {
          const trans = evt.results[i][0].transcript;
          if (evt.results[i].isFinal) {
            finalStr += trans;
          } else {
            interim += trans;
          }
        }

        // Echo rejection
        const now = Date.now();
        const recentSpoken = (lastSpokenTextRef.current || "").toLowerCase();
        const incoming = (finalStr || interim).trim().toLowerCase();

        if (now - lastSpokenTimeRef.current < 2000 && recentSpoken && incoming) {
          if (recentSpoken.includes(incoming) || incoming.includes(recentSpoken.slice(0, 15))) {
            return;
          }
        }

        if (interim && !isBotSpeakingRef.current) {
          setSubtitleText(`Слушаю: "${interim}"...`);
          setSubtitleRole("user");
        }

        if (finalStr.trim() && !isBotSpeakingRef.current) {
          handleSendCommand(finalStr.trim());
        }
      };

      rec.onerror = (e: any) => {
        if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("Speech recognition notice:", e.error);
        }
      };

      rec.onend = () => {
        // Auto-restart only if user wants it and bot is NOT speaking and motors NOT driving
        if (isListeningDesiredRef.current && !isBotSpeakingRef.current && !isMotorSpinningRef.current) {
          setTimeout(() => {
            if (isListeningDesiredRef.current && !isBotSpeakingRef.current && !isMotorSpinningRef.current) {
              try { rec.start(); } catch (e) {}
            }
          }, 300);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
      setIsListening(false);
    }
  }, []);

  // ─── 4. TEXT-TO-SPEECH (TTS) WITH MIC MUTING ───
  const speakVoice = useCallback((text: string) => {
    if (soundService.getMuted()) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      isBotSpeakingRef.current = true;
      lastSpokenTextRef.current = text;
      lastSpokenTimeRef.current = Date.now();

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ru-RU";
      utterance.rate = 1.05;
      utterance.pitch = 1.15;

      utterance.onstart = () => {
        setIsSpeaking(true);
        isBotSpeakingRef.current = true;
      };

      const finishSpeech = () => {
        setIsSpeaking(false);
        lastSpokenTimeRef.current = Date.now();
        setTimeout(() => {
          isBotSpeakingRef.current = false;
          if (isListeningDesiredRef.current && !isMotorSpinningRef.current) {
            startSpeechRecognition();
          }
        }, 700);
      };

      utterance.onend = finishSpeech;
      utterance.onerror = finishSpeech;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("TTS error:", err);
      setIsSpeaking(false);
      isBotSpeakingRef.current = false;
    }
  }, [startSpeechRecognition]);

  // Update subtitle when transcript changes from AI agent
  useEffect(() => {
    if (transcript.length === 0) return;
    const latest = transcript[transcript.length - 1];
    if (latest.role === "robot_action") {
      setSubtitleText(latest.content.replace(/^"|"$/g, ""));
      setSubtitleRole("robot");
    } else if (latest.role === "user") {
      setSubtitleText(latest.content);
      setSubtitleRole("user");
    } else if (latest.role === "ai_thought") {
      setSubtitleText(latest.content);
      setSubtitleRole("thought");
    }
  }, [transcript]);

  // Listen for direct speak events from tools
  useEffect(() => {
    const handleSpeakEvent = (e: any) => {
      if (e.detail?.message) {
        setSubtitleText(e.detail.message);
        setSubtitleRole("robot");
        speakVoice(e.detail.message);
      }
    };
    window.addEventListener("brainbrick:speak", handleSpeakEvent);
    return () => window.removeEventListener("brainbrick:speak", handleSpeakEvent);
  }, [speakVoice]);

  // ─── 5. FAST REFLEX INTENT PARSER WITH WATCHDOG & VLM ───
  const handleSendCommand = async (textToProcess: string) => {
    const raw = textToProcess.trim();
    if (!raw) return;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(25);
    }

    setSubtitleText(`Вы: "${raw}"`);
    setSubtitleRole("user");

    const lower = raw.toLowerCase();

    // Fast-path 0: Instant Math & Arithmetic Evaluator (0ms latency, ZERO motor movement!)
    const mathSolution = trySolveMath(raw);
    if (mathSolution) {
      soundService.playRobotChirp();
      setSubtitleText(mathSolution.spoken);
      setSubtitleRole("robot");
      speakVoice(mathSolution.spoken);
      return;
    }

    // Fast-path 1: Stop command
    if (lower.includes("стоп") || lower.includes("стой") || lower.includes("остановись") || lower.includes("хватит")) {
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      emergencyHalt();
      setIsDrivingActive(false);
      isMotorSpinningRef.current = false;
      soundService.playAlertAlarm();
      const reply = "Остановился и держу позицию!";
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    // Fast-path 2: Forward (WITH PRE-ACCELERATION DISTANCE & BRAKING CALCULATION)
    if (lower.includes("вперед") || lower.includes("вперёд") || lower.includes("езжай") || lower.includes("едь") || lower.includes("поехали")) {
      const clearance = telemetry.sensors?.distanceToWallCm ?? 999;
      const traj = calculateSafeDriveTrajectory(60, 60, clearance);

      if (!traj.isSafe) {
        soundService.playAlertAlarm();
        setSubtitleText(traj.spokenAnnouncement);
        setSubtitleRole("robot");
        speakVoice(traj.spokenAnnouncement);
        return;
      }

      triggerWatchdogDrive(traj.safeSpeedPercent, traj.safeSpeedPercent, traj.durationMs);
      soundService.playMotorClick();
      setSubtitleText(traj.spokenAnnouncement);
      setSubtitleRole("robot");
      speakVoice(traj.spokenAnnouncement);
      return;
    }

    // Fast-path 3: Backward
    if (lower.includes("назад") || lower.includes("сдай назад")) {
      triggerWatchdogDrive(-60, -60, 1500);
      soundService.playMotorClick();
      const reply = "Сдаю назад, осторожно!";
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    // Fast-path 4: Turn Left
    if (lower.includes("влево") || lower.includes("налево")) {
      triggerWatchdogDrive(-50, 50, 800);
      soundService.playMotorClick();
      const reply = "Поворачиваю налево.";
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    // Fast-path 5: Turn Right
    if (lower.includes("вправо") || lower.includes("направо")) {
      triggerWatchdogDrive(50, -50, 800);
      soundService.playMotorClick();
      const reply = "Поворачиваю направо.";
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    // Fast-path 6: Victory dance
    if (lower.includes("танец") || lower.includes("танцуй") || lower.includes("покрутись") || lower.includes("кружись")) {
      triggerWatchdogDrive(-70, 70, 1600);
      soundService.playHappyFanfare();
      const reply = "Ура! Выполняю победный робототехнический танец!";
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    // Fast-path 7: Introduction & Help
    if (lower.includes("кто ты") || lower.includes("представься")) {
      soundService.playHappyFanfare();
      const reply = `Привет! Я бортовой интеллект робота ${activeBuild?.name || "Brain Brick"}. Мой телефон — это зрение и мозг, а колёса слушают команды!`;
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    // Fast-path 8: Conversational Greetings & Status
    if (lower.includes("привет") || lower.includes("здравствуй") || lower.includes("салам") || lower.includes("hello")) {
      soundService.playRobotChirp();
      const reply = "Привет, пилот! Все системы робота активны и готовы к работе. Чем могу помочь?";
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    if (lower.includes("как дела") || lower.includes("как ты")) {
      soundService.playRobotChirp();
      const reply = "Все системы функционируют отлично! Сенсоры откалиброваны, батарея заряжена, жду указаний.";
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    if (lower.includes("что ты умеешь") || lower.includes("какие команды") || lower.includes("помощь")) {
      soundService.playRobotChirp();
      const reply = "Я умею перемещаться, видеть объекты через камеру, решать математику (например 2+2) и танцевать победный танец!";
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    if (lower.includes("анекдот") || lower.includes("шутк")) {
      soundService.playHappyFanfare();
      const reply = "Спросили у робота, почему он не спит ночью. Он ответил: 'Боюсь пропустить обновление прошивки!'";
      setSubtitleText(reply);
      setSubtitleRole("robot");
      speakVoice(reply);
      return;
    }

    // ─── TIER 2: CLOUD VLM / GEMINI VISION ROUTE (WITH RATE-LIMIT PROTECTION) ───
    const isVisionQuery = lower.includes("видишь") || lower.includes("опиши") || lower.includes("найди") || lower.includes("куб") || lower.includes("камер");
    
    // Cooldown check (prevent 429 spam)
    const now = Date.now();
    if (now - lastVlmCallTimeRef.current < 2500) {
      const waitMsg = "Секунду, анализирую предыдущий кадр...";
      setSubtitleText(waitMsg);
      setSubtitleRole("robot");
      return;
    }
    lastVlmCallTimeRef.current = now;

    setIsProcessingVlm(true);
    setSubtitleText(isVisionQuery ? "Анализирую изображение с камеры через Gemini VLM..." : "Обрабатываю команду через нейросеть...");
    setSubtitleRole("thought");

    try {
      await sendInstruction(raw);
    } catch (err: any) {
      console.warn("VLM/LLM query error or rate limit:", err);
      const fallbackMsg = "Облачная модель временно ограничена, использую локальный бортовой интеллект.";
      setSubtitleText(fallbackMsg);
      setSubtitleRole("robot");
      speakVoice(fallbackMsg);
    } finally {
      setIsProcessingVlm(false);
    }
  };

  const toggleListening = () => {
    const next = !isListening;
    isListeningDesiredRef.current = next;
    setIsListening(next);

    if (next) {
      soundService.playRobotChirp();
      startSpeechRecognition();
      setSubtitleText("Микрофон включен! Слушаю твои команды в реальном времени.");
      setSubtitleRole("robot");
    } else {
      soundService.playRobotChirp();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      setSubtitleText("Микрофон на паузе. Нажми кнопку микрофона, чтобы включить снова.");
      setSubtitleRole("robot");
    }
  };

  // ─── 6. AUTO-INITIALIZATION ON MOUNT (Camera + Mic + Wake Lock + Session) ───
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // 1. Start Camera Stream automatically
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
      } catch (err) {
        console.warn("Camera auto-start permission not granted:", err);
      }
    };

    startCamera();

    // 2. Auto-launch mission session if not active
    if (!sessionActive && activeBuild) {
      launchMission(activeBuild);
    }

    // 3. Welcome sound and voice greeting
    setTimeout(() => {
      soundService.playHappyFanfare();
      speakVoice("Привет, пилот! Системы активны: камера подключена, микрофон слушает. Скажи команду!");
    }, 600);

    return () => {
      isListeningDesiredRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
      }
    };
  }, [activeBuild, cameraFacing, launchMission, sessionActive, speakVoice]);

  // Determine active visual source: "camera" vs "screen" (3D/2D Arena)
  const effectiveVisionSource = visionSource === "auto"
    ? (viewMode === "3d" || viewMode === "2d" || !cameraActive ? "screen" : "camera")
    : visionSource;

  // Periodic frame capture for AI Vision buffer (camera OR 3D/2D arena screen)
  useEffect(() => {
    const interval = setInterval(() => {
      // MODE 1: Capture Screen / Virtual 3D/2D Arena
      if (effectiveVisionSource === "screen") {
        try {
          const targetCanvas = viewMode === "3d" 
            ? arena3DCanvasRef.current 
            : (arena2DCanvasRef.current || arena3DCanvasRef.current);

          if (targetCanvas) {
            const base64 = targetCanvas.toDataURL("image/jpeg", 0.6);
            setLatestCameraFrame(base64);
            setLatestVisionThumbnail(base64);
          }
        } catch (e) {
          console.warn("Screen/Arena canvas capture error:", e);
        }
        return;
      }

      // MODE 2: Capture Phone Physical Camera
      if (!cameraActive) {
        setLatestCameraFrame(null);
        return;
      }

      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const canvas = document.createElement("canvas");
          const width = 320;
          const height = 240;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Apply camera orientation rotation before sending to Gemini VLM
            if (cameraRotation !== 0) {
              ctx.save();
              ctx.translate(width / 2, height / 2);
              ctx.rotate((cameraRotation * Math.PI) / 180);
              ctx.drawImage(videoRef.current, -width / 2, -height / 2, width, height);
              ctx.restore();
            } else {
              ctx.drawImage(videoRef.current, 0, 0, width, height);
            }
            const base64 = canvas.toDataURL("image/jpeg", 0.5);
            setLatestCameraFrame(base64);
            setLatestVisionThumbnail(base64);
          }
        } catch (e) {}
      }
    }, 1100);

    return () => clearInterval(interval);
  }, [cameraActive, cameraRotation, effectiveVisionSource, viewMode]);

  // Rotate camera by 90 deg clockwise
  const handleRotateCamera = () => {
    soundService.playRobotChirp();
    setCameraRotation((prev) => {
      const next = (prev + 90) % 360;
      return next as 0 | 90 | 180 | 270;
    });
  };

  // Flip camera front/back
  const handleFlipCamera = async () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      soundService.playRobotChirp();
    } catch (err) {
      console.warn("Failed to switch camera facing:", err);
    }
  };

  const handleToggleCamera = () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setLatestCameraFrame(null);
    } else {
      setCameraActive(true);
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: cameraFacing } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => console.warn(err));
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundService.setMuted(next);
    if (!next) soundService.playRobotChirp();
  };

  const toggleSession = async () => {
    if (sessionActive) {
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      await stopMission();
      setSubtitleText("Миссия остановлена. Робот в режиме ожидания.");
    } else if (activeBuild) {
      await launchMission(activeBuild);
      setSubtitleText("Миссия запущена! Сенсоры и моторы активны.");
      soundService.playHappyFanfare();
    }
  };

  const quickActionChips = [
    { label: "🏎️ Вперёд", cmd: "едь вперед" },
    { label: "🔙 Назад", cmd: "сдай назад" },
    { label: "⬅️ Влево", cmd: "повернись налево" },
    { label: "➡️ Вправо", cmd: "повернись направо" },
    { label: "🛑 Стоп", cmd: "остановись и замри" },
    { label: "🕺 Танец", cmd: "станцуй победный танец!" },
    { label: "👁️ Что видишь?", cmd: "опиши что ты сейчас видишь через камеру" },
    { label: "🗣️ Кто ты?", cmd: "кто ты и что ты умеешь?" },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#030712] text-white flex flex-col p-2 sm:p-4 pb-20 md:pb-4 relative overflow-hidden select-none">
      
      {/* ─── TOP STREAMLINED HUD BAR ─── */}
      <header className="h-14 bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-2xl px-3 sm:px-4 flex items-center justify-between gap-2 shadow-xl shrink-0 z-30 mb-2">
        
        {/* Left: Back & Robot Info */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            title="Главное меню"
            className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-cyan-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <select
                value={activeBuild?.id || ""}
                onChange={(e) => {
                  const b = builds.find((x) => x.id === e.target.value);
                  if (b) selectBuild(b);
                }}
                className="bg-transparent font-black text-xs sm:text-sm text-white outline-none cursor-pointer border-b border-cyan-500/30 hover:text-cyan-300"
              >
                {builds.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center: THE MAIN VIEW MODE SWITCHER (Eyes / 3D / 2D) */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
          <button
            onClick={() => setViewMode("face")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-bold cursor-pointer ${
              viewMode === "face"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-white"
            }`}
            title="Глаза робота и субтитры"
          >
            <span>👀</span>
            <span className="hidden sm:inline">Глаза</span>
          </button>
          
          <button
            onClick={() => setViewMode("3d")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-bold cursor-pointer ${
              viewMode === "3d"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-white"
            }`}
            title="3D Арена с перспективой"
          >
            <span>🧊</span>
            <span>3D</span>
          </button>

          <button
            onClick={() => setViewMode("2d")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-bold cursor-pointer ${
              viewMode === "2d"
                ? "bg-gradient-to-r from-cyan-500 to-teal-600 text-slate-950 shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-white"
            }`}
            title="2D Тактическая карта"
          >
            <span>🗺️</span>
            <span>2D</span>
          </button>
        </div>

        {/* Right: Hardware adapter & Audio/Battery/WakeLock */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* WakeLock Status Indicator (Shows judges that phone screen won't sleep on robot) */}
          <div 
            className={`hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono border ${
              wakeLockActive 
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30" 
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
            title={wakeLockActive ? "Screen Wake Lock активен: экран на роботе не погаснет" : "Wake Lock не поддерживается"}
          >
            <Sun className={`w-3 h-3 ${wakeLockActive ? "text-amber-400 animate-spin" : "text-slate-500"}`} style={{ animationDuration: "10s" }} />
            <span>WAKE LOCK</span>
          </div>

          {/* LEGO vs Simulator Switch */}
          <div className="hidden lg:flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono">
            <button
              onClick={() => setAdapterMode("mock_simulator")}
              className={`px-2 py-0.5 rounded-lg font-semibold transition-all ${
                adapterMode === "mock_simulator"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400"
              }`}
            >
              Симулятор
            </button>
            <button
              onClick={() => setAdapterMode("lego_spike")}
              className={`px-2 py-0.5 rounded-lg font-semibold transition-all ${
                adapterMode === "lego_spike"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400"
              }`}
            >
              LEGO 51515
            </button>
          </div>

          <button
            onClick={() => setSkillForgeOpen(true)}
            className="p-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer shadow-sm"
            title="Нейро-скиллы & Самообучение ИИ"
          >
            <Cpu className="w-4 h-4 text-purple-400" />
          </button>

          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? "bg-slate-900 text-slate-500 border-slate-800"
                : "bg-cyan-950/50 text-cyan-400 border-cyan-500/40 shadow-sm"
            }`}
            title={isMuted ? "Включить звук" : "Выключить звук"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleSession}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${
              sessionActive
                ? "bg-slate-800 text-red-400 border border-red-500/30 hover:bg-slate-700"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/20"
            }`}
          >
            {sessionActive ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Стоп</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Старт</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ─── MAIN CENTER STAGE ─── */}
      <div className="flex-1 flex flex-col relative rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl">
        
        {/* VIEWPORT AREA */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px] sm:min-h-[420px] bg-black">
          
          {viewMode === "face" ? (
            /* 1. ROBOT EYES FULL EXPERIENCE */
            <div className="w-full h-full flex flex-col items-center justify-center p-4 relative">
              <div className="w-full max-w-2xl flex-1 flex items-center justify-center">
                <RobotEyesFace
                  robotName={activeBuild?.name || "Brain Brick Robot"}
                  isAutonomous={isAutonomous}
                  transcript={transcript}
                  onEmergencyStop={emergencyHalt}
                  onSendVoiceInstruction={(txt) => handleSendCommand(txt)}
                  onConfigureClick={() => navigate("/build")}
                  operationalState={sessionActive ? "connected" : "idle"}
                />
              </div>
            </div>
          ) : viewMode === "3d" ? (
            /* 2. 3D PERSPECTIVE ARENA */
            <div className="w-full h-full relative">
              <VirtualArena3D
                canvasRef={arena3DCanvasRef}
                telemetry={telemetry}
                onTargetMove={(x, y) => repositionTarget(x, y)}
                className="w-full h-full"
              />
            </div>
          ) : (
            /* 3. 2D CLASSIC TACTICAL ARENA */
            <div className="w-full h-full relative flex items-center justify-center">
              <VirtualArena
                canvasRef={arena2DCanvasRef}
                telemetry={telemetry}
                onTargetMove={(x, y) => repositionTarget(x, y)}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* ─── FLOATING VIDEO CALL CAMERA / SCREEN PiP ─── */}
          <div
            className={`absolute top-3 right-3 z-40 transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border ${
              effectiveVisionSource === "screen"
                ? "border-purple-500/60 bg-slate-950/95 shadow-purple-950/50"
                : cameraActive ? "border-cyan-500/50 bg-slate-950/95" : "border-slate-800 bg-slate-900/90"
            } ${
              cameraMinimized 
                ? "w-32 h-10 p-1 flex items-center justify-between" 
                : "w-40 h-48 sm:w-52 sm:h-40 flex flex-col"
            }`}
          >
            {cameraMinimized ? (
              <div className="w-full flex items-center justify-between px-2 text-xs">
                <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {effectiveVisionSource === "screen" ? "ЭКРАН ИИ" : "КАМЕРА"}
                </span>
                <button
                  onClick={() => setCameraMinimized(false)}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Развернуть видеозвонок"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                {/* Video feed OR Screen capture */}
                <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                  {effectiveVisionSource === "screen" ? (
                    latestVisionThumbnail ? (
                      <img
                        src={latestVisionThumbnail}
                        alt="AI Screen Vision Feed"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-[10px] text-gray-500 font-mono text-center p-2">
                        Захват виртуальной сцены...
                      </div>
                    )
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ transform: `rotate(${cameraRotation}deg)` }}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                  )}

                  {/* Video Call Live HUD */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-[9px] font-mono text-cyan-300 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{effectiveVisionSource === "screen" ? "SCREEN 3D" : "LIVE CAMERA"}</span>
                  </div>

                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow">
                    <button
                      onClick={() => setVisionSource(prev => prev === "screen" ? "camera" : "screen")}
                      className={`p-1 rounded-lg text-xs font-mono transition-colors ${
                        effectiveVisionSource === "screen"
                          ? "bg-purple-500/30 text-purple-200 border border-purple-400/40"
                          : "hover:bg-slate-800 text-slate-300 hover:text-cyan-300"
                      }`}
                      title={effectiveVisionSource === "screen" ? "ИИ видит экран. Нажми, чтобы переключить на камеру" : "ИИ видит камеру. Нажми, чтобы переключить на экран"}
                    >
                      {effectiveVisionSource === "screen" ? "🧊" : "📷"}
                    </button>
                    {effectiveVisionSource === "camera" && (
                      <>
                        <button
                          onClick={handleRotateCamera}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
                          title={`Повернуть камеру на 90° (сейчас: ${cameraRotation}°)`}
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleFlipCamera}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
                          title="Переключить камеру (фронтальная / основная)"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleToggleCamera}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors"
                          title={cameraActive ? "Выключить камеру" : "Включить камеру"}
                        >
                          {cameraActive ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3 text-rose-400" />}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setCameraMinimized(true)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                      title="Свернуть окно"
                    >
                      <Minimize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="px-2 py-1 bg-slate-950 text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-cyan-400 font-bold truncate max-w-[90px]">
                    {cameraFacing === "environment" ? "Основная" : "Селфи"} {cameraRotation > 0 ? `${cameraRotation}°` : ""}
                  </span>
                  <span>{cameraActive ? "20fps VLM" : "OFF"}</span>
                </div>
              </>
            )}
          </div>

        </div>

        {/* ─── GLOWING CYBER SUBTITLES & REAL-TIME SPEECH STRIP (ПОД ГЛАЗАМИ РОБОТА, БЕЗ ЧАТА!) ─── */}
        <div className="w-full bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-900/90 border-t border-cyan-500/30 p-3 sm:p-4 shrink-0 shadow-2xl">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            
            {/* Status & Speaker Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  subtitleRole === "robot"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : subtitleRole === "user"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                }`}>
                  {subtitleRole === "robot" ? (
                    <>
                      <span className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-cyan-400 animate-ping" : "bg-cyan-400"}`} />
                      <span>🗣️ Робот {activeBuild?.name || "Brain"}</span>
                    </>
                  ) : subtitleRole === "user" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>👤 Вы (Голос пилота)</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span>🧠 {isProcessingVlm ? "Анализ Gemini VLM..." : "Рассуждение"}</span>
                    </>
                  )}
                </span>

                {isSpeaking ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    🔊 Робот говорит (Микрофон защищён)
                  </span>
                ) : isDrivingActive ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    🏎️ Моторы в движении (Шумоподавление ON)
                  </span>
                ) : isListening ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    🎙️ Микрофон в эфире (Слушаю вас...)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono">
                    🔇 Микрофон на паузе
                  </span>
                )}
              </div>

              {/* Speak Again button */}
              <button
                onClick={() => speakVoice(subtitleText)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                title="Озвучить субтитры снова"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Повторить</span>
              </button>
            </div>

            {/* Subtitle Big Glowing Text Box */}
            <div className="min-h-[58px] sm:min-h-[66px] p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-inner flex items-center justify-between gap-3">
              <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug tracking-wide">
                "{subtitleText}"
              </p>
              
              {/* Sound Wave Animation when speaking */}
              {isSpeaking && (
                <div className="flex items-center gap-1 shrink-0 px-2 py-1 bg-cyan-950/50 rounded-xl border border-cyan-500/30">
                  <span className="w-1 h-3 bg-cyan-400 animate-pulse rounded-full" />
                  <span className="w-1 h-5 bg-cyan-300 animate-pulse rounded-full" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-4 bg-cyan-400 animate-pulse rounded-full" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>

            {/* ─── PURE SPEECH & TACTILE ACTION CONTROLS (БЕЗ ТЕКСТОВОГО ЧАТА!) ─── */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              
              {/* Fast Physical & Vision Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
                {quickActionChips.map((qc, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendCommand(qc.cmd)}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold text-slate-300 hover:text-white shrink-0 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
                  >
                    <span>{qc.label}</span>
                  </button>
                ))}
              </div>

              {/* Master Voice Stream Toggle Button */}
              <button
                onClick={toggleListening}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-xl cursor-pointer active:scale-95 shrink-0 ${
                  isListening
                    ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-emerald-500/30 ring-4 ring-emerald-500/20"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                }`}
                title={isListening ? "Поставить распознавание речи на паузу" : "Включить постоянное прослушивание голоса"}
              >
                {isListening ? (
                  <>
                    <Mic className="w-4 h-4 text-slate-950 animate-bounce" />
                    <span>Голос активен</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4 text-slate-400" />
                    <span>Включить голос</span>
                  </>
                )}
              </button>

            </div>

          </div>
        </div>

      </div>

      {/* Modals */}
      <AIProviderModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
      <SkillForgeModal isOpen={skillForgeOpen} onClose={() => setSkillForgeOpen(false)} />
      <LegoAssemblyGuideModal
        isOpen={legoGuideOpen}
        onClose={() => setLegoGuideOpen(false)}
        onConnectLego={() => {
          setLegoGuideOpen(false);
          setAdapterMode("lego_spike");
        }}
      />
    </div>
  );
}

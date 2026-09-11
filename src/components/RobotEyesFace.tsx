import { useState, useEffect, useRef } from "react";
import { 
  Palette, Sliders, Mic, MicOff, ShieldAlert, 
  Volume2, Settings, Sparkles, Eye, Maximize2, Minimize2
} from "lucide-react";
import type { LiveTranscriptEntry } from "../types";

export type EyeStyle = "bionic_cute" | "cyber_slit" | "pixel_retro" | "sci_fi_orb" | "hunter";
export type EyeColor = "cyan" | "emerald" | "blue" | "amber" | "purple" | "crimson" | "white";
export type EyeState = "idle" | "listening" | "thinking" | "speaking" | "halted";

interface Props {
  robotName: string;
  isAutonomous: boolean;
  transcript: LiveTranscriptEntry[];
  onEmergencyStop: () => void;
  onSendVoiceInstruction: (text: string) => void;
  onConfigureClick?: () => void;
  operationalState?: string;
}

export default function RobotEyesFace({
  robotName,
  isAutonomous,
  transcript,
  onEmergencyStop,
  onSendVoiceInstruction,
  onConfigureClick,
  operationalState = "connected",
}: Props) {
  // Eye customization state (persisted in localStorage)
  const [eyeColor, setEyeColor] = useState<EyeColor>(() => {
    return (localStorage.getItem("bb_eye_color") as EyeColor) || "cyan";
  });
  const [eyeStyle, setEyeStyle] = useState<EyeStyle>(() => {
    return (localStorage.getItem("bb_eye_style") as EyeStyle) || "bionic_cute";
  });
  const [eyeSize, setEyeSize] = useState<number>(() => {
    const saved = localStorage.getItem("bb_eye_size");
    return saved ? parseInt(saved, 10) : 100;
  });

  const [windowWidth, setWindowWidth] = useState(() => 
    typeof window !== "undefined" ? window.innerWidth : 800
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent eyes from clipping into the side stop button on narrow phone screens
  const responsiveEyeSize = windowWidth < 420 
    ? Math.min(eyeSize, 74) 
    : windowWidth < 640 
    ? Math.min(eyeSize, 92) 
    : eyeSize;

  const [eyeState, setEyeState] = useState<EyeState>("idle");
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Subtitle state: latest speech or thought
  const latestSpeech = [...transcript].reverse().find(
    (t) => t.role === "robot_action" || t.role === "ai_thought" || t.role === "user"
  );

  // Color mappings for neon glow
  const colorMap: Record<EyeColor, { bg: string; border: string; glow: string; text: string }> = {
    cyan: { bg: "#06b6d4", border: "#22d3ee", glow: "rgba(6, 182, 212, 0.6)", text: "text-cyan-400" },
    emerald: { bg: "#10b981", border: "#34d399", glow: "rgba(16, 185, 129, 0.6)", text: "text-emerald-400" },
    blue: { bg: "#3b82f6", border: "#60a5fa", glow: "rgba(59, 130, 246, 0.6)", text: "text-blue-400" },
    amber: { bg: "#f59e0b", border: "#fbbf24", glow: "rgba(245, 158, 11, 0.6)", text: "text-amber-400" },
    purple: { bg: "#a855f7", border: "#c084fc", glow: "rgba(168, 85, 247, 0.6)", text: "text-purple-400" },
    crimson: { bg: "#ef4444", border: "#f87171", glow: "rgba(239, 68, 68, 0.7)", text: "text-red-400" },
    white: { bg: "#f8fafc", border: "#e2e8f0", glow: "rgba(248, 250, 252, 0.6)", text: "text-white" },
  };

  const currentColor = operationalState === "error" ? colorMap.crimson : colorMap[eyeColor];

  // Natural blinking & looking around loop
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800 + Math.random() * 2000);

    const lookInterval = setInterval(() => {
      if (eyeState === "idle") {
        const randX = (Math.random() - 0.5) * 26;
        const randY = (Math.random() - 0.5) * 16;
        setLookOffset({ x: randX, y: randY });
      }
    }, 2400);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(lookInterval);
    };
  }, [eyeState]);

  // Sync state with transcripts (when robot speaks or thinks) and custom events
  useEffect(() => {
    if (!latestSpeech) return;
    if (latestSpeech.role === "ai_thought") {
      setEyeState("thinking");
      const t = setTimeout(() => setEyeState("idle"), 1800);
      return () => clearTimeout(t);
    } else if (latestSpeech.role === "robot_action" && (latestSpeech.content.toLowerCase().includes("vocaliz") || latestSpeech.content.toLowerCase().includes("spoke"))) {
      setEyeState("speaking");
      const t = setTimeout(() => setEyeState("idle"), 2400);
      return () => clearTimeout(t);
    }
  }, [latestSpeech]);

  // Direct Event Listeners for Tool Calls (speak_voice & set_robot_eyes)
  useEffect(() => {
    const handleSpeakEvent = (e: any) => {
      setEyeState("speaking");
      const duration = Math.min(6000, Math.max(1800, (e.detail?.message?.length || 20) * 80));
      setTimeout(() => setEyeState("idle"), duration);
    };

    const handleEyesEvent = (e: any) => {
      if (e.detail?.color) setEyeColor(e.detail.color);
      if (e.detail?.mood === "happy") setEyeStyle("bionic_cute");
      else if (e.detail?.mood === "alert") setEyeStyle("hunter");
      else if (e.detail?.mood === "focused") setEyeStyle("cyber_slit");
    };

    window.addEventListener("omnibrick:speak", handleSpeakEvent);
    window.addEventListener("omnibrick:set_eyes", handleEyesEvent);
    return () => {
      window.removeEventListener("omnibrick:speak", handleSpeakEvent);
      window.removeEventListener("omnibrick:set_eyes", handleEyesEvent);
    };
  }, []);

  // Web Speech Recognition for voice commands
  const recognitionRef = useRef<any>(null);
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setEyeState("idle");
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      // Fallback: prompt for text input
      const promptText = window.prompt("Voice recognition not supported in this browser. Enter command:", "Find the red cube");
      if (promptText) onSendVoiceInstruction(promptText);
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "ru-RU"; // Default Russian or English

      rec.onstart = () => {
        setIsListening(true);
        setEyeState("listening");
      };

      rec.onresult = (evt: any) => {
        const text = evt.results[0][0].transcript;
        setIsListening(false);
        setEyeState("thinking");
        onSendVoiceInstruction(text);
      };

      rec.onerror = () => {
        setIsListening(false);
        setEyeState("idle");
      };

      rec.onend = () => {
        setIsListening(false);
        if (eyeState === "listening") setEyeState("idle");
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.warn("Speech recognition error:", e);
      setIsListening(false);
      setEyeState("idle");
    }
  };

  const saveEyeSettings = (color: EyeColor, style: EyeStyle, size: number) => {
    setEyeColor(color);
    setEyeStyle(style);
    setEyeSize(size);
    localStorage.setItem("bb_eye_color", color);
    localStorage.setItem("bb_eye_style", style);
    localStorage.setItem("bb_eye_size", size.toString());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-full h-[520px] md:h-[620px] bg-[#020617] rounded-3xl border border-slate-800 overflow-hidden flex flex-col justify-between p-4 md:p-8 select-none shadow-2xl">
      {/* Background Matrix Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)",
          backgroundSize: "28px 28px"
        }}
      />

      {/* Top Status Bar & Customization Toggle */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-xs font-bold text-white tracking-wide uppercase">
            {robotName}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase">
            {eyeState}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onConfigureClick && (
            <button
              onClick={onConfigureClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors shadow-sm"
              title="Configure Robot Hardware & AI"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Configure</span>
            </button>
          )}

          <button
            onClick={() => setShowControls(!showControls)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showControls
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Eye Customization (Color, Style, Size)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eyes Customizer</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating Customizer Drawer */}
      {showControls && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-slate-900/95 border border-slate-700 backdrop-blur-xl rounded-2xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Customize Robot Eyes Face
            </span>
            <button 
              onClick={() => setShowControls(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Done
            </button>
          </div>

          {/* Color Palette */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Eye Color
            </span>
            <div className="flex items-center gap-2">
              {(Object.keys(colorMap) as EyeColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => saveEyeSettings(c, eyeStyle, eyeSize)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    eyeColor === c ? "scale-125 border-white shadow-lg" : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: colorMap[c].bg, boxShadow: eyeColor === c ? `0 0 12px ${colorMap[c].glow}` : "none" }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Style Selector */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Eye Shape & Style
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: "bionic_cute", label: "Cute Bionic" },
                { id: "cyber_slit", label: "Cyber Visor" },
                { id: "pixel_retro", label: "8-Bit Retro" },
                { id: "sci_fi_orb", label: "Sci-Fi Ring" },
                { id: "hunter", label: "Hunter Focus" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => saveEyeSettings(eyeColor, s.id as EyeStyle, eyeSize)}
                  className={`px-2 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
                    eyeStyle === s.id
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Slider */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Eye Size</span>
              <span>{eyeSize}px</span>
            </div>
            <input
              type="range"
              min={70}
              max={160}
              value={eyeSize}
              onChange={(e) => saveEyeSettings(eyeColor, eyeStyle, parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ─── CENTER: ANIMATED DIGITAL ROBOT EYES ─── */}
      <div className="relative flex-1 flex items-center justify-center my-4">
        {/* The Two Eyes */}
        <div 
          className="flex items-center justify-center transition-transform duration-200 ease-out"
          style={{ 
            gap: `${responsiveEyeSize * 0.45}px`,
            transform: `translate(${lookOffset.x}px, ${lookOffset.y}px)` 
          }}
        >
          {/* Left Eye */}
          <SingleEye 
            style={eyeStyle}
            color={currentColor}
            size={responsiveEyeSize}
            isBlinking={isBlinking}
            eyeState={eyeState}
            isLeft={true}
          />

          {/* Right Eye */}
          <SingleEye 
            style={eyeStyle}
            color={currentColor}
            size={responsiveEyeSize}
            isBlinking={isBlinking}
            eyeState={eyeState}
            isLeft={false}
          />
        </div>
      </div>

      {/* ─── BOTTOM: SUBTITLES & LIVE TRANSCRIPT DISPLAY ─── */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="w-full max-w-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 text-cyan-400 shrink-0 border border-slate-800">
            {latestSpeech?.role === "user" ? (
              <span className="text-sm">👤</span>
            ) : latestSpeech?.role === "robot_action" ? (
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {latestSpeech?.label || "Robot Subtitles"}
              </span>
              {isListening && (
                <span className="text-[9px] font-mono text-cyan-400 animate-pulse">
                  ● Listening to pilot...
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-white font-medium truncate mt-0.5">
              {latestSpeech?.content || "Standing by. Speak or send an instruction..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single Eye Renderer Component ───
function SingleEye({
  style,
  color,
  size,
  isBlinking,
  eyeState,
  isLeft,
}: {
  style: EyeStyle;
  color: { bg: string; border: string; glow: string };
  size: number;
  isBlinking: boolean;
  eyeState: EyeState;
  isLeft: boolean;
}) {
  // Blinking height scale
  const heightScale = isBlinking ? 0.08 : eyeState === "speaking" ? 0.85 : 1;
  const pulseClass = eyeState === "listening" ? "animate-pulse" : "";

  // 1. Cute Bionic Style (Rounded organic eyes with light glare reflection)
  if (style === "bionic_cute") {
    const width = size;
    const height = size * 1.25 * heightScale;
    return (
      <div
        className={`relative transition-all duration-150 rounded-full flex items-center justify-center ${pulseClass}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: color.bg,
          boxShadow: `0 0 ${size * 0.45}px ${color.glow}, inset 0 0 ${size * 0.25}px rgba(255,255,255,0.4)`,
          border: `2px solid ${color.border}`,
          transform: eyeState === "speaking" ? (isLeft ? "rotate(-4deg)" : "rotate(4deg)") : "none",
        }}
      >
        {!isBlinking && (
          <>
            {/* Top Gloss Glare */}
            <div 
              className="absolute top-2 left-3 rounded-full bg-white/90 shadow-sm"
              style={{ width: `${size * 0.28}px`, height: `${size * 0.28}px` }}
            />
            {/* Secondary Gloss Glare */}
            <div 
              className="absolute bottom-3 right-3 rounded-full bg-white/60"
              style={{ width: `${size * 0.14}px`, height: `${size * 0.14}px` }}
            />
          </>
        )}
      </div>
    );
  }

  // 2. Cyber Visor Slit
  if (style === "cyber_slit") {
    const width = size * 1.35;
    const height = (isBlinking ? 4 : eyeState === "listening" ? size * 0.5 : size * 0.35) * heightScale;
    return (
      <div
        className="relative transition-all duration-150 rounded-md overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: color.bg,
          boxShadow: `0 0 ${size * 0.55}px ${color.glow}`,
          border: `2px solid ${color.border}`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
      </div>
    );
  }

  // 3. 8-Bit Pixel Retro Matrix
  if (style === "pixel_retro") {
    const s = Math.round(size * 0.85);
    return (
      <div
        className="grid grid-cols-4 gap-1 transition-all duration-150"
        style={{
          width: `${s}px`,
          height: `${s * heightScale}px`,
          opacity: isBlinking ? 0.2 : 1,
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const isEdge = i === 0 || i === 3 || i === 12 || i === 15;
          return (
            <div
              key={i}
              className="rounded-xs transition-all"
              style={{
                backgroundColor: isEdge ? "transparent" : color.bg,
                boxShadow: isEdge ? "none" : `0 0 6px ${color.glow}`,
              }}
            />
          );
        })}
      </div>
    );
  }

  // 4. Sci-Fi Orb / Ring
  if (style === "sci_fi_orb") {
    return (
      <div
        className="relative rounded-full border-4 flex items-center justify-center transition-all duration-150"
        style={{
          width: `${size}px`,
          height: `${size * heightScale}px`,
          borderColor: color.border,
          boxShadow: `0 0 ${size * 0.4}px ${color.glow}`,
        }}
      >
        <div
          className="rounded-full transition-all"
          style={{
            width: `${size * 0.45}px`,
            height: `${size * 0.45 * heightScale}px`,
            backgroundColor: color.bg,
            boxShadow: `0 0 16px ${color.glow}`,
          }}
        />
      </div>
    );
  }

  // 5. Hunter Focus
  const w = size;
  const h = size * 0.9 * heightScale;
  return (
    <div
      className="relative flex items-center justify-center transition-all duration-150"
      style={{
        width: `${w}px`,
        height: `${h}px`,
      }}
    >
      <div
        className="w-full h-full rounded-tl-3xl rounded-br-3xl transition-all"
        style={{
          backgroundColor: color.bg,
          boxShadow: `0 0 ${size * 0.5}px ${color.glow}`,
          border: `2px solid ${color.border}`,
          transform: isLeft ? "rotate(-10deg)" : "rotate(10deg)",
        }}
      />
    </div>
  );
}

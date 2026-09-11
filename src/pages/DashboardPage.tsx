import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, 
  Play, 
  Activity, 
  Battery, 
  Compass, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Wrench, 
  Radio, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  Cpu,
  Download
} from "lucide-react";
import { useRobot } from "../context/RobotContext";
import { useSubscription } from "../context/SubscriptionContext";
import { buildStorage } from "../services/buildStorage";
import type { LiveTranscriptEntry } from "../types";
import PageOverviewBanner from "../components/PageOverviewBanner";

export default function DashboardPage() {
  const { telemetry, activeBuild, sessionActive, cognitiveLog, transcript } = useRobot();
  const { pilot, isPro } = useSubscription();
  const robotBuilds = buildStorage.getRobotBuilds();
  const allBuilds = buildStorage.getAllBuilds();

  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "activity">("overview");

  const systemLogs = [
    {
      id: "log-1",
      timestamp: "Just now",
      event: "Vision Inference Pass",
      source: "MCP: vision_engine",
      status: "SUCCESS",
      details: "Object 'red cube' tracked in FOV at bearing +12°, dist 180cm",
    },
    {
      id: "log-2",
      timestamp: "1 min ago",
      event: "Differential Actuation",
      source: "HAL: MockRobotAdapter",
      status: "SUCCESS",
      details: "Motors M1=60% M2=60% dispatched for 900ms",
    },
    {
      id: "log-3",
      timestamp: "2 mins ago",
      event: "Build Synthesis",
      source: "AI Engine",
      status: "SUCCESS",
      details: "Synthesized 'Red Cube Hunter' manifest with 2 motors, 2 sensors, camera",
    },
    {
      id: "log-4",
      timestamp: "5 mins ago",
      event: "Session Initialization",
      source: "Engine Core",
      status: "INFO",
      details: "Connected to Virtual 2D differential physics loop (20Hz)",
    },
    {
      id: "log-5",
      timestamp: "12 mins ago",
      event: "RevenueCat Entitlement Check",
      source: "SubscriptionService",
      status: "OK",
      details: "Entitlement verified: Standard Tier active, 1,250 Bricks 🧱 available",
    },
  ];

  const handleExportReport = () => {
    const reportData = {
      app: "Brain Brick",
      pilot: pilot.username,
      callsign: pilot.callsign,
      exportedAt: new Date().toISOString(),
      telemetry,
      activeBuild,
      transcriptCount: transcript.length,
      transcript,
      systemLogs,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brain_brick_mission_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8 text-slate-100">
      <PageOverviewBanner
        title="Центр телеметрии (Dashboard)"
        badge="20 Гц Когнитивный цикл"
        description="Мониторинг сенсоров, логов ИИ принятия решений, состояния приводов M1/M2 и аудит миссий в реальном времени."
        actionButton={{
          label: "В кокпит",
          to: "/run",
        }}
      />
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Mission Dashboard
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Live Core
            </span>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5">
            Pilot {pilot.username} ({pilot.callsign}) • All systems optimal
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            title="Export JSON Mission Audit Report"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Audit Report</span>
          </button>
          <Link
            to="/run"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Open Mission Screen
          </Link>
        </div>
      </div>

      {/* Top Stat Gauges (Section 19: Overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hardware Adapter</span>
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-base font-bold text-white uppercase font-mono">
            {telemetry.adapterMode.replace("_", " ")}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            {sessionActive ? "● Active Link (20Hz)" : "○ Standby Link"}
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Battery Reserve</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-white font-mono">{telemetry.batteryLevel}%</div>
          <div className="text-[10px] text-slate-400 font-mono">Nominal Voltage</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Build Configurations</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-white font-mono">{allBuilds.length} Projects</div>
          <div className="text-[10px] text-indigo-300 font-mono">{robotBuilds.length} Active Robots</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Bricks 🧱 Wallet</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-amber-300 font-mono">
            {pilot.bricksBalance.toLocaleString()} 🧱
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Tier: {isPro ? "PRO (Neural Nexus)" : "Free Standard"}
          </div>
        </div>
      </div>

      {/* Tabs: Overview vs Technical Logs vs Activity */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "overview"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Ecosystem Overview
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "logs"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          System Logs ({systemLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "activity"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Live Activity ({transcript.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Active Robot Profile (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Active Robot Profile</h2>
              </div>
              <Link to="/build" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                <span>View in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeBuild && (
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{activeBuild.name}</h3>
                    <p className="text-xs text-slate-400">{activeBuild.tagline}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    v{activeBuild.version}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Chassis</span>
                    <span className="font-mono text-slate-200 uppercase">{activeBuild.hardware.chassis}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Motors</span>
                    <span className="font-mono text-cyan-300">{activeBuild.hardware.motors.length} Ports</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Capabilities</span>
                    <span className="font-mono text-emerald-300">
                      {activeBuild.capabilities.filter(c => c.enabled).length} Active
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5-Layer Platform Architecture (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white">Brain Brick 5-Layer Stack</h2>
            <p className="text-xs text-slate-400">
              Strictly decoupled architecture built for mobile autonomy and hardware abstraction.
            </p>

            <div className="space-y-1.5 pt-1 text-xs font-mono">
              <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 flex justify-between">
                <span>L1: Mobile UI & Touch Cockpit</span>
                <span className="text-slate-400">React 19 / Tailwind v4</span>
              </div>
              <div className="p-2 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-300 flex justify-between">
                <span>L2: State, Wallet & RevenueCat</span>
                <span className="text-slate-400">Purchases Capacitor SDK</span>
              </div>
              <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 flex justify-between">
                <span>L3: Cognitive Engine & Synthesizer</span>
                <span className="text-slate-400">Prompt-to-Build AI</span>
              </div>
              <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-300 flex justify-between">
                <span>L4: Model Context Protocol (MCP)</span>
                <span className="text-slate-400">Tool Contracts</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex justify-between">
                <span>L5: Robotics Abstraction Layer</span>
                <span className="text-slate-400">Mock Arena (20Hz) / BLE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL LOGS (Section 19: Logs) */}
      {activeTab === "logs" && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Technical Event Logs
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Live system audit stream</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {systemLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 font-semibold text-white whitespace-nowrap">{log.event}</td>
                    <td className="p-3 text-cyan-300 whitespace-nowrap">{log.source}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE ACTIVITY */}
      {activeTab === "activity" && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recent Transcript Events
          </h3>
          <div className="space-y-2">
            {transcript.slice(-10).map((t: LiveTranscriptEntry) => (
              <div key={t.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                  {t.label}
                </span>
                <span className="text-slate-300">{t.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

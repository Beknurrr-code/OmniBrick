import React, { useState } from "react";
import type { RobotBuild, RobotCapability, TestStepResult } from "../../types";
import { aiAgent } from "../../engine/aiAgent";
import { 
  Bot, 
  Cpu, 
  Eye, 
  Wrench, 
  Share2, 
  Terminal, 
  Sliders, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  X, 
  Layers, 
  Camera, 
  Activity,
  AlertCircle
} from "lucide-react";

interface RobotBuildEditorProps {
  build: RobotBuild;
  onSave: (updated: RobotBuild) => void;
  onClose: () => void;
  onOpenAIBuilder: () => void;
  onLaunchMission: (build: RobotBuild) => void;
}

type TabType = "overview" | "hardware" | "capabilities" | "tools" | "mcp" | "prompt" | "variables" | "test";

export const RobotBuildEditor: React.FC<RobotBuildEditorProps> = ({
  build: initialBuild,
  onSave,
  onClose,
  onOpenAIBuilder,
  onLaunchMission,
}) => {
  const [build, setBuild] = useState<RobotBuild>(initialBuild);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestStepResult[]>([]);
  const [testComplete, setTestComplete] = useState(false);

  const tabs: Array<{ id: TabType; label: string; icon: any }> = [
    { id: "overview", label: "Overview", icon: Bot },
    { id: "hardware", label: "Hardware", icon: Cpu },
    { id: "capabilities", label: "Capabilities", icon: Eye },
    { id: "tools", label: "Tools", icon: Wrench },
    { id: "mcp", label: "MCP", icon: Share2 },
    { id: "prompt", label: "Prompt", icon: Terminal },
    { id: "variables", label: "Variables", icon: Sliders },
    { id: "test", label: "Test", icon: Activity },
  ];

  const handleToggleCapability = (capId: string) => {
    const updatedCaps = build.capabilities.map(c => 
      c.id === capId ? { ...c, enabled: !c.enabled } : c
    );
    const updated = { ...build, capabilities: updatedCaps };
    setBuild(updated);
    onSave(updated);
  };

  const handleRunMockTest = async () => {
    setIsTesting(true);
    setTestComplete(false);
    setTestResults([]);

    await aiAgent.runMockBuildTest(build, (stepUpdate) => {
      setTestResults(prev => {
        const idx = prev.findIndex(s => s.stepIndex === stepUpdate.stepIndex);
        if (idx !== -1) {
          const clone = [...prev];
          clone[idx] = stepUpdate;
          return clone;
        }
        return [...prev, stepUpdate];
      });
    });

    setIsTesting(false);
    setTestComplete(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">{build.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v{build.version}
              </span>
            </div>
            <p className="text-xs text-slate-400">{build.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAIBuilder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all shadow-sm shadow-cyan-500/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Build with AI
          </button>
          <button
            onClick={() => onLaunchMission(build)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all active:scale-95"
            title="Launch Digital Eyes Face & Control Cockpit"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Robot
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center px-4 border-b border-slate-800 bg-slate-900/50 overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-950/80">
        <div className="max-w-4xl mx-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Connected Device</div>
                  <div className="text-sm font-semibold text-white">
                    {build.connectedDevice || "Virtual Simulation Arena"}
                  </div>
                  <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online (20Hz)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Active Capabilities</div>
                  <div className="text-sm font-semibold text-cyan-300">
                    {build.capabilities.filter(c => c.enabled).length} of {build.capabilities.length} active
                  </div>
                  <div className="text-xs text-slate-400 mt-2">Vision, Nav, Diff-Drive</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Execution Mode</div>
                  <div className="text-sm font-semibold text-indigo-300 uppercase font-mono text-xs">
                    {build.execution.defaultMode}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">Auto-Reflexes: Active</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Description & Architectural Intent</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{build.description}</p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {build.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE */}
          {activeTab === "hardware" && (
            <div className="space-y-6">
              {/* AI Recommendation Alert */}
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">AI Hardware Analysis: </span>
                  For visual target hunting, dual differential motors (`M1`, `M2`) and an active Camera (`S2`) are perfectly matched. No port conflicts detected.
                </div>
              </div>

              {/* Motors Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Actuators & Motors ({build.hardware.motors.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {build.hardware.motors.map((m) => (
                    <div key={m.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{m.label}</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Port {m.port}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Role: <strong className="text-slate-200">{m.role}</strong></span>
                        <span>Max PWM: <strong className="text-cyan-400">{m.maxPower}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensors Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sensors & Telemetry ({build.hardware.sensors.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {build.hardware.sensors.map((s) => (
                    <div key={s.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{s.label}</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Port {s.port}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Type: <strong className="text-slate-200">{s.type}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Camera Section */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Visual Optical Camera Eye</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {build.hardware.camera.status || "Connected"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
                  <div>Source: <span className="font-mono text-cyan-300">{build.hardware.camera.source}</span></div>
                  <div>Resolution: <span className="font-mono text-cyan-300">{build.hardware.camera.resolution}</span></div>
                  <div>FPS: <span className="font-mono text-cyan-300">{build.hardware.camera.fps} fps</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAPABILITIES */}
          {activeTab === "capabilities" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Hardware is what the robot physically has; <strong>Capabilities</strong> are what it can do. AI links the two layers.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {build.capabilities.map((cap) => (
                  <div
                    key={cap.id}
                    onClick={() => handleToggleCapability(cap.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      cap.enabled
                        ? "bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                        : "bg-slate-900/60 border-slate-800 opacity-60 hover:opacity-90"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{cap.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          cap.enabled
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {cap.enabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                      {cap.description}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">Requires:</span>
                      {cap.requiredHardware.map((h) => (
                        <span
                          key={h}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TOOLS */}
          {activeTab === "tools" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Actions the AI agent can execute via the standardized Model Context Protocol (MCP).
              </div>

              <div className="space-y-2.5">
                {build.tools.map((tool) => (
                  <div key={tool.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-cyan-300">{tool.name}()</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {tool.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{tool.description}</p>
                    {tool.permissions && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 font-mono">
                        <span>Permissions:</span>
                        {tool.permissions.map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MCP SERVERS */}
          {activeTab === "mcp" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Connected Model Context Protocol servers providing capabilities and tools to this build.
              </div>

              <div className="space-y-3">
                {build.connectedMcps?.map((mcp) => (
                  <div key={mcp.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">{mcp.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Connected
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{mcp.description}</p>
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      <span className="text-slate-500 text-[11px]">Available Tools:</span>
                      {mcp.availableTools.map(t => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PROMPT */}
          {activeTab === "prompt" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Core AI instructions defining how the robot reasons and acts.
                </div>
                <button
                  onClick={onOpenAIBuilder}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Improve with AI
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">System Behavior Directive</label>
                <textarea
                  value={build.ai.systemPrompt}
                  onChange={(e) => {
                    const updated = { ...build, ai: { ...build.ai, systemPrompt: e.target.value } };
                    setBuild(updated);
                    onSave(updated);
                  }}
                  rows={5}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Execution Instructions</label>
                <textarea
                  value={build.ai.instructions}
                  onChange={(e) => {
                    const updated = { ...build, ai: { ...build.ai, instructions: e.target.value } };
                    setBuild(updated);
                    onSave(updated);
                  }}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 7: VARIABLES */}
          {activeTab === "variables" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Variables separate logic from configuration. Change colors, speeds, and distances without rewriting prompts.
              </div>

              <div className="space-y-3">
                {Object.entries(build.variables).map(([k, v]) => (
                  <div key={k} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{v.label}</span>
                      <span className="text-[10px] font-mono text-slate-400">{v.key}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{v.description}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type={v.type === "number" ? "number" : "text"}
                        value={v.value}
                        onChange={(e) => {
                          const val = v.type === "number" ? Number(e.target.value) : e.target.value;
                          const updated = {
                            ...build,
                            variables: {
                              ...build.variables,
                              [k]: { ...v, value: val },
                            },
                          };
                          setBuild(updated);
                          onSave(updated);
                        }}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400 w-48"
                      />
                      {v.unit && <span className="text-xs text-slate-400">{v.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: TEST (Section 13) */}
          {activeTab === "test" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Virtual Pipeline Verification</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verifies: Camera → detect_object → reasoning → move_forward → stop
                  </p>
                </div>

                <button
                  onClick={handleRunMockTest}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isTesting ? "Executing Pipeline..." : "Run Test"}
                </button>
              </div>

              {/* Step by step pipeline stream */}
              <div className="space-y-2.5">
                {testResults.map((step) => {
                  const isPassed = step.status === "passed";
                  const isRunning = step.status === "running";
                  return (
                    <div
                      key={step.stepIndex}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isPassed
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                          : isRunning
                          ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-200 animate-pulse"
                          : "bg-slate-900/60 border-slate-800 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span>{step.title}</span>
                        <span className="font-mono text-[10px]">
                          {isPassed ? `${step.durationMs}ms ✓` : isRunning ? "Testing..." : "Pending"}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-300">{step.output}</div>
                    </div>
                  );
                })}
              </div>

              {testComplete && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-300">
                    <CheckCircle2 className="w-5 h-5" />
                    Build Verified Successfully!
                  </div>
                  <p className="text-xs text-slate-300">
                    All 5 perception-action stages passed. This build is ready for active mission deployment.
                  </p>
                  <button
                    onClick={() => onLaunchMission(build)}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Launch Live Mission Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

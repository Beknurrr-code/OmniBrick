import React, { useState } from "react";
import type { RobotBuild, AIBuilderMessage, BuildDiffProposal } from "../../types";
import { aiAgent } from "../../engine/aiAgent";
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Bot, 
  Sliders, 
  Eye, 
  X, 
  Cpu, 
  Plus, 
  Play,
  Layers
} from "lucide-react";

interface AIBuilderWorkspaceProps {
  build: RobotBuild;
  onUpdateBuild: (updated: RobotBuild) => void;
  onClose: () => void;
  onLaunchMission: (build: RobotBuild) => void;
}

export const AIBuilderWorkspace: React.FC<AIBuilderWorkspaceProps> = ({
  build,
  onUpdateBuild,
  onClose,
  onLaunchMission,
}) => {
  const [messages, setMessages] = useState<AIBuilderMessage[]>([
    {
      id: "msg-init",
      sender: "ai",
      text: `Hello Pilot! I am your AI Robotics Architect. I'm actively managing the '${build.name}' build. Tell me what you'd like to add or change (e.g., 'Add person detection', 'Add obstacle avoidance', or 'Make it faster') and I'll draft and apply the configuration.`,
      timestamp: Date.now(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDiff, setCurrentDiff] = useState<BuildDiffProposal | null>(null);

  const quickSuggestions = [
    "I want the robot to follow me.",
    "Add reflex obstacle avoidance with distance sonar.",
    "Change search color to blue.",
    "Optimize motor throttle for higher speed.",
  ];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

    const userMsg: AIBuilderMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt("");
    setIsProcessing(true);

    try {
      const response = await aiAgent.processAIBuilderTurn(build, userText, messages);
      const aiMsg: AIBuilderMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response.replyText,
        timestamp: Date.now(),
        diff: response.diff,
      };
      setMessages(prev => [...prev, aiMsg]);
      setCurrentDiff(response.diff);
    } catch (e: any) {
      const errorMsg: AIBuilderMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `Error processing request: ${e.message}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyDiff = () => {
    if (!currentDiff) return;

    let updated = { ...build };

    // 1. Add capabilities
    if (currentDiff.addedCapabilities && currentDiff.addedCapabilities.length > 0) {
      const existingIds = new Set(updated.capabilities.map(c => c.id));
      const newCaps = currentDiff.addedCapabilities.map(c => ({ ...c, enabled: true }));
      
      const mergedCaps = updated.capabilities.map(c => {
        const found = currentDiff.addedCapabilities?.find(ac => ac.id === c.id);
        return found ? { ...c, enabled: true } : c;
      });

      newCaps.forEach(c => {
        if (!existingIds.has(c.id)) mergedCaps.push(c);
      });

      updated.capabilities = mergedCaps;
    }

    // 2. Hardware updates
    if (currentDiff.updatedHardware) {
      updated.hardware = {
        ...updated.hardware,
        ...currentDiff.updatedHardware,
      };
    }

    // 3. Prompt updates
    if (currentDiff.updatedPrompt) {
      updated.ai = {
        ...updated.ai,
        systemPrompt: currentDiff.updatedPrompt,
      };
    }

    // 4. Variables updates
    if (currentDiff.updatedVariables) {
      updated.variables = {
        ...updated.variables,
        ...currentDiff.updatedVariables,
      };
    }

    updated.updatedAt = new Date().toISOString();

    onUpdateBuild(updated);
    setCurrentDiff(prev => (prev ? { ...prev, applied: true } : null));

    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: "ai",
        text: "✓ Changes applied successfully to your active Robot Build!",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 animate-in fade-in duration-200">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">AI Builder Studio</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Co-Pilot
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Editing: <span className="text-slate-200 font-semibold">{build.name}</span> (v{build.version})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onLaunchMission(build)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Mission
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Two-Pane Studio */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT PANE: AI Conversation (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col border-r border-slate-800 bg-slate-950/60 overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isAi = m.sender === "ai";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-[88%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAi
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : "P"}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isAi
                        ? "bg-slate-900 border border-slate-800 text-slate-200 shadow-sm"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/10"
                    }`}
                  >
                    <p>{m.text}</p>

                    {m.diff && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-[11px] text-cyan-300 font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        Proposed changes are ready in the right panel.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex gap-3 mr-auto max-w-[88%]">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Reasoning about hardware ports and AI capabilities...
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-900/30 overflow-x-auto flex gap-2">
            {quickSuggestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isProcessing}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all"
              >
                + {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputPrompt);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Instruct AI (e.g. 'Add person tracking', 'Change speed', 'Add gripper')..."
                disabled={isProcessing}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isProcessing}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANE: Live Build Preview & Diff Proposal (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/40 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Build Preview & Diff
              </h2>
            </div>
            {currentDiff && !currentDiff.applied && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                Pending Approval
              </span>
            )}
          </div>

          {/* DIFF PROPOSAL CARD */}
          {currentDiff && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                currentDiff.applied
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-cyan-950/30 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  {currentDiff.applied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Changes Applied</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-300">Proposed Build Diff</span>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-3">{currentDiff.explanation}</p>

              {/* Warnings */}
              {currentDiff.warnings && currentDiff.warnings.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{currentDiff.warnings.join(" ")}</span>
                </div>
              )}

              {/* Diff summary pills */}
              <div className="space-y-1.5 mb-4 text-[11px] font-mono">
                {currentDiff.addedCapabilities && currentDiff.addedCapabilities.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400">+ Capabilities:</span>
                    {currentDiff.addedCapabilities.map(c => (
                      <span key={c.id} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}

                {currentDiff.updatedVariables && (
                  <div className="space-y-1">
                    <span className="text-slate-400 block">* Variables:</span>
                    {Object.entries(currentDiff.updatedVariables).map(([k, v]) => (
                      <div key={k} className="px-2 py-1 rounded bg-slate-800 text-slate-200 flex justify-between">
                        <span>{v.label}:</span>
                        <span className="text-cyan-300 font-bold">{String(v.value)} {v.unit || ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Apply Changes Button */}
              {!currentDiff.applied ? (
                <button
                  onClick={handleApplyDiff}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply Changes to Build
                </button>
              ) : (
                <div className="text-center text-xs text-emerald-400 font-medium py-1">
                  ✓ Active configuration updated
                </div>
              )}
            </div>
          )}

          {/* ACTIVE BUILD SNAPSHOT */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Configuration Snapshot
            </h3>

            {/* Hardware ports */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Hardware Ports
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {build.hardware.motors.length} Motors, {build.hardware.sensors.length} Sensors
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                {build.hardware.motors.map((m) => (
                  <div key={m.id} className="p-1.5 rounded bg-slate-950 border border-slate-800/80 text-slate-300">
                    <span className="text-cyan-400 font-bold">{m.port}</span>: {m.role}
                  </div>
                ))}
              </div>
            </div>

            {/* Active capabilities */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  Active Capabilities
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {build.capabilities.filter(c => c.enabled).length} Enabled
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {build.capabilities.map((c) => (
                  <span
                    key={c.id}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      c.enabled
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        : "bg-slate-800 text-slate-500 border-slate-700 line-through"
                    }`}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Parameters & Variables
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {Object.entries(build.variables).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-0.5 border-b border-slate-800/50">
                    <span className="text-slate-400 text-[11px]">{v.label}</span>
                    <span className="font-mono text-cyan-300 text-[11px]">
                      {String(v.value)} {v.unit || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

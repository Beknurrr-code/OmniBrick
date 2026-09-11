import React, { useState } from "react";
import type { PromptBuild, CapabilityId } from "../../types";
import { 
  Terminal, 
  Sparkles, 
  X, 
  Save, 
  CheckCircle2, 
  Play, 
  Plus, 
  Trash2, 
  Sliders, 
  Layers
} from "lucide-react";

interface PromptBuildEditorProps {
  build: PromptBuild;
  onSave: (updated: PromptBuild) => void;
  onClose: () => void;
}

export const PromptBuildEditor: React.FC<PromptBuildEditorProps> = ({
  build: initialBuild,
  onSave,
  onClose,
}) => {
  const [build, setBuild] = useState<PromptBuild>(initialBuild);
  const [newGuideline, setNewGuideline] = useState("");
  const [testInput, setTestInput] = useState("Camera reports target red cube at [x: 240, y: 180], distance 120cm.");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleAddGuideline = () => {
    if (!newGuideline.trim()) return;
    const updated = {
      ...build,
      guidelines: [...build.guidelines, newGuideline.trim()],
    };
    setBuild(updated);
    setNewGuideline("");
    onSave(updated);
  };

  const handleRemoveGuideline = (idx: number) => {
    const updated = {
      ...build,
      guidelines: build.guidelines.filter((_, i) => i !== idx),
    };
    setBuild(updated);
    onSave(updated);
  };

  const handleToggleCapability = (capId: CapabilityId) => {
    const exists = build.compatibleCapabilities.includes(capId);
    const updatedCaps = exists 
      ? build.compatibleCapabilities.filter(c => c !== capId)
      : [...build.compatibleCapabilities, capId];
    const updated = { ...build, compatibleCapabilities: updatedCaps };
    setBuild(updated);
    onSave(updated);
  };

  const handleRunTestInference = async () => {
    setIsTesting(true);
    setTestOutput(null);

    await new Promise(r => setTimeout(r, 600));

    const response = `[AI Brain Response using "${build.name}"]:\n` +
      `1. Evaluated sensory input: Target identified at 120cm range.\n` +
      `2. Checked guideline: "Verify target bearing before continuous throttle".\n` +
      `3. Action planned: Incur forward thrust via drive_motors(left=60, right=60) for 900ms.`;
    setTestOutput(response);
    setIsTesting(false);
  };

  const allCapabilities: { id: CapabilityId; label: string }[] = [
    { id: "vision", label: "Vision" },
    { id: "object_detection", label: "Object Detection" },
    { id: "navigation", label: "Navigation" },
    { id: "movement", label: "Movement" },
    { id: "speech", label: "Speech" },
    { id: "person_tracking", label: "Person Tracking" },
    { id: "obstacle_avoidance", label: "Obstacle Avoidance" },
    { id: "grabbing", label: "Grabbing" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 animate-in fade-in duration-200">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">{build.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Prompt Build
              </span>
            </div>
            <p className="text-xs text-slate-400">{build.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(build)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Save Blueprint
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-950/80">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Identity & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Build Title</label>
              <input
                type="text"
                value={build.name}
                onChange={(e) => {
                  const updated = { ...build, name: e.target.value };
                  setBuild(updated);
                  onSave(updated);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tagline</label>
              <input
                type="text"
                value={build.tagline}
                onChange={(e) => {
                  const updated = { ...build, tagline: e.target.value };
                  setBuild(updated);
                  onSave(updated);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                System Persona Instructions
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Defines core reasoning</span>
            </div>
            <textarea
              value={build.systemPrompt}
              onChange={(e) => {
                const updated = { ...build, systemPrompt: e.target.value };
                setBuild(updated);
                onSave(updated);
              }}
              rows={4}
              className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Operational Guidelines */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Operational Decision Rules ({build.guidelines.length})
            </label>
            <div className="space-y-2">
              {build.guidelines.map((g, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono text-slate-200">• {g}</span>
                  <button
                    onClick={() => handleRemoveGuideline(idx)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add guideline */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newGuideline}
                onChange={(e) => setNewGuideline(e.target.value)}
                placeholder="Add rule (e.g. 'Halt immediately if proximity drops below 25cm')..."
                onKeyDown={(e) => e.key === "Enter" && handleAddGuideline()}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAddGuideline}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Compatible Capabilities */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Compatible Capabilities
            </label>
            <div className="flex flex-wrap gap-2">
              {allCapabilities.map((c) => {
                const active = build.compatibleCapabilities.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleToggleCapability(c.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-mono border transition-all ${
                      active
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300"
                    }`}
                  >
                    {active ? "✓ " : "+ "}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive AI Prompt Tester */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Test Prompt Behavior
                </h3>
              </div>
              <button
                onClick={handleRunTestInference}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                <Play className="w-3 h-3 fill-current" />
                {isTesting ? "Simulating..." : "Test Persona"}
              </button>
            </div>

            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Simulated sensory input..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-400"
            />

            {testOutput && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed">
                {testOutput}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

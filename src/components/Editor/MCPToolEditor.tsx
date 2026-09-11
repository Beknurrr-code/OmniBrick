import React, { useState } from "react";
import type { MCPToolBuild, MCPToolBinding } from "../../types";
import { 
  Wrench, 
  Save, 
  X, 
  Play, 
  Plus, 
  Trash2, 
  Share2, 
  CheckCircle2, 
  Cpu, 
  Code
} from "lucide-react";

interface MCPToolEditorProps {
  build: MCPToolBuild;
  onSave: (updated: MCPToolBuild) => void;
  onClose: () => void;
}

export const MCPToolEditor: React.FC<MCPToolEditorProps> = ({
  build: initialBuild,
  onSave,
  onClose,
}) => {
  const [build, setBuild] = useState<MCPToolBuild>(initialBuild);
  const [selectedToolIndex, setSelectedToolIndex] = useState(0);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const currentTool = build.tools[selectedToolIndex] || build.tools[0];

  const handleRunToolTest = async () => {
    if (!currentTool) return;
    setIsTesting(true);
    setTestResult(null);

    await new Promise(r => setTimeout(r, 500));

    const mockOutput = {
      status: "SUCCESS",
      tool: currentTool.name,
      timestamp: Date.now(),
      server: build.serverType,
      result: {
        executed: true,
        response: `Simulated output from MCP tool '${currentTool.name}'. Handshake verified on ${build.endpoint || 'embedded://core'}.`,
        telemetryAcknowledged: true,
      },
    };

    setTestResult(JSON.stringify(mockOutput, null, 2));
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">{build.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MCP Tool Build
              </span>
            </div>
            <p className="text-xs text-slate-400">{build.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(build)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Save MCP Bundle
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Editor Main Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-950/80">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Tool Bundle Name</label>
              <input
                type="text"
                value={build.name}
                onChange={(e) => {
                  const updated = { ...build, name: e.target.value };
                  setBuild(updated);
                  onSave(updated);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Server Protocol</label>
              <select
                value={build.serverType}
                onChange={(e) => {
                  const updated = { ...build, serverType: e.target.value as any };
                  setBuild(updated);
                  onSave(updated);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="embedded_ts">embedded_ts</option>
                <option value="remote_sse">remote_sse (HTTP)</option>
                <option value="websocket">websocket (Live)</option>
              </select>
            </div>
          </div>

          {/* Tools in Bundle Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Registered MCP Tools ({build.tools.length})
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {build.tools.map((tool, idx) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedToolIndex(idx)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedToolIndex === idx
                      ? "bg-amber-950/30 border-amber-500 text-white shadow-md shadow-amber-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-amber-300">{tool.name}()</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{tool.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Tool Inspector */}
          {currentTool && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-mono font-bold text-amber-300">{currentTool.name}</h3>
                  <p className="text-xs text-slate-400">{currentTool.description}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentTool.source}
                </span>
              </div>

              {/* Permissions */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 block">Required Permissions</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentTool.permissions?.map(p => (
                    <span key={p} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {p}
                    </span>
                  )) || <span className="text-xs text-slate-500">None</span>}
                </div>
              </div>

              {/* Schema JSON view */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Tool Schema & Parameters</span>
                  <Code className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(currentTool.parametersSchema || currentTool.inputSchema || {}, null, 2)}
                </pre>
              </div>

              {/* Interactive Tool Invocation Tester */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Live Execution Sandbox</span>
                  <button
                    onClick={handleRunToolTest}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {isTesting ? "Executing..." : `Invoke ${currentTool.name}()`}
                  </button>
                </div>

                {testResult && (
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed">
                    {testResult}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

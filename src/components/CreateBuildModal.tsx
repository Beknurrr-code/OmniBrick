import React from "react";
import { Sparkles, Bot, Terminal, Wrench, X, ArrowRight } from "lucide-react";

interface CreateBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: "robot" | "prompt" | "mcp_tool" | "ai_builder") => void;
}

export const CreateBuildModal: React.FC<CreateBuildModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Create New Build</h2>
            <p className="text-xs text-slate-400">Choose what you want to engineer</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Option 1: BUILD WITH AI (Highlighted) */}
          <button
            onClick={() => {
              onClose();
              onSelectOption("ai_builder");
            }}
            className="group relative w-full p-4 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 hover:from-cyan-900/70 hover:to-blue-900/70 text-left transition-all shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Build with AI</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Describe your robot in natural language. AI builds the full logic & hardware ports.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option 2: Robot Build */}
          <button
            onClick={() => {
              onClose();
              onSelectOption("robot");
            }}
            className="group w-full p-3.5 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700 text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Robot Build</div>
                  <p className="text-xs text-slate-400">
                    Full robot configuration: hardware, capabilities, tools & AI persona.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-slate-300 transition-all" />
            </div>
          </button>

          {/* Option 3: Prompt Build */}
          <button
            onClick={() => {
              onClose();
              onSelectOption("prompt");
            }}
            className="group w-full p-3.5 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700 text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Prompt Build</div>
                  <p className="text-xs text-slate-400">
                    Reusable AI behavior, decision guidelines, and operational rules.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-slate-300 transition-all" />
            </div>
          </button>

          {/* Option 4: MCP Tool Build */}
          <button
            onClick={() => {
              onClose();
              onSelectOption("mcp_tool");
            }}
            className="group w-full p-3.5 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700 text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">MCP Tool Build</div>
                  <p className="text-xs text-slate-400">
                    Reusable capabilities and standardized Model Context Protocol tools.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-slate-300 transition-all" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

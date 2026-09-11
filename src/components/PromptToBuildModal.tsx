import { useState } from "react";
import { Sparkles, X, ArrowRight, Bot, Cpu, Sliders } from "lucide-react";
import type { RobotBuild } from "../types";
import { aiAgent } from "../engine/aiAgent";
import { buildStorage } from "../services/buildStorage";

interface PromptToBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuildCreated: (build: RobotBuild) => void;
}

export default function PromptToBuildModal({ isOpen, onClose, onBuildCreated }: PromptToBuildModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<RobotBuild | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      // Simulate quick cognitive synthesis
      await new Promise(r => setTimeout(r, 600));
      const build = await aiAgent.generateBuildFromPrompt(prompt.trim(), "Commander Beknur");
      setGeneratedPreview(build);
    } catch (e: any) {
      alert("Synthesis failed: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (!generatedPreview) return;
    buildStorage.saveBuild(generatedPreview);
    onBuildCreated(generatedPreview);
    setGeneratedPreview(null);
    setPrompt("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1120] border border-purple-500/30 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white tracking-tight">AI Robot Architect</h2>
            <p className="text-xs text-gray-400">Describe your robot intention — AI compiles hardware, prompts, and MCP tools</p>
          </div>
        </div>

        {/* Input Area */}
        {!generatedPreview ? (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase">Your Robot Intention</label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. "Build me a robot that can find a red cube and celebrate when acquired"'
                className="w-full mt-1.5 bg-black/60 border border-purple-500/30 rounded-2xl p-4 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-400 leading-relaxed font-sans"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-mono">Suggested Intentions:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Find a red cube and announce when reached",
                  "Desk companion pet with emotive audio",
                  "Sorting robot arm with end-effector gripper",
                  "Room perimeter patrol rover with obstacle avoidance",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(`Build me a robot that can ${s.toLowerCase()}`)}
                    className="text-[10px] bg-white/5 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Compiling Architecture...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Robot Build</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="space-y-4">
            <div className="p-4 bg-purple-950/20 rounded-2xl border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <span className="text-base font-black text-white">{generatedPreview.name}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
                  {generatedPreview.category} • {generatedPreview.hardware.chassis}
                </span>
              </div>

              <p className="text-xs text-gray-300 italic">"{generatedPreview.tagline}"</p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono text-gray-400 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Motors: {generatedPreview.hardware.motors.length} ports configured</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>MCP Tools: {generatedPreview.tools.filter(t => t.enabled).length} active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setGeneratedPreview(null)}
                className="text-xs text-gray-400 hover:text-white"
              >
                ← Back to Edit Intention
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30"
              >
                <span>Accept & Open Build</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

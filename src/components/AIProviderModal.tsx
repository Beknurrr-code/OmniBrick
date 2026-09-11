import { useState } from "react";
import { X, Sparkles, Server, Key, Cpu, Check, HelpCircle, ShieldCheck, Activity, AlertCircle, Loader2, Crown } from "lucide-react";
import { aiVisionService, type AIProviderConfig, type PingResult } from "../services/aiVisionService";
import { useSubscription } from "../context/SubscriptionContext";
import PaywallModal from "./PaywallModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIProviderModal({ isOpen, onClose }: Props) {
  const { isPro } = useSubscription();
  const [config, setConfig] = useState<AIProviderConfig>(() => aiVisionService.getConfig());
  const [saved, setSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    aiVisionService.setConfig(config);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    setPingResult(null);
    try {
      // Temporarily set active config for test
      aiVisionService.setConfig(config);
      const res = await aiVisionService.testConnection();
      setPingResult(res);
    } catch (e: any) {
      setPingResult({ success: false, message: e.message || "Failed to test", latencyMs: 0 });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Brain & Tool Calling Hub</h2>
            <p className="text-xs text-slate-400">Configure Ollama Cloud, Google Gemini, OpenAI-compatible APIs, or Simulator</p>
          </div>
        </div>

        {/* Security Reassurance Callout */}
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-200">Безопасность API ключей:</span>{" "}
            Ваши ключи сохраняются исключительно в локальном браузере (<code className="bg-emerald-900/60 px-1 py-0.5 rounded text-[10px] font-mono text-emerald-300">localStorage</code>) и никогда не отправляются на сторонние серверы. В чат ассистенту ключи кидать <strong className="text-white">НЕ нужно</strong>!
          </div>
        </div>

        {/* Provider Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Inference Provider</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setConfig({ 
                  ...config, 
                  provider: "gemini",
                  endpoint: "https://generativelanguage.googleapis.com",
                  model: config.model.includes("gemini") ? config.model : "gemini-2.5-flash"
                });
                setPingResult(null);
              }}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                config.provider === "gemini"
                  ? "bg-cyan-500/10 border-cyan-500/50 text-white shadow-sm"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Google Gemini</div>
                <div className="text-[10px] text-slate-400">Flash 2.5 / 1.5 with Native Tool Calls</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setConfig({ 
                  ...config, 
                  provider: "ollama",
                  endpoint: config.endpoint.includes("localhost") || config.endpoint.includes("ollama") ? config.endpoint : "http://localhost:11434/v1",
                  model: config.model.includes("gemini") ? "llama3.2-vision" : config.model
                });
                setPingResult(null);
              }}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                config.provider === "ollama"
                  ? "bg-purple-500/10 border-purple-500/50 text-white shadow-sm"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Server className="w-4 h-4 text-purple-400 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Ollama / Cloud</div>
                <div className="text-[10px] text-slate-400">Local or Ollama Cloud URL</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setConfig({ 
                  ...config, 
                  provider: "openai_compatible",
                  endpoint: "https://api.openai.com/v1",
                  model: "gpt-4o-mini"
                });
                setPingResult(null);
              }}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                config.provider === "openai_compatible"
                  ? "bg-indigo-500/10 border-indigo-500/50 text-white shadow-sm"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-4 h-4 text-indigo-400 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">OpenAI / Groq / Other</div>
                <div className="text-[10px] text-slate-400">OpenRouter, DeepSeek, vLLM</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setConfig({ ...config, provider: "simulator" });
                setPingResult(null);
              }}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                config.provider === "simulator"
                  ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Agentic Edge Brain</div>
                <div className="text-[10px] text-slate-400">Free, fast, zero keys needed</div>
              </div>
            </button>
          </div>
        </div>

        {/* Configuration inputs when not in simulator */}
        {config.provider !== "simulator" && (
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            {config.provider !== "gemini" && (
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  API Endpoint URL
                </label>
                <input
                  type="text"
                  value={config.endpoint}
                  onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                  placeholder={config.provider === "ollama" ? "https://your-ollama-cloud.com/v1 or http://localhost:11434/v1" : "https://api.openai.com/v1"}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Subscription Tier Model Presets */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Subscription Model Tiers
                </span>
                {isPro ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] flex items-center gap-1 font-bold">
                    <Crown className="w-3 h-3 text-amber-400" /> PRO UNLOCKED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px]">
                    FREE EXPLORER
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Base Model: Gemma 4 31B */}
                <button
                  type="button"
                  onClick={() => {
                    if (config.provider === "gemini") {
                      setConfig({ ...config, model: "gemma-4-31b-it" });
                    } else {
                      setConfig({ ...config, provider: "ollama", model: "gemma4:31b-cloud" });
                    }
                  }}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    config.model.toLowerCase().includes("gemma")
                      ? "bg-purple-950/30 border-purple-500/50 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>Gemma 4 31B</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">BASE</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Free base model. 14,400 RPD community weights.</p>
                </button>

                {/* Free High-RPM Fallback: Gemini 3.5 Flash Lite */}
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, provider: "gemini", model: "gemini-3.5-flash-lite" })}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    config.model === "gemini-3.5-flash-lite"
                      ? "bg-cyan-950/30 border-cyan-500/50 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>Gemini 3.5 Lite</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">500 RPD</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">708ms latency. Fast autonomous robotics loops.</p>
                </button>

                {/* PRO Model: Gemini 3.8 Flash */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isPro) {
                      setPaywallOpen(true);
                    } else {
                      setConfig({ ...config, provider: "gemini", model: "gemini-3.8-flash" });
                    }
                  }}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer relative ${
                    config.model === "gemini-3.8-flash"
                      ? "bg-amber-950/30 border-amber-500/50 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-amber-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>Gemini 3.8 Flash</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">PRO</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Next-gen ultra-fast reasoning & tool synthesis.</p>
                </button>

                {/* PRO Model: Gemini Robotics-ER 2 */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isPro) {
                      setPaywallOpen(true);
                    } else {
                      setConfig({ ...config, provider: "gemini", model: "gemini-robotics-er-2-preview" });
                    }
                  }}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer relative ${
                    config.model === "gemini-robotics-er-2-preview"
                      ? "bg-amber-950/30 border-amber-500/50 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-amber-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>Robotics-ER 2</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">PRO</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Embodied AI for physical actuators & spatial vision.</p>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-300">
                  Custom Model Name
                </label>
              </div>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                placeholder={config.provider === "gemini" ? "gemini-3.5-flash-lite" : "gemma4:31b-cloud"}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between mb-1">
                <span>{config.provider === "gemini" ? "Google Gemini API Key" : "API Key / Bearer Token"}</span>
                <span className="text-[10px] text-slate-500">
                  {config.provider === "ollama" ? "Optional for local Ollama" : "Required"}
                </span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder={config.provider === "gemini" ? "AIzaSy..." : "Bearer token or sk-..."}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-cyan-500 pr-8"
                />
                <Key className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Pinging endpoint...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    <span>Ping / Test Connection</span>
                  </>
                )}
              </button>

              {pingResult && (
                <div className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono flex items-center gap-1.5 animate-in fade-in ${
                  pingResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}>
                  {pingResult.success ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  <span>{pingResult.message} ({pingResult.latencyMs}ms)</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Local persistence active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const defs = aiVisionService.resetToEnvDefaults();
                setConfig(defs);
                setPingResult(null);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Reset config to .env settings (Ollama Gemma 4)"
            >
              Reset to .env
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20"
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                "Save Configuration"
              )}
            </button>
          </div>
        </div>
      </div>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}

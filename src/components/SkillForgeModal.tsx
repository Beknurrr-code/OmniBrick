import { useState, useEffect } from "react";
import { 
  Cpu, Sparkles, Plus, Play, Trash2, X, Code2, CheckCircle2, 
  AlertTriangle, Shield, Award, Terminal, ArrowRight, RefreshCw,
  Download, Zap, Layers
} from "lucide-react";
import { 
  skillEvolutionService, 
  type LearnedSkill 
} from "../services/skillEvolutionService";
import { mcpRegistry } from "../engine/mcpRegistry";
import { soundService } from "../services/soundService";

interface SkillForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SkillForgeModal({ isOpen, onClose }: SkillForgeModalProps) {
  const [skills, setSkills] = useState<LearnedSkill[]>([]);
  const [evolutionStats, setEvolutionStats] = useState({ level: 1, totalXp: 0, title: "Novice", skillCount: 0 });
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; output: string; success: boolean } | null>(null);
  
  // Synthesis form state
  const [promptInput, setPromptInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<LearnedSkill["category"]>("locomotion");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const refresh = () => {
    const list = skillEvolutionService.getLearnedSkills();
    setSkills(list);
    setEvolutionStats(skillEvolutionService.getOverallEvolutionLevel());
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSynthesize = () => {
    if (!promptInput.trim()) return;
    setIsSynthesizing(true);
    soundService.playRobotChirp();

    setTimeout(() => {
      const newSkill = skillEvolutionService.synthesizeNewSkill(promptInput, categoryInput);
      refresh();
      setIsSynthesizing(false);
      setPromptInput("");
      setExpandedCodeId(newSkill.id);
      soundService.playHappyFanfare();
    }, 600);
  };

  const handleTestSkill = async (skill: LearnedSkill) => {
    soundService.playMotorClick();
    try {
      const mockAdapter: any = {
        getTelemetry: () => ({ batteryLevel: 98, sensors: { distanceToWallCm: 120 } }),
        executeTool: async () => ({ status: "executed" }),
      };

      const res = await mcpRegistry.execute(skill.name, { testMode: true }, mockAdapter);
      setTestResult({
        id: skill.id,
        output: typeof res === "string" ? res : JSON.stringify(res, null, 2),
        success: res?.success !== false,
      });
      refresh();
      soundService.playHappyFanfare();
    } catch (e: any) {
      setTestResult({
        id: skill.id,
        output: `Error: ${e.message}`,
        success: false,
      });
      soundService.playAlertAlarm();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить этот выученный навык из реестра робота?")) {
      skillEvolutionService.deleteSkill(id);
      refresh();
      soundService.playMotorClick();
    }
  };

  const handleExportJson = () => {
    const jsonStr = skillEvolutionService.exportSkillsJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omnibrick-learned-skills-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundService.playHappyFanfare();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#050814] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-cyan-950/70 via-indigo-950/40 to-[#050814] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white tracking-wide">Neural Skill Forge & Self-Learning</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-200 border border-cyan-400/30">
                  Lvl {evolutionStats.level}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                <span>{evolutionStats.title}</span>
                <span className="text-gray-600">•</span>
                <span className="text-cyan-400 font-semibold">{evolutionStats.totalXp} XP</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-300">{evolutionStats.skillCount} динамических MCP скиллов</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="p-2 text-gray-400 hover:text-cyan-300 hover:bg-gray-800/80 rounded-xl transition-colors text-xs font-mono flex items-center gap-1.5"
              title="Экспорт навыков в JSON"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. Synthesize New Skill Panel */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/90 to-cyan-950/30 border border-cyan-500/30 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Научить ИИ новому навыку (Самоэволюция)</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Опиши комплексное поведение робота. ИИ сгенерирует исполняемый алгоритм, кинематические формулы и сохранит их как новый готовый MCP-инструмент.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSynthesize();
                }}
                placeholder="Например: 'Объехать коробку слева по дуге и сказать фразу' или 'Сделать квадрат 40х40 см'"
                className="flex-1 bg-black/60 border border-gray-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all"
              />
              
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value as any)}
                className="bg-black/60 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none"
              >
                <option value="locomotion">Движение (Locomotion)</option>
                <option value="perception">Зрение & Сенсоры (Perception)</option>
                <option value="tactical">Тактика & Охрана (Tactical)</option>
                <option value="interaction">Эмоции & Речь (Interaction)</option>
              </select>

              <button
                onClick={handleSynthesize}
                disabled={!promptInput.trim() || isSynthesizing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 active:scale-95 transition-all"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Синтез...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Синтезировать</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. List of Evolved Learned Skills */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-200 tracking-wider uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Реестр выученных навыков ({skills.length})
              </h3>
              <span className="text-xs text-gray-500 font-mono">Доступны для вызова в когнитивном цикле и VLM</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => {
                const isExpanded = expandedCodeId === skill.id;
                const activeTest = testResult?.id === skill.id ? testResult : null;

                return (
                  <div
                    key={skill.id}
                    className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{skill.label}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                              Lvl {skill.level}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
                            tool: {skill.name}()
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 uppercase">
                          {skill.category}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed mb-3">
                        {skill.description}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-[11px] text-gray-500 font-mono mb-3 pt-2 border-t border-gray-800/80">
                        <span>XP: <strong className="text-gray-300">{skill.xp}</strong></span>
                        <span>Вызовов: <strong className="text-gray-300">{skill.usageCount}</strong></span>
                        <span>Успех: <strong className="text-emerald-400">{skill.successRate}%</strong></span>
                      </div>

                      {/* Expandable Code Drawer */}
                      {isExpanded && (
                        <div className="mb-3 p-3 rounded-xl bg-black/80 border border-gray-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-48">
                          <div className="text-[10px] text-gray-500 mb-1 flex items-center justify-between">
                            <span>SANDBOX JAVASCRIPT:</span>
                            <span>ES2026 Sandbox</span>
                          </div>
                          <pre className="whitespace-pre-wrap">{skill.code}</pre>
                        </div>
                      )}

                      {/* Test Output if available */}
                      {activeTest && (
                        <div className={`mb-3 p-2.5 rounded-xl border text-xs font-mono ${activeTest.success ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-rose-950/40 border-rose-500/40 text-rose-300"}`}>
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            {activeTest.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            <span>Результат симуляции:</span>
                          </div>
                          <pre className="whitespace-pre-wrap text-[11px]">{activeTest.output}</pre>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestSkill(skill)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Тест</span>
                        </button>
                        <button
                          onClick={() => setExpandedCodeId(isExpanded ? null : skill.id)}
                          className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>{isExpanded ? "Скрыть код" : "Код"}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleDelete(skill.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Удалить навык"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/90 flex items-center justify-between text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Все выученные навыки верифицированы кинематическим ядром OmniBrick</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}

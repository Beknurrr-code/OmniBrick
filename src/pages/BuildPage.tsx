import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Plus, 
  Bot, 
  Terminal, 
  Wrench, 
  Sparkles, 
  Play, 
  Copy, 
  Layers, 
  Search, 
  SlidersHorizontal,
  Clock,
  ArrowRight,
  Settings,
  Download,
  Upload,
  ShoppingBag,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Radio,
  Zap,
  User,
  Star
} from "lucide-react";
import type { RobotBuild, PromptBuild, MCPToolBuild, AnyBuild, BuildType } from "../types";
import { buildStorage } from "../services/buildStorage";
import { useRobot } from "../context/RobotContext";
import { useSubscription } from "../context/SubscriptionContext";
import { CreateBuildModal } from "../components/CreateBuildModal";
import { AIBuilderWorkspace } from "../components/AIBuilder/AIBuilderWorkspace";
import { RobotBuildEditor } from "../components/Editor/RobotBuildEditor";
import { PromptBuildEditor } from "../components/Editor/PromptBuildEditor";
import { MCPToolEditor } from "../components/Editor/MCPToolEditor";
import LegoAssemblyGuideModal from "../components/LegoAssemblyGuideModal";
import SkillForgeModal from "../components/SkillForgeModal";
import PageOverviewBanner from "../components/PageOverviewBanner";

export default function BuildPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const { launchMission, setAdapterMode } = useRobot();
  const { pilot, addBricks } = useSubscription();

  const [activeFilter, setActiveFilter] = useState<"all" | BuildType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [robotBuilds, setRobotBuilds] = useState<RobotBuild[]>([]);
  const [promptBuilds, setPromptBuilds] = useState<PromptBuild[]>([]);
  const [mcpBuilds, setMcpBuilds] = useState<MCPToolBuild[]>([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiBuilderOpen, setAiBuilderOpen] = useState(false);
  const [assemblyGuideOpen, setAssemblyGuideOpen] = useState(false);
  const [skillForgeOpen, setSkillForgeOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editingRobot, setEditingRobot] = useState<RobotBuild | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptBuild | null>(null);
  const [editingMcp, setEditingMcp] = useState<MCPToolBuild | null>(null);
  const [publishingBuild, setPublishingBuild] = useState<AnyBuild | null>(null);
  const [publishPrice, setPublishPrice] = useState<number>(250);
  const [publishedToast, setPublishedToast] = useState<string | null>(null);
  const [expandedSpecsId, setExpandedSpecsId] = useState<string | null>(null);

  const handleDelete = (build: AnyBuild) => {
    const isSeed = [
      "build-red-cube-hunter",
      "build-kinematics-arc-racer",
      "build-titan-claw-01",
      "build-cyber-pup-neo",
    ].includes(build.id);

    const msg = isSeed
      ? `Удалить заводской чертёж "${build.name}"? Вы сможете вернуть его через сброс или импорт.`
      : `Удалить чертёж "${build.name}"? Это действие нельзя отменить.`;

    if (window.confirm(msg)) {
      buildStorage.deleteAnyBuild(build.id, build.type);
      refreshAll();
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingBuild) return;
    const updated: AnyBuild = {
      ...publishingBuild,
      priceBricks: publishPrice,
      isPublished: true,
      author: pilot?.callsign || publishingBuild.author || "Pilot",
      updatedAt: new Date().toISOString()
    };
    if (updated.type === "robot") {
      buildStorage.saveRobotBuild(updated as RobotBuild);
    } else if (updated.type === "prompt") {
      buildStorage.savePromptBuild(updated as PromptBuild);
    } else {
      buildStorage.saveMCPToolBuild(updated as MCPToolBuild);
    }
    addBricks(50); // Community reward for contributing blueprints
    refreshAll();
    setPublishedToast(`🎉 Blueprint "${updated.name}" successfully published to Marketplace! Earned +50 🧱 bonus.`);
    setPublishingBuild(null);
    setTimeout(() => setPublishedToast(null), 6000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const imported = buildStorage.importBuildFromJson(content);
        refreshAll();
        alert(`Blueprint "${imported.name}" imported successfully!`);
      } catch (err: any) {
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const refreshAll = () => {
    const robots = buildStorage.getRobotBuilds();
    const prompts = buildStorage.getPromptBuilds();
    const mcps = buildStorage.getMCPToolBuilds();

    setRobotBuilds(robots);
    setPromptBuilds(prompts);
    setMcpBuilds(mcps);

    if (editId) {
      const found = robots.find(r => r.id === editId);
      if (found) setEditingRobot(found);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [editId]);

  const handleLaunch = async (build: RobotBuild) => {
    await launchMission(build);
    nav("/run");
  };

  const handleFork = (sourceId: string) => {
    const forked = buildStorage.forkBuild(sourceId);
    if (forked) refreshAll();
  };

  const handleSelectCreateOption = (opt: "robot" | "prompt" | "mcp_tool" | "ai_builder") => {
    if (opt === "ai_builder") {
      setAiBuilderOpen(true);
    } else if (opt === "robot") {
      // Create blank robot build
      const newRobot = buildStorage.getRobotBuilds()[0];
      const clone: RobotBuild = {
        ...newRobot,
        id: `build-${Date.now()}`,
        name: "New Custom Robot",
        author: "Pilot",
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      buildStorage.saveRobotBuild(clone);
      refreshAll();
      setEditingRobot(clone);
    } else {
      alert(`Created blank ${opt} build blueprint in your workspace!`);
    }
  };

  // Combine and filter builds
  const allBuilds: AnyBuild[] = [
    ...robotBuilds,
    ...promptBuilds,
    ...mcpBuilds,
  ];

  const filteredBuilds = allBuilds.filter((b) => {
    const matchesFilter = activeFilter === "all" || b.type === activeFilter;
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <PageOverviewBanner
          title="Студия сборок (Build Studio)"
          badge="7 готовых чертежей"
          description="Проектируй роботов, настраивай промпты поведения ИИ и интегрируй MCP инструменты с экспортом в JSON и симулятором."
          actionButton={{
            label: "Запустить в кокпите",
            to: "/run",
          }}
        />
      </div>

      {/* Top Workspace Header (Section 3 of Spec) */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Layers className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Build
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Create robots, AI behaviors and tools.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAssemblyGuideOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs transition-all cursor-pointer shadow-sm"
                title="Open Step-by-Step LEGO Mindstorms 51515 Hardware Assembly Guide"
              >
                <span>🧱</span>
                <span className="hidden sm:inline">LEGO Assembly Guide</span>
              </button>

              <button
                onClick={() => setSkillForgeOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                title="Реестр самообучения и синтезированных MCP-скиллов робота"
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Нейро-скиллы ИИ</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
                title="Import .json Robot Blueprint"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Import JSON</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                className="hidden"
              />

              <button
                onClick={() => setAiBuilderOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Build with AI
              </button>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Create
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
              {[
                { id: "all", label: "All Builds", count: allBuilds.length },
                { id: "robot", label: "Robot Builds", count: robotBuilds.length },
                { id: "prompt", label: "Prompt Builds", count: promptBuilds.length },
                { id: "mcp_tool", label: "MCP Tool Builds", count: mcpBuilds.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeFilter === tab.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] font-mono opacity-60">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter builds by tag or name..."
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Builds Workspace Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Builds & Blueprints
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {filteredBuilds.length} build configurations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBuilds.map((b) => {
            const isRobot = b.type === "robot";
            const isPrompt = b.type === "prompt";
            const isMcp = b.type === "mcp_tool";

            const robot = isRobot ? (b as RobotBuild) : null;
            const prompt = isPrompt ? (b as PromptBuild) : null;
            const mcp = isMcp ? (b as MCPToolBuild) : null;

            const isExpanded = expandedSpecsId === b.id;

            const accentGradient = isRobot
              ? "from-cyan-500 via-blue-500 to-indigo-500"
              : isPrompt
              ? "from-emerald-500 via-teal-500 to-cyan-500"
              : "from-amber-500 via-orange-500 to-yellow-400";

            const iconContainerStyle = isRobot
              ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
              : isPrompt
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-amber-500/15 border-amber-500/30 text-amber-400";

            const typeBadgeStyle = isRobot
              ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
              : isPrompt
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-300 border-amber-500/30";

            const TypeIcon = isRobot ? Bot : isPrompt ? Terminal : Wrench;

            // Category & difficulty
            const categoryIcon = robot?.category === "arm" 
              ? "🦾" 
              : robot?.category === "pet" 
              ? "🐕" 
              : robot?.category === "drone" 
              ? "🛸" 
              : "🏎️";

            const categoryLabel = robot?.category === "arm"
              ? "Манипулятор"
              : robot?.category === "pet"
              ? "Питомец"
              : robot?.category === "drone"
              ? "Дрон"
              : "Ровер";

            const difficultyBadge = robot?.difficulty === "easy"
              ? { label: "Легкий", dot: "bg-emerald-400", style: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" }
              : robot?.difficulty === "hard"
              ? { label: "Сложный", dot: "bg-rose-400", style: "bg-rose-500/10 text-rose-300 border-rose-500/30" }
              : { label: "Средний", dot: "bg-amber-400", style: "bg-amber-500/10 text-amber-300 border-amber-500/30" };

            // Chassis formatting
            const chassisLabel = robot?.hardware?.chassis === "lego"
              ? "LEGO 51515"
              : robot?.hardware?.chassis === "arduino"
              ? "Arduino"
              : robot?.hardware?.chassis === "esp32"
              ? "ESP32 BLE"
              : "Виртуальное";

            const motorsCount = robot?.hardware?.motors?.length || 0;
            const motorPorts = robot?.hardware?.motors?.map(m => m.port).join(",") || "—";
            const cameraEnabled = !!robot?.hardware?.camera?.enabled;
            const sensorsCount = robot?.hardware?.sensors?.length || 0;
            const enabledCapabilities = robot?.capabilities?.filter(c => c.enabled) || [];
            const toolsCount = robot?.tools?.length || 0;

            return (
              <div
                key={b.id}
                className="group relative rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/60 hover:bg-slate-900/95 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 overflow-hidden"
              >
                {/* Glowing Top Accent Strip */}
                <div className={`h-1 w-full bg-gradient-to-r ${accentGradient}`} />

                <div className="p-5">
                  {/* Header: Type icon, Title, Version, Category */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${iconContainerStyle}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                            {b.name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-400 border border-slate-700/80">
                            v{b.version}
                          </span>
                        </div>

                        {/* Badges Row */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-md border font-semibold ${typeBadgeStyle}`}>
                            {isRobot ? "🤖 Robot" : isPrompt ? "📜 Prompt" : "🛠️ MCP Tool"}
                          </span>

                          {isRobot && (
                            <>
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80">
                                <span>{categoryIcon}</span>
                                <span>{categoryLabel}</span>
                              </span>

                              <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-md border ${difficultyBadge.style}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${difficultyBadge.dot}`} />
                                <span>{difficultyBadge.label}</span>
                              </span>
                            </>
                          )}

                          {b.isPublished && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              <ShoppingBag className="w-2.5 h-2.5" />
                              <span>{b.priceBricks || 0} 🧱</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Robot Tagline */}
                  {robot?.tagline && (
                    <p className="text-xs font-semibold text-cyan-400/90 mb-1.5 line-clamp-1">
                      {robot.tagline}
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {b.description}
                  </p>

                  {/* Hardware Manifest Telemetry (For Robot Builds) */}
                  {isRobot && (
                    <div className="mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        {/* Chassis */}
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="text-xs">🧱</span>
                          <span className="truncate">{chassisLabel}</span>
                        </div>

                        {/* Motors */}
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{motorsCount}x Мотор ({motorPorts})</span>
                        </div>

                        {/* Camera */}
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{cameraEnabled ? "Камера VLM (640x480)" : "Без камеры"}</span>
                        </div>

                        {/* Sensors */}
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{sensorsCount} сенсора (Сонар, IMU)</span>
                        </div>
                      </div>

                      {/* Capabilities pill row */}
                      {enabledCapabilities.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-1">
                          <div className="flex flex-wrap gap-1">
                            {enabledCapabilities.slice(0, 3).map((cap) => (
                              <span
                                key={cap.id}
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-slate-300 flex items-center gap-1"
                              >
                                <Zap className="w-2.5 h-2.5 text-cyan-400" />
                                <span>{cap.name}</span>
                              </span>
                            ))}
                            {enabledCapabilities.length > 3 && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                +{enabledCapabilities.length - 3}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setExpandedSpecsId(isExpanded ? null : b.id)}
                            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer whitespace-nowrap pl-1"
                          >
                            <span>{isExpanded ? "Скрыть" : "Детали"}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline Expanded Hardware & MCP Specs Panel */}
                  {isRobot && isExpanded && (
                    <div className="mb-4 p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs font-mono space-y-2.5 animate-fadeIn">
                      <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                        🛠️ Архитектура и MCP инструменты
                      </div>

                      {/* Motors list */}
                      <div>
                        <span className="text-slate-500 text-[10px] block mb-1">МОТОРНЫЕ КАНАЛЫ:</span>
                        <div className="space-y-1">
                          {robot?.hardware?.motors?.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded">
                              <span className="text-cyan-400 font-bold">{m.port}: {m.label}</span>
                              <span className="text-slate-400 text-[10px]">роль: {m.role} • лимит {m.speedLimit || 80}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* MCP Tools list */}
                      <div>
                        <span className="text-slate-500 text-[10px] block mb-1">ПОДКЛЮЧЕННЫЕ MCP TOOLS ({toolsCount}):</span>
                        <div className="flex flex-wrap gap-1">
                          {robot?.tools?.map((t) => (
                            <span key={t.id} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                              {t.name}()
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* AI Persona */}
                      {robot?.ai && (
                        <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                          <span className="text-slate-500">ИИ Мозг: </span>
                          <span className="text-slate-200">{robot.ai.name} ({robot.ai.voiceTone}, {robot.ai.reasoningEffort} reasoning)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {b.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 border border-slate-700/40"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Bar: Author & Rich Actions */}
                <div className="p-4 pt-3 border-t border-slate-800/80 bg-slate-950/40 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-300 font-semibold truncate">{b.author || "Pilot"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span title="Forks">⬇️ {b.downloads || 0}</span>
                      <span title="Likes">❤️ {b.likes || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    {/* Utility icons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleFork(b.id)}
                        title="Сделать форк (копию)"
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => buildStorage.exportBuildAsJson(b)}
                        title="Экспорт манифеста (.json)"
                        className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setPublishingBuild(b);
                          setPublishPrice(b.priceBricks || 250);
                        }}
                        title="Опубликовать в Маркетплейс (70% роялти)"
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(b)}
                        title="Удалить чертёж"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Main Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {isRobot ? (
                        <>
                          <button
                            onClick={() => {
                              setEditingRobot(b as RobotBuild);
                              setAiBuilderOpen(true);
                            }}
                            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-indigo-300 font-bold text-xs transition-all border border-indigo-500/30 cursor-pointer"
                            title="Доработать с помощью ИИ"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>ИИ</span>
                          </button>

                          <button
                            onClick={() => setEditingRobot(b as RobotBuild)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 hover:border-slate-600 cursor-pointer"
                            title="Открыть конфигуратор робота (8 вкладок)"
                          >
                            <Settings className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Настроить</span>
                          </button>

                          <button
                            onClick={() => handleLaunch(b as RobotBuild)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer"
                            title="Запустить робота в Кокпите с глазами и телеметрией"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Запуск</span>
                          </button>
                        </>
                      ) : isPrompt ? (
                        <button
                          onClick={() => setEditingPrompt(b as PromptBuild)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs transition-all border border-emerald-500/40 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Редактировать</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingMcp(b as MCPToolBuild)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition-all border border-amber-500/40 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Редактировать</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE BUILD MODAL */}
      <CreateBuildModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSelectOption={handleSelectCreateOption}
      />

      {/* AI BUILDER TWO-PANE WORKSPACE */}
      {aiBuilderOpen && (
        <AIBuilderWorkspace
          build={editingRobot || robotBuilds[0]}
          onUpdateBuild={(updated) => {
            buildStorage.saveRobotBuild(updated);
            refreshAll();
            setEditingRobot(updated);
          }}
          onClose={() => setAiBuilderOpen(false)}
          onLaunchMission={(b) => handleLaunch(b)}
        />
      )}

      {/* ROBOT BUILD EDITOR (8-TAB IDE) */}
      {editingRobot && !aiBuilderOpen && (
        <RobotBuildEditor
          build={editingRobot}
          onSave={(updated) => {
            buildStorage.saveRobotBuild(updated);
            refreshAll();
          }}
          onClose={() => setEditingRobot(null)}
          onOpenAIBuilder={() => setAiBuilderOpen(true)}
          onLaunchMission={(b) => handleLaunch(b)}
        />
      )}

      {/* PROMPT BUILD EDITOR */}
      {editingPrompt && (
        <PromptBuildEditor
          build={editingPrompt}
          onSave={(updated) => {
            buildStorage.savePromptBuild(updated);
            refreshAll();
          }}
          onClose={() => setEditingPrompt(null)}
        />
      )}

      {/* MCP TOOL EDITOR */}
      {editingMcp && (
        <MCPToolEditor
          build={editingMcp}
          onSave={(updated) => {
            buildStorage.saveMCPToolBuild(updated);
            refreshAll();
          }}
          onClose={() => setEditingMcp(null)}
        />
      )}

      {/* LEGO HARDWARE ASSEMBLY GUIDE MODAL */}
      <LegoAssemblyGuideModal
        isOpen={assemblyGuideOpen}
        onClose={() => setAssemblyGuideOpen(false)}
        onConnectLego={() => {
          setAdapterMode("lego_spike");
          nav("/run");
        }}
      />

      {/* PUBLISH TO MARKETPLACE MODAL */}
      {publishingBuild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Опубликовать в Маркетплейс</h3>
                  <p className="text-xs text-slate-400">Сделай чертёж доступным для комьюнити пилотов</p>
                </div>
              </div>
              <button
                onClick={() => setPublishingBuild(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs font-mono text-slate-400">Выбранная сборка:</div>
                <div className="text-sm font-bold text-white mt-0.5">{publishingBuild.name}</div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-2">{publishingBuild.description}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Цена в Бриксах (🧱 Bricks):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    step="50"
                    value={publishPrice}
                    onChange={(e) => setPublishPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-1.5">
                    {[0, 100, 250, 500].map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPublishPrice(p)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-mono border transition-all ${
                          publishPrice === p
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        {p === 0 ? "Free" : `${p}🧱`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Creator Royalty & Rewards Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>💰 Роялти создателя:</span>
                  <span className="font-mono text-sm">70% ({Math.round(publishPrice * 0.7)} 🧱)</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Каждый раз, когда другой пилот покупает или форкает этот чертёж, 70% суммы зачисляется на ваш баланс!
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-emerald-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+50 🧱 Бриксов бонуса начисляется сразу при публикации!</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPublishingBuild(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Опубликовать чертёж
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISHED SUCCESS TOAST */}
      {publishedToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-slate-900 border border-emerald-500/50 shadow-2xl flex items-center justify-between gap-3 animate-bounce">
          <div className="text-xs text-emerald-300 font-medium">
            {publishedToast}
          </div>
          <button
            onClick={() => nav("/marketplace")}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold whitespace-nowrap"
          >
            В Маркетплейс →
          </button>
        </div>
      )}

      {/* SKILL FORGE MODAL */}
      <SkillForgeModal
        isOpen={skillForgeOpen}
        onClose={() => setSkillForgeOpen(false)}
      />
    </div>
  );
}

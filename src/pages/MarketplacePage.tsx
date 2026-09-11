import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Sparkles, 
  Bot, 
  Terminal, 
  Wrench, 
  Download, 
  Star, 
  Search, 
  Copy, 
  Check, 
  Filter,
  X,
  ArrowRight,
  Eye,
  SlidersHorizontal
} from "lucide-react";
import { useSubscription } from "../context/SubscriptionContext";
import { buildStorage } from "../services/buildStorage";
import type { AnyBuild, BuildType } from "../types";
import PageOverviewBanner from "../components/PageOverviewBanner";

export default function MarketplacePage() {
  const nav = useNavigate();
  const { pilot, spendBricks } = useSubscription();
  const [filterType, setFilterType] = useState<"all" | BuildType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "popular">("featured");
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<AnyBuild | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; actionBuildId?: string } | null>(null);

  const allBuilds = buildStorage.getAllBuilds();

  const showToast = (text: string, actionBuildId?: string) => {
    setToastMessage({ text, actionBuildId });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filtered = allBuilds
    .filter((b) => {
      const matchesType = filterType === "all" || b.type === filterType;
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return (a.priceBricks || 0) - (b.priceBricks || 0);
      if (sortBy === "price_desc") return (b.priceBricks || 0) - (a.priceBricks || 0);
      if (sortBy === "popular") return (b.downloads || 0) - (a.downloads || 0);
      return 0; // featured
    });

  const handleBuyOrFork = (build: AnyBuild) => {
    const price = build.priceBricks || 0;
    if (price > 0 && !purchasedIds.has(build.id)) {
      const ok = spendBricks(price);
      if (!ok) {
        showToast("⚠️ Not enough Bricks 🧱! Earn more by completing Academy challenges.");
        return;
      }
    }

    setPurchasedIds(prev => new Set(prev).add(build.id));
    const forked = buildStorage.forkBuild(build.id, pilot.callsign);
    if (forked) {
      showToast(`🎉 Added '${build.name}' to your library!`, forked.id);
      if (previewItem?.id === build.id) {
        setPreviewItem(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <PageOverviewBanner
          title="Маркетплейс робототехники"
          badge={`${allBuilds.length} сборок`}
          description="Исследуй, покупай и делай форки готовых сборок роботов, промптов и MCP инструментов от комьюнити пилотов."
          actionButton={{
            label: "Создать свою",
            to: "/build",
          }}
        />
      </div>

      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Robotics Marketplace
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              Discover, buy, and fork community Robot Builds, Prompt Behaviors, and MCP Tool Bundles.
            </p>
          </div>

          {/* User Wallet Badge */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg shadow-amber-500/5">
            <span className="text-2xl">🧱</span>
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Brick Balance</div>
              <div className="text-base font-black text-amber-300 font-mono">
                {pilot.bricksBalance.toLocaleString()} 🧱
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="max-w-7xl mx-auto mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
            {[
              { id: "all", label: "All Items" },
              { id: "robot", label: "Robot Builds" },
              { id: "prompt", label: "Prompt Builds" },
              { id: "mcp_tool", label: "MCP Tool Builds" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterType === tab.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search marketplace items..."
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-300 outline-none text-xs cursor-pointer font-mono"
              >
                <option value="featured" className="bg-slate-900 text-white">Featured</option>
                <option value="popular" className="bg-slate-900 text-white">Most Popular</option>
                <option value="price_asc" className="bg-slate-900 text-white">Price: Low to High</option>
                <option value="price_desc" className="bg-slate-900 text-white">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isRobot = item.type === "robot";
            const isPrompt = item.type === "prompt";
            const isMcp = item.type === "mcp_tool";
            const price = item.priceBricks || 0;
            const isOwned = price === 0 || purchasedIds.has(item.id);

            const TypeIcon = isRobot ? Bot : isPrompt ? Terminal : Wrench;
            const typeBadge = isRobot
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
              : isPrompt
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              : "bg-amber-500/20 text-amber-300 border-amber-500/30";

            return (
              <div
                key={item.id}
                className="group relative p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/90 transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${typeBadge}`}>
                            {item.type === "robot" ? "Robot Build" : item.type === "prompt" ? "Prompt Build" : "MCP Tool"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">by {item.author}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      v{item.version}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      {item.downloads || 42}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      4.9
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-sm font-mono font-bold text-amber-300">
                    {price === 0 ? "FREE" : `${price} 🧱`}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                      title="Inspect Specifications & Manifest"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleBuyOrFork(item)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isOwned
                          ? "bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                          : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95"
                      }`}
                    >
                      {isOwned ? (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Fork Build
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Buy ({price} 🧱)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Inspection & Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {previewItem.type === "robot" ? <Bot className="w-6 h-6" /> : previewItem.type === "prompt" ? <Terminal className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{previewItem.name}</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {previewItem.type} • v{previewItem.version} by {previewItem.author}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {previewItem.description}
            </p>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-400 uppercase text-[10px] font-mono">Build Specifications</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">PRICE</span>
                  <span className="text-amber-300 font-bold">{previewItem.priceBricks ? `${previewItem.priceBricks} 🧱` : "FREE (0 🧱)"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">COMMUNITY DOWNLOADS</span>
                  <span>{previewItem.downloads || 42} roboticists</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleBuyOrFork(previewItem)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-98 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Fork & Add to My Studio Library</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage.text}</span>
          {toastMessage.actionBuildId && (
            <button
              onClick={() => nav(`/build?edit=${toastMessage.actionBuildId}`)}
              className="ml-2 px-2.5 py-1 rounded-lg bg-slate-950 text-emerald-400 text-[11px] font-mono hover:bg-slate-900 transition-colors flex items-center gap-1"
            >
              <span>Open in Studio</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

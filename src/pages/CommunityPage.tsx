import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Users, 
  Heart, 
  MessageSquare, 
  Copy, 
  Bot, 
  Terminal, 
  Wrench, 
  Sparkles, 
  Send,
  Check,
  Search,
  UserPlus,
  UserCheck,
  Radio,
  Star,
  GitFork,
  ExternalLink,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import { useSubscription } from "../context/SubscriptionContext";
import { buildStorage } from "../services/buildStorage";
import { pilotDirectory, type CommunityPilot } from "../services/communityPilots";
import type { AnyBuild } from "../types";
import PageOverviewBanner from "../components/PageOverviewBanner";

interface CommunityPost {
  id: string;
  authorName: string;
  authorCallsign: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  attachedBuildId?: string;
  likes: number;
  likedByMe: boolean;
  comments: Array<{ author: string; text: string; time: string }>;
}

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    authorName: "Beknur",
    authorCallsign: "Beknur",
    authorAvatar: "🤖",
    timestamp: "20 min ago",
    content: "🚀 Just finished optimizing the autonomous tracking loop for the Red Cube Hunter! With closed-loop differential drive at 20Hz, it acquires target cubes in under 3 seconds. Fork the build below and test it in the Virtual Arena!",
    attachedBuildId: "build-red-cube-hunter",
    likes: 42,
    likedByMe: false,
    comments: [
      { author: "Elena_Robo", text: "Incredible responsiveness! The Web Speech vocalization is super smooth.", time: "15 min ago" },
      { author: "TokyoMech", text: "Testing this with an ESP32 chassis over BLE right now!", time: "5 min ago" },
    ],
  },
  {
    id: "post-2",
    authorName: "Elena Robotics",
    authorCallsign: "Elena_Robo",
    authorAvatar: "🧠",
    timestamp: "2 hours ago",
    content: "Created a reusable prompt behavior for maze navigation called 'Cautious Explorer'. It enforces 25cm perimeter buffers and executes 90° pivot turns when corners are detected. Available in Prompt Builds!",
    attachedBuildId: "prompt-cautious-explorer",
    likes: 28,
    likedByMe: false,
    comments: [
      { author: "Beknur", text: "Great prompt structure! Added it to the recommended academy examples.", time: "1 hour ago" },
    ],
  },
  {
    id: "post-3",
    authorName: "Tokyo Mech Labs",
    authorCallsign: "TokyoMech",
    authorAvatar: "🏎️",
    timestamp: "Yesterday",
    content: "Industrial pick-and-place configuration: Titan Claw Manipulator! Uses inverse kinematics calculation and camera feedback to isolate targets. Ready for 3-DOF setups.",
    attachedBuildId: "build-titan-claw",
    likes: 54,
    likedByMe: true,
    comments: [
      { author: "Alex_Builder", text: "Does this require servo motors or standard DC with encoders?", time: "Yesterday" },
    ],
  },
];

export default function CommunityPage() {
  const nav = useNavigate();
  const { pilot } = useSubscription();
  const [activeTab, setActiveTab] = useState<"feed" | "pilots">("feed");
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem("omnibrick_community_posts_v2");
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });
  const [newPostText, setNewPostText] = useState("");
  const [selectedBuildId, setSelectedBuildId] = useState<string>("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeCommentDrawer, setActiveCommentDrawer] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pilot Directory State
  const [pilotsList, setPilotsList] = useState<CommunityPilot[]>(() => pilotDirectory.getAllPilots());
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

  const allBuilds = buildStorage.getAllBuilds();

  const savePosts = (updater: (prev: CommunityPost[]) => CommunityPost[]) => {
    setPosts(prev => {
      const updated = updater(prev);
      try {
        localStorage.setItem("omnibrick_community_posts_v2", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleLike = (postId: string) => {
    savePosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newLiked = !p.likedByMe;
        return {
          ...p,
          likedByMe: newLiked,
          likes: newLiked ? p.likes + 1 : p.likes - 1,
        };
      }
      return p;
    }));
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    savePosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            { author: pilot.callsign, text, time: "Just now" },
          ],
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    showToast("Comment posted!");
  };

  const handleForkFromPost = (buildId: string) => {
    const forked = buildStorage.forkBuild(buildId, pilot.callsign);
    if (forked) {
      showToast(`🎉 Cloned '${forked.name}' into your studio library!`);
      setTimeout(() => {
        nav(`/build?edit=${forked.id}`);
      }, 1000);
    }
  };

  const handleCreatePost = () => {
    if (!newPostText.trim()) return;

    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: pilot.username,
      authorCallsign: pilot.username,
      authorAvatar: "🤖",
      timestamp: "Just now",
      content: newPostText.trim(),
      attachedBuildId: selectedBuildId || undefined,
      likes: 1,
      likedByMe: true,
      comments: [],
    };

    savePosts(prev => [post, ...prev]);
    setNewPostText("");
    setSelectedBuildId("");
    showToast("🚀 Post published to the robotics community!");
  };

  const handleToggleFollowPilot = (username: string) => {
    const isNowFollowing = pilotDirectory.toggleFollow(username);
    setPilotsList(pilotDirectory.getAllPilots());
    showToast(isNowFollowing ? `Subscribed to updates from @${username}` : `Unfollowed @${username}`);
  };

  // Filtered pilots based on search and specialty chips
  const filteredPilots = useMemo(() => {
    return pilotsList.filter((p) => {
      const matchesSearch = 
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.affiliation.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (specialtyFilter === "online") return p.liveStatus.isOnline;
      if (specialtyFilter === "lego") return p.gearInventory.some(g => g.name.toLowerCase().includes("lego") || p.bio.toLowerCase().includes("lego"));
      if (specialtyFilter === "vision") return p.gearInventory.some(g => g.type === "vision") || p.bio.toLowerCase().includes("perception");
      if (specialtyFilter === "kinematics") return p.bio.toLowerCase().includes("kinematic") || p.affiliation.toLowerCase().includes("mech");

      return true;
    });
  }, [pilotsList, searchQuery, specialtyFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 lg:pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <PageOverviewBanner
          title="Сообщество пилотов"
          badge={`${pilotsList.length} пилотов`}
          description="Знакомься с инженерами со всего мира, делись логами миссий, оценивай сборки роботов и развивай сеть Neural Nexus."
          actionButton={{
            label: "Мой профиль",
            to: `/profile/${pilot.username}`,
          }}
        />
      </div>

      {/* Top Header */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-6 sm:p-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Community Hub
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              Discover fellow roboticists, fork state-of-the-art robot models, and explore GitHub & Roblox-style pilot profiles.
            </p>
          </div>

          {/* Quick Balance & My Profile Link */}
          <div className="flex items-center gap-3">
            <Link
              to={`/profile/${pilot.username}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-colors"
            >
              <span>🤖</span>
              <span>My Public Profile</span>
            </Link>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xl">🧱</span>
              <div>
                <div className="text-[9px] font-mono uppercase text-slate-400">Balance</div>
                <div className="text-xs font-black text-amber-300 font-mono">
                  {pilot.bricksBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-5xl mx-auto mt-6 flex items-center gap-2 border-b border-slate-800/60 pb-1">
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "feed"
                ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Feed & Discussions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40">{posts.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("pilots")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "pilots"
                ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pilot Directory</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/40">{pilotsList.length}</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Live Toast Banner */}
        {toastMessage && (
          <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TAB 1: FEED & DISCUSSIONS */}
        {activeTab === "feed" && (
          <div className="space-y-6">
            {/* Post Creation Box */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  {pilot.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-300">
                  Share an update or showcase a Robot Build
                </span>
              </div>

              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What robot or autonomous behavior are you engineering today?..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">Attach Build:</span>
                  <select
                    value={selectedBuildId}
                    onChange={(e) => setSelectedBuildId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-pink-500"
                  >
                    <option value="">None (Text post only)</option>
                    {allBuilds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreatePost}
                  disabled={!newPostText.trim()}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Post
                </button>
              </div>
            </div>

            {/* Community Posts Feed */}
            <div className="space-y-5">
              {posts.map((post) => {
                const attachedBuild = post.attachedBuildId 
                  ? allBuilds.find(b => b.id === post.attachedBuildId)
                  : null;

                const commentsOpen = activeCommentDrawer === post.id;

                return (
                  <div
                    key={post.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-sm"
                  >
                    {/* Author Info - CLICKABLE LINK TO GITHUB/ROBLOX PROFILE */}
                    <div className="flex items-center justify-between">
                      <Link 
                        to={`/profile/${post.authorCallsign}`}
                        className="flex items-center gap-3 group transition-transform"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm shadow-md group-hover:scale-105 transition-transform">
                          {post.authorAvatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">
                              {post.authorName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:bg-pink-500/10 group-hover:text-pink-300">
                              @{post.authorCallsign}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">{post.timestamp}</span>
                        </div>
                      </Link>

                      <Link
                        to={`/profile/${post.authorCallsign}`}
                        className="text-[11px] font-medium text-slate-400 hover:text-pink-400 flex items-center gap-1 transition-colors"
                      >
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Post Content */}
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Embedded Build Card (if attached) */}
                    {attachedBuild && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-pink-400">
                            {attachedBuild.type === "robot" ? (
                              <Bot className="w-5 h-5" />
                            ) : attachedBuild.type === "prompt" ? (
                              <Terminal className="w-5 h-5" />
                            ) : (
                              <Wrench className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{attachedBuild.name}</h4>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                                {attachedBuild.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{attachedBuild.tagline}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleForkFromPost(attachedBuild.id)}
                          className="px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Fork Build
                        </button>
                      </div>
                    )}

                    {/* Action Buttons: Like & Comment */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.likedByMe ? "text-pink-400 font-bold" : "hover:text-slate-200"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${post.likedByMe ? "fill-current text-pink-500" : ""}`} />
                          <span>{post.likes}</span>
                        </button>

                        <button
                          onClick={() => setActiveCommentDrawer(commentsOpen ? null : post.id)}
                          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comments.length} Comments</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {commentsOpen && (
                      <div className="pt-3 border-t border-slate-800 space-y-3">
                        <div className="space-y-2">
                          {post.comments.map((c, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-slate-950 text-xs space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <Link 
                                  to={`/profile/${c.author}`} 
                                  className="font-bold text-pink-400 hover:underline"
                                >
                                  @{c.author}
                                </Link>
                                <span>{c.time}</span>
                              </div>
                              <p className="text-slate-200">{c.text}</p>
                            </div>
                          ))}
                        </div>

                        {/* Add comment input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            placeholder="Add a comment..."
                            onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PILOT DIRECTORY (ROBLOX + GITHUB + HUGGINGFACE CREATORS) */}
        {activeTab === "pilots" && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pilots by username, callsign, rank, or hardware loadout..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px]">
                  {[
                    { id: "all", label: "All Pilots" },
                    { id: "online", label: "🟢 Online" },
                    { id: "lego", label: "🤖 Mindstorms" },
                    { id: "vision", label: "👁️ Vision & AI" },
                    { id: "kinematics", label: "🏎️ Kinematics" },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setSpecialtyFilter(chip.id)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        specialtyFilter === chip.id
                          ? "bg-pink-600 text-white shadow-sm shadow-pink-600/30"
                          : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pilots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPilots.map((p) => {
                const isOnline = p.liveStatus.isOnline;
                const isMe = p.username.toLowerCase() === pilot.username.toLowerCase();

                return (
                  <div
                    key={p.username}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-sm"
                  >
                    {/* Top: Avatar, Live Status, Level & Identity */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-xl shadow-md border border-slate-700">
                              {p.avatar}
                            </div>
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-slate-950 text-[9px] font-black text-cyan-400 border border-cyan-500/40">
                              LVL {p.level}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/profile/${p.username}`}
                                className="text-sm font-bold text-white hover:text-pink-400 transition-colors"
                              >
                                {p.username}
                              </Link>
                              {p.affiliation && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">
                                  {p.affiliation}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              @{p.callsign} • {p.rank}
                            </div>
                          </div>
                        </div>

                        {/* Roblox-Style Live Status Pill */}
                        <div className={`px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5 shrink-0 ${
                          isOnline
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800/50 text-slate-400 border border-slate-800"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                          <span className="max-w-[120px] truncate">{p.liveStatus.activity}</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                        {p.bio}
                      </p>

                      {/* HuggingFace Hub Stats Bar */}
                      <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center mb-3">
                        <div>
                          <div className="text-[9px] font-mono text-slate-400">Models</div>
                          <div className="text-xs font-bold text-white">{p.huggingFaceStats.robotModels}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-400">Prompts</div>
                          <div className="text-xs font-bold text-purple-400">{p.huggingFaceStats.promptBehaviors}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-400">Forks</div>
                          <div className="text-xs font-bold text-cyan-400">{p.huggingFaceStats.totalForks}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-slate-400">Stars</div>
                          <div className="text-xs font-bold text-amber-400">⭐ {p.huggingFaceStats.totalStars}</div>
                        </div>
                      </div>

                      {/* Roblox-Style Loadout Preview */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          Roblox Loadout
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                          {p.gearInventory.slice(0, 4).map((gear) => {
                            const rarityBorder = 
                              gear.rarity === "legendary" ? "border-amber-500/50 bg-amber-500/10 text-amber-300" :
                              gear.rarity === "epic" ? "border-purple-500/50 bg-purple-500/10 text-purple-300" :
                              gear.rarity === "rare" ? "border-blue-500/50 bg-blue-500/10 text-blue-300" :
                              "border-slate-700 bg-slate-800/40 text-slate-300";

                            return (
                              <div
                                key={gear.id}
                                title={`${gear.name} (${gear.rarity.toUpperCase()})`}
                                className={`px-2 py-1 rounded-lg border text-[10px] flex items-center gap-1 shrink-0 ${rarityBorder}`}
                              >
                                <span>{gear.icon}</span>
                                <span className="max-w-[100px] truncate">{gear.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Followers + Action Buttons */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="text-[11px] font-mono text-slate-400">
                        <span className="font-bold text-white">{p.followersCount}</span> followers
                      </div>

                      <div className="flex items-center gap-2">
                        {!isMe && (
                          <button
                            onClick={() => handleToggleFollowPilot(p.username)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              p.isFollowing
                                ? "bg-slate-800 text-slate-300 border border-slate-700 hover:border-rose-500/40 hover:text-rose-400"
                                : "bg-pink-600 hover:bg-pink-500 text-white shadow-sm shadow-pink-600/20"
                            }`}
                          >
                            {p.isFollowing ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Follow</span>
                              </>
                            )}
                          </button>
                        )}

                        <Link
                          to={`/profile/${p.username}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredPilots.length === 0 && (
              <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                <Users className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No roboticists found</h3>
                <p className="text-xs text-slate-400">Try adjusting your search query or clear the filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

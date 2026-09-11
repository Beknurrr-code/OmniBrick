import React from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight, Sparkles } from "lucide-react";

interface Props {
  title: string;
  badge?: string;
  description: string;
  icon?: React.ReactNode;
  actionButton?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
}

export default function PageOverviewBanner({
  title,
  badge,
  description,
  icon,
  actionButton,
}: Props) {
  return (
    <div className="mb-4 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
      <div className="flex items-start sm:items-center gap-3">
        <Link
          to="/"
          title="Вернуться в главное меню"
          className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer shrink-0 group shadow-sm"
        >
          <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </Link>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 text-xs font-mono hidden sm:inline">Меню</span>
            <ChevronRight className="w-3 h-3 text-slate-600 hidden sm:inline" />
            <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 tracking-tight">
              {icon}
              <span>{title}</span>
            </h1>
            {badge && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 max-w-xl line-clamp-1 sm:line-clamp-none">
            {description}
          </p>
        </div>
      </div>

      {actionButton && (
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          {actionButton.to ? (
            <Link
              to={actionButton.to}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 transition-all shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{actionButton.label}</span>
            </Link>
          ) : (
            <button
              onClick={actionButton.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{actionButton.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

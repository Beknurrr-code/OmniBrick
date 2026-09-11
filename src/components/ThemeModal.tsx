import { X, Check, Palette, Sparkles, Moon, Sun, Terminal, Laptop } from "lucide-react";
import { useTheme, THEME_OPTIONS, type ThemeId } from "../context/ThemeContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeModal({ isOpen, onClose }: Props) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Programmer Themes</h2>
            <p className="text-xs text-slate-400">Choose your favorite cockpit aesthetic & IDE color scheme</p>
          </div>
        </div>

        {/* Theme List */}
        <div className="grid grid-cols-1 gap-2.5 pt-2">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setTheme(opt.id);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? "bg-slate-800/90 border-cyan-400 shadow-md shadow-cyan-500/10"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Theme Swatch Preview Badge */}
                  <div 
                    className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner relative overflow-hidden shrink-0"
                    style={{ 
                      backgroundColor: opt.bgHex, 
                      borderColor: isSelected ? opt.accentHex : "rgba(255,255,255,0.15)" 
                    }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: opt.accentHex }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {opt.name}
                      </span>
                      {opt.id === "oled" && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
                          OLED Black
                        </span>
                      )}
                      {opt.id === "light" && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                          Light Mode
                        </span>
                      )}
                      {opt.id === "matrix" && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Hacker CRT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {opt.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-slate-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono">Instant hot-swap • Saved to device</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ThemeId = "oled" | "tokyo" | "light" | "matrix" | "monokai" | "nord" | "dracula";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  tagline: string;
  bgHex: string;
  cardHex: string;
  accentHex: string;
  textColor: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "oled",
    name: "Minimalist OLED Black",
    tagline: "Ultra-clean pure #000000 monochrome, zero blue tint, maximum contrast",
    bgHex: "#000000",
    cardHex: "#0c0c0e",
    accentHex: "#ffffff",
    textColor: "#ffffff",
    isDark: true,
  },
  {
    id: "light",
    name: "Clean Paper White",
    tagline: "Daylight readability, crisp slate typography, sharp minimalist borders",
    bgHex: "#f8fafc",
    cardHex: "#ffffff",
    accentHex: "#2563eb",
    textColor: "#0f172a",
    isDark: false,
  },
  {
    id: "tokyo",
    name: "Tokyo Night / Cyberpunk",
    tagline: "Deep navy night with neon cyan glow and electric indigo highlights",
    bgHex: "#030712",
    cardHex: "#0f172a",
    accentHex: "#06b6d4",
    textColor: "#f8fafc",
    isDark: true,
  },
  {
    id: "matrix",
    name: "Hacker Matrix Green",
    tagline: "Classic green-on-black CRT terminal phosphor for terminal purists",
    bgHex: "#020703",
    cardHex: "#041407",
    accentHex: "#22c55e",
    textColor: "#4ade80",
    isDark: true,
  },
  {
    id: "monokai",
    name: "Monokai Pro",
    tagline: "Beloved programmer palette: warm dark charcoal, gold amber, and vivid coral",
    bgHex: "#19181a",
    cardHex: "#221f22",
    accentHex: "#ffd866",
    textColor: "#fcfcfa",
    isDark: true,
  },
  {
    id: "nord",
    name: "Nordic Arctic Frost",
    tagline: "Clean Scandinavian polar night slate paired with calm glacial blue",
    bgHex: "#242933",
    cardHex: "#2e3440",
    accentHex: "#88c0d0",
    textColor: "#eceff4",
    isDark: true,
  },
  {
    id: "dracula",
    name: "Dracula Twilight",
    tagline: "Gothic dark violet with neon purple, pink, and cyan accents",
    bgHex: "#1e1f29",
    cardHex: "#282a36",
    accentHex: "#bd93f9",
    textColor: "#f8f8f2",
    isDark: true,
  },
];

interface ThemeContextValue {
  theme: ThemeId;
  themeConfig: ThemeOption;
  setTheme: (t: ThemeId) => void;
  availableThemes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem("omnibrick_theme") as ThemeId;
      if (saved && THEME_OPTIONS.some((o) => o.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    // Default to minimalist OLED black
    return "oled";
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    try {
      localStorage.setItem("omnibrick_theme", t);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const themeConfig = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        setTheme,
        availableThemes: THEME_OPTIONS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

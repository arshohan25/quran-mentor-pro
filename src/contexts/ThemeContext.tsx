import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePublicAppConfig } from "@/hooks/usePublicAppConfig";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const { branding } = usePublicAppConfig();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply admin branding tokens to CSS variables live
  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;
    if (branding.primary_hsl) root.style.setProperty("--primary", branding.primary_hsl);
    if (branding.accent_hsl) root.style.setProperty("--accent", branding.accent_hsl);
    if (branding.gold_hsl) root.style.setProperty("--gold", branding.gold_hsl);
  }, [branding?.primary_hsl, branding?.accent_hsl, branding?.gold_hsl]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

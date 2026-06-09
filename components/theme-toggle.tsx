"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("fedfin-theme");
    const nextTheme = stored === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("fedfin-theme", nextTheme);
  }

  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button className="theme-button" type="button" onClick={toggleTheme} aria-label="Toggle display theme" title="Toggle display theme">
      <Icon size={16} />
      <span>{theme === "dark" ? "Light display" : "Dark display"}</span>
    </button>
  );
}

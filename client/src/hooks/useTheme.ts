import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar localStorage primeiro
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) return stored;
    
    // Caso contrário, usar preferência do sistema
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remover classe anterior
    root.classList.remove("light", "dark");
    
    // Adicionar nova classe
    root.classList.add(theme);
    
    // Salvar no localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
}

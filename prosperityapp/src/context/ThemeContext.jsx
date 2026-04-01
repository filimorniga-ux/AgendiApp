// ===== INICIO: src/context/ThemeContext.jsx (Multi-Theme System) =====
import React, { createContext, useState, useEffect, useCallback } from 'react';

/**
 * THEME_LIST — Catálogo de temas disponibles.
 * Cada tema tiene: id (CSS class), label, emoji, isDark, y colores para preview cards.
 */
export const THEME_LIST = [
  {
    id: 'light',
    label: 'Claro',
    emoji: '☀️',
    isDark: false,
    colors: ['#F3F4F6', '#FFFFFF', '#D69E2E', '#E5E7EB', '#111827'],
    description: 'Limpio y profesional',
  },
  {
    id: 'dark',
    label: 'Oscuro',
    emoji: '🌙',
    isDark: true,
    colors: ['#1A202C', '#2D3748', '#F6E05E', '#4A5568', '#EDF2F7'],
    description: 'Elegante y nocturno',
  },
  {
    id: 'rose',
    label: 'Rosa',
    emoji: '💗',
    isDark: false,
    colors: ['#FFF0F5', '#FFFFFF', '#E91E8C', '#FCE4EC', '#3D2B3D'],
    description: 'Perfecto para spas y salones',
  },
  {
    id: 'dark-gold',
    label: 'Oro Oscuro',
    emoji: '✨',
    isDark: true,
    colors: ['#0D0D0D', '#1A1A1A', '#C8A950', '#2A2520', '#F5F0E8'],
    description: 'Lujo y sofisticación',
  },
  {
    id: 'glass',
    label: 'Cristal',
    emoji: '🌊',
    isDark: false,
    colors: ['#F5F5F7', '#FFFFFF', '#007AFF', '#E5E7EB', '#1D1D1F'],
    description: 'Estilo Apple minimalista',
  },
  {
    id: 'nature',
    label: 'Naturaleza',
    emoji: '🌿',
    isDark: false,
    colors: ['#F5F5F0', '#FAFAF5', '#2D7D46', '#E8E8DB', '#2C3E2C'],
    description: 'Bienestar y armonía',
  },
  {
    id: 'sunset',
    label: 'Atardecer',
    emoji: '🌅',
    isDark: true,
    colors: ['#1C1410', '#2A1F18', '#FF6B35', '#3D2E24', '#F5E6D8'],
    description: 'Cálido y acogedor',
  },
  {
    id: 'lavender',
    label: 'Lavanda',
    emoji: '💜',
    isDark: false,
    colors: ['#F5F0FF', '#FDFBFF', '#7C3AED', '#EDE5FF', '#2D1B4E'],
    description: 'Clínico y relajante',
  },
  {
    id: 'dark-pink',
    label: 'Dark Pink',
    emoji: '🖤',
    isDark: true,
    colors: ['#0A0A0A', '#141414', '#FF2D8A', '#1E1E1E', '#FFFFFF'],
    description: 'Glam y moderno',
  },
];

/** Set of dark theme IDs for quick lookup */
const DARK_THEME_IDS = new Set(THEME_LIST.filter(t => t.isDark).map(t => t.id));

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // 1. Leer la preferencia del usuario en localStorage
    const localTheme = localStorage.getItem('theme');
    if (localTheme && THEME_LIST.some(t => t.id === localTheme)) {
      return localTheme;
    }
    // 2. Si no hay, usar la preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // 3. Por defecto, usar claro
    return 'light';
  });

  // Aplica el tema al DOM
  useEffect(() => {
    const root = window.document.documentElement;

    // Remover todas las clases de tema existentes
    THEME_LIST.forEach(t => {
      root.classList.remove(`theme-${t.id}`);
    });
    // Compat: también remover la vieja clase 'dark'
    root.classList.remove('dark');

    // Aplicar la nueva clase de tema (light no necesita clase, es :root default)
    if (theme !== 'light') {
      root.classList.add(`theme-${theme}`);
    }

    // Agregar 'dark' class para retrocompatibilidad con dark: utilities de Tailwind
    if (DARK_THEME_IDS.has(theme)) {
      root.classList.add('dark');
    }

    // Persistir
    localStorage.setItem('theme', theme);
  }, [theme]);

  /** Set a specific theme by ID */
  const setTheme = useCallback((themeId) => {
    if (THEME_LIST.some(t => t.id === themeId)) {
      setThemeState(themeId);
    }
  }, []);

  /** Toggle: cicla al siguiente tema en la lista */
  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const currentIndex = THEME_LIST.findIndex(t => t.id === prev);
      const nextIndex = (currentIndex + 1) % THEME_LIST.length;
      return THEME_LIST[nextIndex].id;
    });
  }, []);

  /** Is the current theme dark-based? */
  const isDark = DARK_THEME_IDS.has(theme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, THEME_LIST }}>
      {children}
    </ThemeContext.Provider>
  );
};
// ===== FIN: src/context/ThemeContext.jsx =====
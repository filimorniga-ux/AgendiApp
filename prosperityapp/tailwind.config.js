// ===== INICIO: tailwind.config.js =====
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilitar modo oscuro basado en clase
  theme: {
    extend: {
      colors: {
        // Definición de colores semánticos
        'accent': 'var(--color-accent)',
        'accent-text': 'var(--color-accent-text)',
        
        'bg-main': 'var(--color-bg-main)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        
        'text-main': 'var(--color-text-main)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        
        'border-main': 'var(--color-border-main)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
// ===== FIN: tailwind.config.js =====

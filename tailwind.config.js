/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Foundation
        "void":       "#f8fafc",
        "abyss":      "#f1f5f9",
        "deep":       "#e2e8f0",
        "surface":    "#ffffff",
        "surface-mid":"#f8fafc",
        "surface-high":"#f1f5f9",

        // Green Primary System
        "electric":        "#16a34a",
        "electric-bright": "#22c55e",
        "electric-dim":    "#15803d",
        "electric-glow":   "rgba(22,163,74,0.12)",
        "electric-border": "rgba(22,163,74,0.25)",

        // Teal Accent
        "cyan-accent":  "#0d9488",
        "cyan-bright":  "#14b8a6",
        "cyan-dim":     "#0f766e",

        // Emerald  
        "emerald-active": "#059669",
        "emerald-bright": "#10b981",
        "emerald-dim":    "#047857",
        "emerald-glow":   "rgba(5,150,105,0.1)",
        "emerald-border": "rgba(5,150,105,0.2)",

        // Amber Warning
        "amber-warning": "#d97706",
        "amber-bright":  "#f59e0b",
        "amber-glow":    "rgba(217,119,6,0.12)",

        // Rose Error
        "rose-error":  "#dc2626",
        "rose-bright": "#ef4444",
        "rose-glow":   "rgba(220,38,38,0.1)",

        // Violet
        "violet-accent": "#7c3aed",
        "violet-bright": "#8b5cf6",
        "violet-glow":   "rgba(124,58,237,0.1)",

        // Text System — dark on light
        "text-primary":   "#0f172a",
        "text-secondary": "#475569",
        "text-muted":     "#94a3b8",
        "text-ghost":     "#cbd5e1",

        // Border System
        "border-subtle": "rgba(15,23,42,0.05)",
        "border-normal": "rgba(15,23,42,0.1)",
        "border-strong": "rgba(15,23,42,0.18)",
        "border-electric": "rgba(22,163,74,0.35)",
      },
      backgroundImage: {
        'gradient-electric': 'linear-gradient(135deg, #16a34a 0%, #14b8a6 100%)',
        'gradient-emerald':  'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        'gradient-fire':     'linear-gradient(135deg, #d97706 0%, #dc2626 100%)',
        'gradient-violet':   'linear-gradient(135deg, #7c3aed 0%, #16a34a 100%)',
        'gradient-card':     'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        'grid-pattern':      `linear-gradient(rgba(22,163,74,0.04) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(22,163,74,0.04) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      borderRadius: {
        "sm": "6px", "DEFAULT": "10px", "md": "12px",
        "lg": "16px", "xl": "20px", "2xl": "24px",
        "3xl": "32px", "full": "9999px"
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.04)',
        'card-hover': '0 4px 20px rgba(15,23,42,0.12), 0 1px 4px rgba(15,23,42,0.06)',
        'electric':   '0 0 20px rgba(22,163,74,0.2), 0 0 60px rgba(22,163,74,0.08)',
        'electric-sm':'0 0 10px rgba(22,163,74,0.2)',
        'emerald':    '0 0 20px rgba(5,150,105,0.2)',
        'amber':      '0 0 20px rgba(217,119,6,0.2)',
        'rose':       '0 0 20px rgba(220,38,38,0.2)',
        'glow-green': '0 0 30px rgba(22,163,74,0.15)',
        'sidebar':    '1px 0 0 rgba(15,23,42,0.07)',
        'header':     '0 1px 0 rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.03)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'float':      'float 6s ease-in-out infinite',
        'scan':       'scan 3s ease-in-out infinite',
        'slide-in':   'slideIn 0.3s ease-out',
        'fade-in':    'fadeIn 0.4s ease-out',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 8px rgba(22,163,74,0.15)' },
          '100%': { boxShadow: '0 0 25px rgba(22,163,74,0.4), 0 0 50px rgba(22,163,74,0.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%':   { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-10px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        fadeIn: {
          '0%':   { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#f8f9fa',
          dark: '#0a0a0a',
        },
        foreground: {
          DEFAULT: '#1a1a1a',
          dark: '#f5f5f5',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#1a1a1a',
          foreground: {
            DEFAULT: '#1a1a1a',
            dark: '#f5f5f5',
          },
        },
        popover: {
          DEFAULT: '#ffffff',
          dark: '#1a1a1a',
          foreground: {
            DEFAULT: '#1a1a1a',
            dark: '#f5f5f5',
          },
        },
        primary: {
          DEFAULT: '#1a1a1a',
          dark: '#ffffff',
          foreground: {
            DEFAULT: '#ffffff',
            dark: '#000000',
          },
        },
        secondary: {
          DEFAULT: '#f0f0f0',
          dark: '#2a2a2a',
          foreground: {
            DEFAULT: '#1a1a1a',
            dark: '#f5f5f5',
          },
        },
        muted: {
          DEFAULT: '#e0e0e0',
          dark: '#3a3a3a',
          foreground: {
            DEFAULT: '#666666',
            dark: '#a0a0a0',
          },
        },
        accent: {
          DEFAULT: '#00d4d4',
          dark: '#00d4d4',
          foreground: {
            DEFAULT: '#1a1a1a',
            dark: '#000000',
          },
        },
        destructive: {
          DEFAULT: '#dc2626',
          dark: '#ef4444',
          foreground: {
            DEFAULT: '#ffffff',
            dark: '#ffffff',
          },
        },
        border: {
          DEFAULT: '#e0e0e0',
          dark: '#2a2a2a',
        },
        input: {
          DEFAULT: '#f0f0f0',
          dark: '#2a2a2a',
        },
        ring: {
          DEFAULT: '#00d4d4',
          dark: '#00d4d4',
        },
        chart: {
          1: { DEFAULT: '#3b82f6', dark: '#60a5fa' },
          2: { DEFAULT: '#8b5cf6', dark: '#a78bfa' },
          3: { DEFAULT: '#ec4899', dark: '#f472b6' },
          4: { DEFAULT: '#f59e0b', dark: '#fbbf24' },
          5: { DEFAULT: '#10b981', dark: '#34d399' },
        },
      },
      borderRadius: {
        custom: '0.625rem', // 10px
      },
    },
  },
  plugins: [],
}
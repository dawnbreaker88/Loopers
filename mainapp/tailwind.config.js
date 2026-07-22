/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#40A2E3', // Loopers Primary Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        brand: {
          blue: '#40A2E3',
          dark: '#004bfaff',
          surface: '#FFFFFF',
          darkSurface: '#1E293B',
          border: '#E2E8F0',
          darkBorder: '#334155',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          subtext: '#64748B'
        },
        sys: {
          surface: 'var(--sys-surface)',
          'surface-secondary': 'var(--sys-surface-secondary)',
          border: 'var(--sys-border)',
          'text-primary': 'var(--sys-text-primary)',
          'text-secondary': 'var(--sys-text-secondary)',
          error: 'var(--sys-error)',
          success: 'var(--sys-success)',
          warning: 'var(--sys-warning)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'card': '0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'glow': '0 0 20px -3px rgba(64, 162, 227, 0.3)',
      }
    },
  },
  plugins: [],
}

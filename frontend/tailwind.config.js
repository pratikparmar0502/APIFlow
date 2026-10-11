/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // APIFlow Design System
        'app-bg': '#0B0B0D',
        'secondary-bg': '#111114',
        'panel': '#17171B',
        'border': '#2A2A30',
        'yellow': '#F5D90A',
        'yellow-hover': '#FFE34D',
        'text-primary': '#F5F5F5',
        'text-secondary': '#A3A3AD',
        'success': '#22C55E',
        'failure': '#EF4444',
        'warning': '#F59E0B',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

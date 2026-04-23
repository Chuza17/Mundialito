/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fifa: {
          blue: '#326295',
          'blue-dark': '#1e3a5f',
          'blue-light': '#4a7eb8',
          gold: '#B8860B',
          'gold-light': '#DAA520',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        dark: {
          100: '#1a1a2e',
          200: '#16213e',
          300: '#0f3460',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 25px 70px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        pitch:
          'radial-gradient(circle at top left, rgba(184, 134, 11, 0.18), transparent 25%), radial-gradient(circle at bottom right, rgba(50, 98, 149, 0.22), transparent 35%)',
      },
    },
  },
  plugins: [],
}

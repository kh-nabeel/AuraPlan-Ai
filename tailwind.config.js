/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        tinker: {
          lime: '#C3FF16',
          lavender: '#C7AEE8',
          lilac: '#F2E8FE',
          yellow: '#FFE816',
          amber: '#FD9800',
          mint: '#97F8B7',
          blue: '#5F5CE5',
          cream: '#FAF8F5',
          dark: '#111215'
        }
      },
      boxShadow: {
        'brutal': '3px 3px 0px #000000',
        'brutal-lg': '5px 5px 0px #000000',
        'brutal-sm': '2px 2px 0px #000000',
        'brutal-dark': '3px 3px 0px rgba(255, 255, 255, 0.25)',
        'brutal-dark-lg': '5px 5px 0px rgba(255, 255, 255, 0.3)',
        'brutal-lime': '4px 4px 0px #C3FF16'
      }
    }
  },
  plugins: []
};

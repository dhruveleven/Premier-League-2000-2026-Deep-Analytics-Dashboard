/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: '#1D0024',
          900: '#25002C',
          800: '#2E0036',
          700: '#33003A',
          600: '#45004F',
        },
        pl: {
          purple:  '#7C3AED',
          green:   '#00FF87',
          sky:     '#7C3AED',
          magenta: '#FF0055',
          lilac:   '#A78BFA',
        },
        surface: {
          DEFAULT: '#2E0036',
          raised:  '#33003A',
          border:  '#5B1B64',
          muted:   '#4A1253',
        },
        gray: {
          100: '#FFFFFF',
          200: '#F5F3FF',
          300: '#E9D5FF',
          400: '#C4B5FD',
          500: '#A78BFA',
          600: '#8B78C7',
        },
        red: {
          400: '#FF0055',
          500: '#FF0055',
        },
        yellow: {
          400: '#A78BFA',
          500: '#7C3AED',
        },
        orange: {
          400: '#FF0055',
        },
      },
      fontFamily: {
        sans:    ['League Spartan', 'sans-serif'],
        mono:    ['League Spartan', 'sans-serif'],
        display: ['League Spartan', 'sans-serif'],
      },
      fontSize: {
        xs:    ['0.875rem', { lineHeight: '1.25rem'  }],
        sm:    ['1rem',     { lineHeight: '1.5rem'   }],
        base:  ['1.1rem',   { lineHeight: '1.65rem'  }],
        lg:    ['1.2rem',   { lineHeight: '1.8rem'   }],
        xl:    ['1.35rem',  { lineHeight: '1.95rem'  }],
        '2xl': ['1.6rem',   { lineHeight: '2.1rem'   }],
        '3xl': ['1.95rem',  { lineHeight: '2.35rem'  }],
        '4xl': ['2.4rem',   { lineHeight: '2.7rem'   }],
      },
    },
  },
  plugins: [],
}
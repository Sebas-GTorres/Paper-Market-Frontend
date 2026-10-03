/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1565C0',
          50:  '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        secondary: {
          DEFAULT: '#FFC107',
          light: '#FFD54F',
          dark:  '#FF8F00',
        },
        success: {
          DEFAULT: '#4CAF50',
          light: '#A5D6A7',
          dark:  '#2E7D32',
        },
        warning: {
          DEFAULT: '#FF9800',
          light: '#FFCC80',
          dark:  '#E65100',
        },
        danger: {
          DEFAULT: '#D32F2F',
          light: '#EF9A9A',
          dark:  '#B71C1C',
        },
        background: '#F8F9FA',
        'text-primary':   '#212121',
        'text-secondary': '#616161',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        modal: '0 8px 32px rgba(0,0,0,0.18)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-in-out',
        'slide-in':   'slideIn 0.25s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },             '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateY(-8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

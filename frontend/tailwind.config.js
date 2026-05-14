/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
          dark: '#0f172a'
        }
      },
      boxShadow: {
        soft: '0 18px 40px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

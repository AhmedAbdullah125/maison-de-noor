/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './{App,index}.tsx', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { app: { bg: '#F6F2FA', card: '#E8E0EF', gold: '#483383', goldDark: '#352C48', text: '#100F19', textSec: '#6E585B' } },
      fontFamily: { sans: ['Alexandria', 'sans-serif'], alexandria: ['Alexandria', 'sans-serif'], amiri: ['Amiri', 'serif'] },
    },
  },
  plugins: [],
};

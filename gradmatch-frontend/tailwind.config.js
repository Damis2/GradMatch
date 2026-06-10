/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0f172a',
          900: '#1e293b',
          800: '#334155',
          700: '#475569',
        }
      }
    },
  },
  plugins: [],
}
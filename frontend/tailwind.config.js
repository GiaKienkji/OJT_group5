/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1d4ed8',
          600: '#0284c7',
          700: '#0B4F8A',
          800: '#073b68',
          900: '#0c2e4e',
        }
      }
    },
  },
  plugins: [],
}

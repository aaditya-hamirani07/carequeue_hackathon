/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          p1: '#ef4444',
          p2: '#f97316',
          p3: '#eab308',
          p4: '#10b981',
        }
      }
    },
  },
  plugins: [],
}

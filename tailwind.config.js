/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'deep-green': '#0D4F3C',
        'amber-gold': '#D4A853',
        'warm-white': '#FAF8F5',
        'soft-red': '#C9564B',
        'emerald-green': '#2D8659',
      },
      fontFamily: {
        lora: ['Lora', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

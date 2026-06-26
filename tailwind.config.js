/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- এই লাইনটি যোগ করা হলো
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#080c18",
          900: "#0a0e1a",
          800: "#0d1225",
          700: "#111827",
        },
      },
      fontFamily: {
        sans: ["Hind Siliguri", "Noto Sans Bengali", "system-ui", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
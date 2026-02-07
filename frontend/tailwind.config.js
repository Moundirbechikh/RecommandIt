/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        parisienne: ['"Parisienne"', 'cursive'],
        dancing: ['"Dancing Script"', 'cursive'],
        vibes: ['"Great Vibes"', 'cursive'],
        sacramento: ['"Sacramento"', 'cursive'],
        pacifico: ['"Pacifico"', 'cursive'],
        cursive: ['cursive'],
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
        animation: {
          marquee: "marquee 20s linear infinite",
          marqueeReverse: "marqueeReverse 20s linear infinite",
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }, // gauche → droite
        },
        marqueeReverse: {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" }, // droite → gauche
        },

      },
    },
  },
  plugins: [],
}


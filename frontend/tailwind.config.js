/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Table + felt palette
        table: "#0b5d3b",
        felt: "#0d6b45",
        emeraldDeep: "#025b38",

        // Chips / accents
        chipRed: "#c0392b",
        chipBlue: "#2471a3",
        chipBlack: "#1b1b1b",
        gold: "#d4af37",
        silver: "#dfe6e9",

        // UI neutrals
        ink: "#0e0e0e",
        paper: "#fefefe",
      },

      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui"],
        display: ["Belleza", "sans-serif"],
        cursive: ["Ballet", "cursive"],
      },


      boxShadow: {
        card: "0 8px 20px rgba(0,0,0,0.3)",
        soft: "0 4px 16px rgba(0,0,0,0.15)",
        insetFelt: "inset 0 3px 8px rgba(0,0,0,0.4)",
      },

      borderRadius: {
        "2xl": "1.25rem",
      },

      backgroundImage: {
        tablePattern:
          "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        tablePattern: "20px 20px",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

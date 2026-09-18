import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        // Deep Burgundy / Dark Maroon
        primary: {
          50: "#F8EEEC",
          100: "#EEDBD7",
          200: "#DDB7B0",
          300: "#C99086",
          400: "#A95D51",
          500: "#7A332A",
          600: "#5A251F",
          700: "#3A1A16",
          800: "#2D1411",
          900: "#21100D",
          950: "#160A08",
          DEFAULT: "#3A1A16",
        },

        // Warm Cream / Soft Ivory
        secondary: {
          50: "#FFFFFF",
          100: "#FDFBF7",
          200: "#F9F5EF",
          300: "#F2ECE3",
          400: "#E8DED2",
          500: "#D8CBBE",
          600: "#C4B4A5",
          700: "#A89485",
          800: "#806E61",
          900: "#5A4A42",
          950: "#2B211F",
          DEFAULT: "#FDFBF7",
        },

        // Spicy Red / Coral
        accent: {
          50: "#FFF1EE",
          100: "#FFDCD5",
          200: "#FFB9AD",
          300: "#F98D7C",
          400: "#E86652",
          500: "#C93E2B",
          600: "#AF3021",
          700: "#912619",
          800: "#762018",
          900: "#5E1C16",
          950: "#3B100C",
          DEFAULT: "#C93E2B",
        },

        // Charcoal Brown
        charcoal: {
          50: "#F7F4F2",
          100: "#EDE8E5",
          200: "#DDD5D1",
          300: "#C2B7B2",
          400: "#9D8F89",
          500: "#786A64",
          600: "#5E514C",
          700: "#493D39",
          800: "#392F2C",
          900: "#2B211F",
          950: "#1C1412",
          DEFAULT: "#2B211F",
        },

        // Cream background
        cream: {
          50: "#FDFBF7",
          100: "#FBF8F2",
          200: "#F7F2EA",
          300: "#F1E9DF",
          400: "#E8DED2",
          500: "#D8CBBE",
          DEFAULT: "#FDFBF7",
        },

        // Main backgrounds
        background: {
          DEFAULT: "#FDFBF7",
          cream: "#FDFBF7",
          white: "#FFFFFF",
          burgundy: "#3A1A16",
        },

        // Text colors
        text: {
          dark: "#2B211F",
          light: "#FFFFFF",
        },

        // Keep success available for future UI states
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          DEFAULT: "#059669",
        },
      },

      fontFamily: {
        display: [
          "var(--font-cormorant)",
          "Playfair Display",
          "Georgia",
          "serif",
        ],

        serif: [
          "var(--font-cormorant)",
          "Playfair Display",
          "Georgia",
          "serif",
        ],

        sans: [
          "var(--font-poppins)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
        sm: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0em" }],
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.011em" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.014em" }],
        xl: ["1.25rem", { lineHeight: "1.875rem", letterSpacing: "-0.017em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.022em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.025em" }],
        "5xl": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.03em" }],
        "6xl": ["3.75rem", { lineHeight: "1.08", letterSpacing: "-0.035em" }],
        "7xl": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
      },
    },
  },

  plugins: [],
};

export default config;
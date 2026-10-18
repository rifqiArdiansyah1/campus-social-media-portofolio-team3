import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch "Academic Modernist" Design System Palette
        primary: {
          DEFAULT: "#2a14b4",
          container: "#4338ca",
          fixed: "#e3dfff",
          "fixed-dim": "#c3c0ff",
        },
        secondary: {
          DEFAULT: "#006a61",
          container: "#86f2e4",
          fixed: "#89f5e7",
        },
        surface: {
          DEFAULT: "#faf8ff",
          canvas: "#F8FAFC",
          card: "#FFFFFF",
          container: "#eaedff",
          "container-low": "#f2f3ff",
          "container-high": "#e2e7ff",
          "container-highest": "#dae2fd",
          variant: "#dae2fd",
          dim: "#d2d9f4",
          bright: "#faf8ff",
        },
        "on-surface": "#131b2e",
        "on-surface-variant": "#464554",
        "match-emerald": "#10B981",
        "recruiting-coral": "#F43F5E",
        "border-subtle": "#E2E8F0",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "sans-serif"],
        label: ["var(--font-inter)", "sans-serif"],
        body: ["var(--font-plus-jakarta)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

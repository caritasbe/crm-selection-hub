import type { Config } from "tailwindcss";

// Palette officielle Caritas International (charte graphique) + neutres chauds de l'interface.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        caritas: { red: "#E20817", black: "#000000", orange: "#FF5823", fuchsia: "#FF21A6", beige: "#F7DAD0" },
        ink: { DEFAULT: "#1A1615", soft: "#4A4240", mute: "#7A706C", faint: "#A69C98" },
        paper: { DEFAULT: "#FBF8F6", card: "#FFFFFF", warm: "#F5EEEA", line: "#E9E1DC", deep: "#EFE6E1" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,22,21,0.04), 0 1px 1px rgba(26,22,21,0.03)",
        lift: "0 8px 24px -8px rgba(26,22,21,0.12), 0 2px 6px rgba(26,22,21,0.05)",
      },
      borderRadius: { xl2: "1.125rem" },
    },
  },
  plugins: [],
};
export default config;

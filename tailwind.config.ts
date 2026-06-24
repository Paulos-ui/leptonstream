import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Warm Value, Cold Intelligence"
        ink: "#16100C",        // deep warm espresso-black base
        amber: "#F6A92B",      // value in motion (head of the flow)
        coral: "#FF6B57",      // value settling (tail of the flow)
        periwinkle: "#8B8BFA", // agent intelligence (cool against the warm)
        cream: "#F4ECDD",      // editorial text / light surfaces
        verdigris: "#5E8F86",  // settled / confirmed (oxidized aqueduct copper)
        paper: "#EFE9DD",      // warm editorial page background
        leaf: "#5BA013",       // signature green — value in flight
        muted: "#6F6656",      // secondary ink on paper
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
    },
  },
  plugins: [],
};

export default config;

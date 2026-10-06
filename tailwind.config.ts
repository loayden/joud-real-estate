import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ["var(--font-arabic)", "Tahoma", "sans-serif"],
      arabic: ["var(--font-arabic)", "Tahoma", "sans-serif"],
      latin: ["var(--font-latin)", "system-ui", "sans-serif"],
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          50: "#EDF2FA",
          100: "#D6E3F5",
          200: "#ADC7EB",
          300: "#7AA3DC",
          400: "#4A7FCC",
          500: "#2A5FAD",
          600: "#1B4B8A",
          700: "#163D73",
          800: "#112F5B",
          900: "#0C2144",
          950: "#081A36",
          DEFAULT: "#1B4B8A",
          foreground: "#FFFFFF",
        },
        gold: {
          50: "#FBF6E8",
          100: "#F5E9C5",
          200: "#EBD49D",
          300: "#DFBE74",
          400: "#C9A84C",
          500: "#B8953A",
          600: "#9A7C30",
          700: "#7C6326",
          800: "#5E4A1C",
          900: "#403212",
          DEFAULT: "#C9A84C",
          foreground: "#1A1A1A",
        },
        success: {
          DEFAULT: "#2D7A4F",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#B87A1A",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#C4362A",
          foreground: "#FFFFFF",
        },
        info: {
          DEFAULT: "#2A5FAD",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        none: "0",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        full: "9999px",
      },
      boxShadow: {
        none: "none",
        xs: "0 1px 2px rgba(26,26,26,0.04)",
        sm: "0 1px 2px rgba(26,26,26,0.05), 0 4px 16px rgba(26,26,26,0.06)",
        md: "0 1px 2px rgba(26,26,26,0.05), 0 8px 24px rgba(26,26,26,0.08)",
        lg: "0 2px 4px rgba(26,26,26,0.05), 0 16px 40px rgba(26,26,26,0.10)",
        soft: "0 8px 32px rgba(26,26,26,0.08)",
        subtle: "0 2px 8px rgba(26,26,26,0.06)",
        lift: "0 2px 6px rgba(12,33,68,0.08), 0 16px 40px rgba(12,33,68,0.14)",
        glow: "0 0 0 1px rgba(201,168,76,0.35), 0 8px 24px rgba(201,168,76,0.25)",
      },
      fontSize: {
        display: [
          "3rem",
          { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" },
        ],
        h1: [
          "2.25rem",
          { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.01em" },
        ],
        h2: ["1.875rem", { lineHeight: "1.2", fontWeight: "600" }],
        h3: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        h4: ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.65", fontWeight: "400" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
        small: ["0.875rem", { lineHeight: "1.5", fontWeight: "500" }],
        caption: ["0.75rem", { lineHeight: "1.5", fontWeight: "500" }],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.92) translateY(8px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.28s ease-out",
        "slide-up": "slide-up 0.28s cubic-bezier(0.22,1,0.36,1)",
        "slide-down": "slide-down 0.28s cubic-bezier(0.22,1,0.36,1)",
        "scale-in": "scale-in 0.18s ease-out",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "reveal-up": "reveal-up 0.5s cubic-bezier(0.22,1,0.36,1)",
        "pop-in": "pop-in 0.32s cubic-bezier(0.34,1.3,0.64,1)",
      },
    },
  },
  plugins: [],
};
export default config;

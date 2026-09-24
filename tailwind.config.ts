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
        sm: "0 2px 8px rgba(26,26,26,0.06)",
        md: "0 4px 16px rgba(26,26,26,0.08)",
        lg: "0 8px 32px rgba(26,26,26,0.10)",
        soft: "0 8px 32px rgba(26,26,26,0.08)",
        subtle: "0 2px 8px rgba(26,26,26,0.06)",
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
      },
      animation: {
        "fade-in": "fade-in 0.28s ease-out",
        "slide-up": "slide-up 0.28s ease-out",
        "slide-down": "slide-down 0.28s ease-out",
        "scale-in": "scale-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;

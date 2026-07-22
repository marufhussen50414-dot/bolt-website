/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: { 50: "#f6f7f9", 100: "#eceef2", 200: "#d4d8e0", 300: "#aeb4c2", 400: "#828a9c", 500: "#5e6675", 600: "#444b58", 700: "#2d333d", 800: "#1c2128", 900: "#13171c", 950: "#0a0d11" },
        primary: { 50: "#eefcff", 100: "#d4f7ff", 200: "#b0efff", 300: "#7ee3ff", 400: "#41d0ff", 500: "#15b8f5", 600: "#0693d8", 700: "#0876b0", 800: "#0e628f", 900: "#135278", 950: "#0a3a55" },
        accent: { 50: "#fffaed", 100: "#fff0c8", 200: "#ffe089", 300: "#ffc94a", 400: "#ffb01f", 500: "#f99007", 600: "#dd6c02", 700: "#b74a06", 800: "#94390c", 900: "#7a300d", 950: "#461703" },
        success: { 50: "#edfdf3", 100: "#d2fadd", 200: "#a8f3c2", 300: "#6fe79e", 400: "#34d274", 500: "#11b658", 600: "#069447", 700: "#08763b", 800: "#0c5d33", 900: "#0d4d2c", 950: "#052b18" },
        warning: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03" },
        error: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a" },
      },
      backgroundImage: {
        "glow-radial": "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(21,184,245,0.12), transparent 60%)",
        "grid-pattern": "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      boxShadow: { glow: "0 0 24px -4px rgba(21,184,245,0.4)" },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out both",
        "slide-up": "slideUp 0.5s ease-out both",
        "scale-in": "scaleIn 0.15s ease-out both",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-16px)" } },
        pulseGlow: { "0%,100%": { opacity: "0.4" }, "50%": { opacity: "0.7" } },
      },
    },
  },
  plugins: [],
};

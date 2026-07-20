/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9", 100: "#eceef2", 200: "#d4d8e0", 300: "#a9b0bf",
          400: "#717892", 500: "#525a73", 600: "#3e4458", 700: "#2d3142",
          800: "#1c1f2b", 900: "#13151d", 950: "#0a0b10",
        },
        primary: {
          50: "#eef9ff", 100: "#d9f0ff", 200: "#bce7ff", 300: "#8ed9ff",
          400: "#58c3ff", 500: "#33a8ff", 600: "#1c8af5", 700: "#1470e1",
          800: "#155bb8", 900: "#174d91",
        },
        accent: {
          50: "#fff8ec", 100: "#ffefcf", 200: "#ffdc99", 300: "#ffc14d",
          400: "#ffa720", 500: "#f08c00", 600: "#cc6e00", 700: "#a34f00",
          800: "#863f00", 900: "#703500",
        },
        success: {
          50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
          400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
          800: "#065f46", 900: "#064e3b",
        },
        warning: {
          50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
          400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309",
          800: "#92400e", 900: "#78350f",
        },
        error: {
          50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5",
          400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c",
          800: "#991b1b", 900: "#7f1d1d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "glow-radial": "radial-gradient(ellipse at 30% 0%, rgba(51,168,255,0.12), transparent 60%)",
        "grid-pattern": "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out both",
        "fade-in": "fadeIn 0.4s ease-out both",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        pulseGlow: { "0%,100%": { opacity: "0.4" }, "50%": { opacity: "0.7" } },
        slideUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
    },
  },
  plugins: [],
};

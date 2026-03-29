/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#0959a4",
        "brand-dark": "#06376a",
        "brand-light": "#eaf3fb",
        accent: "#f4b400",
        ink: "#1f2937",
        muted: "#6b7280",
        shell: "#f7f9fc"
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        premium: "0 16px 38px rgba(15, 23, 42, 0.08)",
        glow: "0 14px 30px rgba(9, 89, 164, 0.18)"
      }
    },
  },
  plugins: [],
}


    /** @type {import('tailwindcss').Config} */
    module.exports = {
      darkMode: "class",
      content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
      ],
      theme: {
        extend: {
          colors: {
            skunkd: {
              purple: "#6F00FF",
              magenta: "#FF00E5",
              cyan: "#00F6FF",
              midnight: "#05010E",
              charcoal: "#0B0A12",
              smoke: "#A6A6B3",
            },
          },
          fontFamily: {
            display: ["'Russo One'", "sans-serif"],
            body: ["'Inter'", "sans-serif"],
          },
          boxShadow: {
            neon: "0 0 25px rgba(111, 0, 255, 0.6)",
            cyan: "0 0 25px rgba(0, 246, 255, 0.55)",
          },
        },
      },
      plugins: [],
    };
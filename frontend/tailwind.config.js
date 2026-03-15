module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1a2744', light: '#243461', dark: '#111b33' },
        accent: { DEFAULT: '#c9a84c', light: '#d4b96a', dark: '#b8962e' },
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

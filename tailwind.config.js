/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        af: {
          black: '#00020A',
          blue: {
            DEFAULT: '#1440FF',
            dark: '#0027D4',
            deep: '#000D3D',
            light: '#001A91',
          },
          gray: {
            100: '#C7CDE9',
            200: '#8A92B7',
            300: '#4E5265',
          },
          yellow: '#FFC414',
          orange: '#FFA814'
        }
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        heading: ['Titillium Web', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
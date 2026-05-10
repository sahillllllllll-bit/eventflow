/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#6C47FF',
          light: '#8B6FFF',
          dark: '#4F2FE0',
        },
        surface: {
          DEFAULT: '#111118',
          raised: '#16161F',
          overlay: '#1E1E2E',
        },
        bg: '#0A0A0F',
      },
      borderColor: {
        DEFAULT: '#1E1E2E',
      },
      backgroundColor: {
        bg: '#0A0A0F',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

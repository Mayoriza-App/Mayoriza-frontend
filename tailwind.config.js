/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Ejemplo de colores premium (ajustar luego)
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6', // Violeta principal
          600: '#7c3aed',
          900: '#4c1d95',
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      }
    },
  },
  plugins: [],
}

// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Asegúrate de que cubra tus archivos jsx
  ],
  theme: {
    extend: {
      colors: { // Tu paleta de colores personalizada
        'color-primary': '#02253d',   // .color1
        'color-secondary': '#003f69', // .color2
        'color-accent1': '#106b87',   // .color3
        'color-accent2': '#157a8c',   // .color4
        'color-neutral-light': '#b3aca4', // .color5
        // Puedes añadir más si los necesitas (ej. para texto, fondos)
        'text-light': '#f0f0f0',
        'text-dark': '#333333',
        'background-light': '#f8f9fa', // Un gris muy claro para fondo
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    // require('@tailwindcss/aspect-ratio'), // Útil para las imágenes
  ],
}

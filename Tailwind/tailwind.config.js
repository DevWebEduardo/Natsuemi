/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
              "../views/layouts/*.{html,js,handlebars}",
              "../views/partials/*.{html,js,handlebars}",
              "../views/*.{html,js,handlebars}",
              "../public/js/*.{html,js,handlebars}",
           ],
  theme: {
      screens: {
      'xs': '420px',
      // => @media (min-width: 320px).

      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    },
     container: {
      screens: {
        'xs': '100%',
        'sm': "640px",
        'md': "768px",
        'lg': "1024px",
        'xl': "1280px",
        '2xl': "1450px",
      }
      // => Set the xs container size.
    },
    extend: {},
  },
  plugins: [],
}


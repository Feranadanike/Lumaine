/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  safelist: [
    {
      pattern: /from-(orange|amber|yellow|blue|cyan|teal|purple|pink|rose|green|emerald|indigo|gray)-(400)/,
    },
    {
      pattern: /via-(orange|amber|yellow|blue|cyan|teal|purple|pink|rose|green|emerald|indigo|gray)-(400)/,
    },
    {
      pattern: /to-(orange|amber|yellow|blue|cyan|teal|purple|pink|rose|green|emerald|indigo|gray)-(400|500)/,
    },
  ],
  plugins: [],
};

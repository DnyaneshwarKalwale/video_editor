/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'dashArray': 'dashArray 2s ease-in-out infinite',
        'dashOffset': 'dashOffset 2s linear infinite',
        'spinDashArray': 'spinDashArray 2s ease-in-out infinite',
        'spin': 'spin 8s ease-in-out infinite',
      },
      keyframes: {
        dashArray: {
          '0%': {
            strokeDasharray: '0 1 359 0',
          },
          '50%': {
            strokeDasharray: '0 359 1 0',
          },
          '100%': {
            strokeDasharray: '359 1 0 0',
          },
        },
        spinDashArray: {
          '0%': {
            strokeDasharray: '270 90',
          },
          '50%': {
            strokeDasharray: '0 360',
          },
          '100%': {
            strokeDasharray: '270 90',
          },
        },
        dashOffset: {
          '0%': {
            strokeDashoffset: '365',
          },
          '100%': {
            strokeDashoffset: '5',
          },
        },
        spin: {
          '0%': {
            rotate: '0deg',
          },
          '12.5%, 25%': {
            rotate: '270deg',
          },
          '37.5%, 50%': {
            rotate: '540deg',
          },
          '62.5%, 75%': {
            rotate: '810deg',
          },
          '87.5%, 100%': {
            rotate: '1080deg',
          },
        },
      },
    },
  },
  plugins: [],
}

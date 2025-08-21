/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{ts,tsx,js,jsx}", "./pages/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        body: 'var(--color-body)',
        stroke: 'var(--color-stroke)',
        strokedark: 'var(--color-strokedark)',
        blacksection: 'var(--color-blacksection)',
        whiter: 'var(--color-whiter)',
        whiten: 'var(--color-whiten)',
        metaGreen: 'var(--color-meta-green)',
        metaOrange: 'var(--color-meta-orange)'
      },
      fontSize: {
        'title-xxl': ['var(--text-title-xxl)', { lineHeight: 'var(--text-title-xxl--line-height)' }],
        'title-xl': ['var(--text-title-xl)', { lineHeight: 'var(--text-title-xl--line-height)' }],
        'title-lg': ['var(--text-title-lg)', { lineHeight: 'var(--text-title-lg--line-height)' }],
        'title-lg2': ['var(--text-title-lg2)', { lineHeight: 'var(--text-title-lg2--line-height)' }],
        'title-sm': ['var(--text-title-sm)', { lineHeight: 'var(--text-title-sm--line-height)' }],
        'title-xsm': ['var(--text-title-xsm)', { lineHeight: 'var(--text-title-xsm--line-height)' }],
        'title-xsm2': ['var(--text-title-xsm2)', { lineHeight: 'var(--text-title-xsm2--line-height)' }],
        'regular': ['var(--text-regular)', { lineHeight: 'var(--text-regular--line-height)' }]
      },
      spacing: {
        '7.5': '1.875rem',
        '10': '2.5rem',
        '21': '5.25rem',
        '25': '6.25rem'
      },
      maxWidth: {
        '550': 'var(--container-550)',
        '1280': 'var(--container-1280)',
        '1390': 'var(--container-1390)'
      },
      zIndex: {
        '1': 'var(--z-index-1)',
        '999': 'var(--z-index-999)',
        '99999': 'var(--z-index-99999)',
        '9999': '9999'
      },
      boxShadow: {
        '1': 'var(--shadow-1)',
        '2': 'var(--shadow-2)',
        '3': 'var(--shadow-3)',
        '4': 'var(--shadow-4)',
        '5': 'var(--shadow-5)',
        '6': 'var(--shadow-6)',
        'solid-5': '0px 8px 13px -3px rgba(0, 0, 0, 0.07)'
      },
      animation: {
        'rotating': 'var(--animate-rotating)'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

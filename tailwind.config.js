/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:        '#0b0c0e',
        panel:     '#111318',
        card:      '#161923',
        hover:     '#1d2233',
        input:     '#13161e',
        gold:      '#d4af37',
        'gold-l':  '#f0cc55',
        violet:    '#7c5cfc',
        cyan:      '#00d4ff',
        green:     '#3dd68c',
        red:       '#f25f5c',
        soft:      '#7a8099',
        muted:     '#474f6b',
        mono:      '#a8b5d4',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.07)',
      },
    },
  },
  plugins: [],
}

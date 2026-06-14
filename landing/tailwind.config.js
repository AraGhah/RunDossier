/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream:  { DEFAULT: '#FDFCF9', 2: '#F5F2EC', 3: '#EDE9E0' },
        navy:   { DEFAULT: '#1A2B4A', 2: '#243659', dark: '#0F1923' },
        gold:   { DEFAULT: '#B8975A', light: '#D4B07A', bg: 'rgba(184,151,90,0.10)' },
        ink:    { DEFAULT: '#111111', 2: '#2E2E2E' },
        muted:  { DEFAULT: '#777777', 2: '#AAAAAA' },
        border: { DEFAULT: 'rgba(0,0,0,0.07)', 2: 'rgba(0,0,0,0.12)' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.5rem', xl4: '2rem' },
      boxShadow: {
        card:  '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        cta:   '0 4px 20px rgba(26,43,74,0.28)',
        'cta-hover': '0 8px 32px rgba(26,43,74,0.40)',
        float: '0 2px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.5)',
      },
      animation: {
        'pulse-dot': 'pulseDot 2s infinite',
        'float':     'floatY 4s ease-in-out infinite',
      },
      keyframes: {
        pulseDot: { '0%,100%': { opacity:1, transform:'scale(1)' }, '50%': { opacity:0.4, transform:'scale(0.6)' } },
        floatY:   { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'svk-bg': '#0A0E1A',
        'svk-bg-alt': '#003135',
        'svk-bg-card': '#024950',
        'svk-accent': '#0FA4AF',
        'svk-accent-light': '#AFDDE5',
        'svk-coral': '#964734',
        'svk-text': '#E8E4DC',
        'svk-text-secondary': '#AFDDE5',
        'svk-text-muted': '#6B7280',
        'svk-border': 'rgba(255,255,255,0.08)',
        'svk-glass': 'rgba(15,164,175,0.1)',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md': ['4.5rem', { lineHeight: '1.05', fontWeight: '700' }],
        'heading': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-md': ['3rem', { lineHeight: '1.15', fontWeight: '700' }],
        'subheading': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
      borderRadius: { 'pill': '100px' },
      boxShadow: {
        'svk-accent': '0 0 15px rgba(15,164,175,0.3)',
        'svk-accent-lg': '0 0 25px rgba(15,164,175,0.6)',
        'svk-card': '0 4px 24px rgba(0,0,0,0.3)',
        'svk-card-hover': '0 8px 40px rgba(0,0,0,0.4)',
      },
      animation: {
        'float': 'float 20s linear infinite',
        'float-reverse': 'float 30s linear infinite reverse',
        'slide-in': 'slideIn 0.3s ease forwards',
        'fade-in': 'fadeIn 0.5s ease',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0) rotateX(0) rotateY(0) rotateZ(0)' },
          '50%': { transform: 'translateY(-50px) rotateX(180deg) rotateY(90deg) rotateZ(180deg)' },
          '100%': { transform: 'translateY(0) rotateX(360deg) rotateY(360deg) rotateZ(360deg)' },
        },
        slideIn: {
          'from': { opacity: '0', transform: 'translateY(-10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

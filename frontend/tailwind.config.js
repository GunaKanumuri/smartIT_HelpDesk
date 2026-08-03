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
        /* Brand core */
        'svk-accent': '#0FA4AF',
        'svk-accent-light': '#AFDDE5',
        'svk-coral': '#964734',

        /* Landing */
        'landing-bg': '#0A0E1A',
        'landing-bg-alt': '#0F1529',
        'landing-surface': 'rgba(255,255,255,0.03)',
        'landing-text': '#E8E4DC',
        'landing-text-muted': '#6B7280',

        /* Auth */
        'auth-bg': '#0A0E1A',
        'auth-surface': '#111827',
        'auth-text': '#E8E4DC',
        'auth-text-muted': '#9CA3AF',
        'auth-error': '#EF4444',
        'auth-success': '#10B981',

        /* Admin */
        'admin-bg': '#0B0F19',
        'admin-sidebar': '#0F1320',
        'admin-surface': '#151A2D',
        'admin-surface-hover': '#1C2240',
        'admin-text': '#E2E8F0',
        'admin-text-muted': '#64748B',
        'admin-success': '#10B981',
        'admin-warning': '#F59E0B',
        'admin-danger': '#EF4444',

        /* Customer */
        'customer-bg': '#F8FAFC',
        'customer-surface': '#FFFFFF',
        'customer-text': '#1E293B',
        'customer-text-muted': '#94A3B8',
        'customer-border': '#E2E8F0',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.05', fontWeight: '800', letterSpacing: '-0.03em' }],
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'heading': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-sm': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'overline': ['0.6875rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.1em' }],
      },
      borderRadius: {
        'pill': '100px',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.15)',
        'glass-lg': '0 8px 40px rgba(0,0,0,0.2)',
        'accent-glow': '0 0 20px rgba(15,164,175,0.3)',
        'accent-glow-lg': '0 0 40px rgba(15,164,175,0.5)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.3)',
        'card-dark-hover': '0 8px 40px rgba(0,0,0,0.4)',
        'card-light': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-light-hover': '0 4px 12px rgba(0,0,0,0.1)',
        'sidebar': '2px 0 8px rgba(0,0,0,0.3)',
        'dropdown': '0 8px 24px rgba(0,0,0,0.5)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'float-slow': 'float-slow 20s ease-in-out infinite',
        'float-reverse': 'float 12s ease-in-out infinite reverse',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fade-in 0.5s ease forwards',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down': 'slide-down 0.3s ease forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'spin-slow': 'spin-slow 20s linear infinite',
        'count-up': 'count-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-15px) rotate(2deg)' },
          '66%': { transform: 'translateY(8px) rotate(-1deg)' },
          '100%': { transform: 'translateY(0) rotate(0deg)' },
        },
        'float-slow': {
          '0%': { transform: 'translateY(0) rotateX(0) rotateY(0)' },
          '50%': { transform: 'translateY(-30px) rotateX(10deg) rotateY(5deg)' },
          '100%': { transform: 'translateY(0) rotateX(0) rotateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(15,164,175,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(15,164,175,0.5)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}

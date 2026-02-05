import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular']
      },
      colors: {
        ink: 'hsl(var(--ink) / <alpha-value>)',
        brand: 'hsl(var(--brand) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)'
      },
      boxShadow: {
        'soft-xl': '0 20px 50px -30px rgba(15, 23, 42, 0.4)'
      }
    }
  },
  plugins: []
}

export default config

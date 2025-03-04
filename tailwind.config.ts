import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.css' // Añade esta línea
  ],
  theme: {
    extend: {
      // Mantén tus extensiones personalizadas
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
      },
      screens: {
        'admin-md': '900px',
        // Añade breakpoints móviles personalizados
        'mobile-sm': '320px',
        'mobile-md': '375px',
        'mobile-lg': '425px',
      },

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
    },
  },
  plugins: [
    // Plugin para mejor soporte móvil
    function ({ addVariant }: any) {
      addVariant('mobile', '@media (pointer: coarse) and (max-width: 768px)')
    }
  ],
}
export default config
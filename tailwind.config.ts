import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* Brand Colors */
        "green-primary": "hsl(var(--green-primary))",
        "green-secondary": "hsl(var(--green-secondary))",
        "green-light": "hsl(var(--green-light))",
        "green-bg-soft": "hsl(var(--green-bg-soft))",
        "green-dark": "hsl(var(--green-dark))",

        /* Blues */
        "blue-primary": "hsl(var(--blue-primary))",
        "blue-secondary": "hsl(var(--blue-secondary))",
        "blue-light": "hsl(var(--blue-light))",
        "blue-deep": "hsl(var(--blue-deep))",
        "blue-bg-soft": "hsl(var(--blue-bg-soft))",

        /* Alerts */
        "amber-warning": "hsl(var(--amber-warning))",
        "amber-soft": "hsl(var(--amber-soft))",
        "red-critical": "hsl(var(--red-critical))",
        "red-bg-soft": "hsl(var(--red-bg-soft))",
        "purple-info": "hsl(var(--purple-info))",
        "purple-bg-soft": "hsl(var(--purple-bg-soft))",

        /* Zone Colors */
        "zone-dry": "hsl(var(--zone-dry))",
        "zone-safe": "hsl(var(--zone-safe))",
        "zone-over-wet": "hsl(var(--zone-over-wet))",
        "zone-dry-bg": "hsl(var(--zone-dry-bg))",
        "zone-safe-bg": "hsl(var(--zone-safe-bg))",
        "zone-over-wet-bg": "hsl(var(--zone-over-wet-bg))",

        /* UI Neutrals */
        "ui-bg-main": "hsl(var(--ui-bg-main))",
        "ui-bg-secondary": "hsl(var(--ui-bg-secondary))",
        "ui-bg-card": "hsl(var(--ui-bg-card))",
        "ui-border": "hsl(var(--ui-border))",
        "ui-divider": "hsl(var(--ui-divider))",
        "ui-text-primary": "hsl(var(--ui-text-primary))",
        "ui-text-secondary": "hsl(var(--ui-text-secondary))",
        "ui-text-muted": "hsl(var(--ui-text-muted))",

        /* Sensor Colors */
        "sensor-moisture": "hsl(var(--sensor-moisture))",
        "sensor-light": "hsl(var(--sensor-light))",
        "sensor-temperature": "hsl(var(--sensor-temperature))",
        "sensor-humidity": "hsl(var(--sensor-humidity))",
        "sensor-pump": "hsl(var(--sensor-pump))",
        "sensor-water": "hsl(var(--sensor-water))",

        /* Interactive */
        "interactive-hover": "hsl(var(--interactive-hover))",
        "interactive-active": "hsl(var(--interactive-active))",
        "interactive-focus": "hsl(var(--interactive-focus))",

        /* Chart */
        "chart-blue": "hsl(var(--chart-blue))",
        "chart-green": "hsl(var(--chart-green))",
        "chart-orange": "hsl(var(--chart-orange))",
        "chart-purple": "hsl(var(--chart-purple))",
        "chart-teal": "hsl(var(--chart-teal))",
        "chart-amber": "hsl(var(--chart-amber))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

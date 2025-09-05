import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
					success: {
						DEFAULT: 'hsl(var(--success))',
						foreground: 'hsl(var(--success-foreground))'
					},
					info: {
						DEFAULT: 'hsl(var(--info))',
						foreground: 'hsl(var(--info-foreground))'
					},
					warning: {
						DEFAULT: 'hsl(var(--warning))',
						foreground: 'hsl(var(--warning-foreground))'
					},
					purple: {
						DEFAULT: 'hsl(var(--purple))',
						foreground: 'hsl(var(--purple-foreground))'
					},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
        // Admin dashboard custom tokens - Style Guide Implementation
        'dashboard-primary': 'hsl(var(--dashboard-primary))',
        'dashboard-secondary': 'hsl(var(--dashboard-secondary))',
        'dashboard-accent': 'hsl(var(--dashboard-accent))',
        'dashboard-text-muted': 'hsl(var(--dashboard-text-muted))',
        'dashboard-bg': 'hsl(var(--dashboard-bg))',
        'surface-card': 'hsl(var(--surface-card))',
        'stat-concepts': 'hsl(var(--stat-concepts))',
        'stat-goals': 'hsl(var(--stat-goals))',
        'stat-exercises': 'hsl(var(--stat-exercises))',
        'status-active': 'hsl(var(--status-active-bg))',
        'status-draft': 'hsl(var(--status-draft-bg))',
        'status-archived': 'hsl(var(--status-archived-bg))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius-lg)', // 10px
				md: 'var(--radius-md)', // 8px  
				sm: 'var(--radius-sm)', // 6px
				xl: 'var(--radius-xl)', // 14px
			},
			fontSize: {
				'xs': 'var(--text-xs)', // 10.5px
				'sm': 'var(--text-sm)', // 12.25px
				'base': 'var(--text-base)', // 14px
				'lg': 'var(--text-lg)', // 15.75px
				'xl': 'var(--text-xl)', // 17.5px
				'2xl': 'var(--text-2xl)', // 21px
				'3xl': 'var(--text-3xl)', // 26.25px
			},
				keyframes: {
					'accordion-down': {
						from: { height: '0', opacity: '0' },
						to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
					},
					'accordion-up': {
						from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
						to: { height: '0', opacity: '0' }
					},
					'fade-in': {
						'0%': { opacity: '0', transform: 'translateY(10px)' },
						'100%': { opacity: '1', transform: 'translateY(0)' }
					},
					'fade-out': {
						'0%': { opacity: '1', transform: 'translateY(0)' },
						'100%': { opacity: '0', transform: 'translateY(10px)' }
					},
					'scale-in': {
						'0%': { transform: 'scale(0.95)', opacity: '0' },
						'100%': { transform: 'scale(1)', opacity: '1' }
					},
					'scale-out': {
						from: { transform: 'scale(1)', opacity: '1' },
						to: { transform: 'scale(0.95)', opacity: '0' }
					},
					'slide-in-right': {
						'0%': { transform: 'translateX(100%)' },
						'100%': { transform: 'translateX(0)' }
					},
					'slide-out-right': {
						'0%': { transform: 'translateX(0)' },
						'100%': { transform: 'translateX(100%)' }
					}
				},
				animation: {
					'accordion-down': 'accordion-down 0.2s ease-out',
					'accordion-up': 'accordion-up 0.2s ease-out',
					'fade-in': 'fade-in 0.3s ease-out',
					'fade-out': 'fade-out 0.3s ease-out',
					'scale-in': 'scale-in 0.2s ease-out',
					'scale-out': 'scale-out 0.2s ease-out',
					'slide-in-right': 'slide-in-right 0.3s ease-out',
					'slide-out-right': 'slide-out-right 0.3s ease-out',
					enter: 'fade-in 0.3s ease-out, scale-in 0.2s ease-out',
					exit: 'fade-out 0.3s ease-out, scale-out 0.2s ease-out'
				}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

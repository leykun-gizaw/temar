/**
 * Design System Tokens
 * Centralized design tokens for consistent UI across the application
 */

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

export const typography = {
  // Heading styles - consistent across all pages
  h1: 'text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl',
  h2: 'text-2xl font-semibold tracking-tight sm:text-3xl',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-semibold',
  h5: 'text-base font-semibold',
  h6: 'text-sm font-semibold',

  // Body text styles
  body: 'text-base',
  'body-large': 'text-lg',
  'body-small': 'text-sm',
  'body-xs': 'text-xs',

  // Special text styles
  caption: 'text-xs text-muted-foreground',
  lead: 'text-lg text-muted-foreground leading-relaxed',
  muted: 'text-muted-foreground',

  // Font families
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
} as const;

export const containers = {
  // Standard container widths
  'max-w-xs': 'max-w-xs',
  'max-w-sm': 'max-w-sm',
  'max-w-md': 'max-w-md',
  'max-w-lg': 'max-w-lg',
  'max-w-xl': 'max-w-xl',
  'max-w-2xl': 'max-w-2xl',
  'max-w-3xl': 'max-w-3xl',
  'max-w-4xl': 'max-w-4xl',
  'max-w-5xl': 'max-w-5xl',
  'max-w-6xl': 'max-w-6xl',
  'max-w-7xl': 'max-w-7xl',
  'max-w-full': 'max-w-full',

  // App-specific standard widths
  content: 'max-w-6xl', // Main content width
  narrow: 'max-w-3xl', // Narrow content (terms, privacy)
  wide: 'max-w-7xl', // Wide containers (navbar)
} as const;

export const radii = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  DEFAULT: 'rounded-md',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const;

export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  DEFAULT: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
} as const;

export const transitions = {
  // Consistent transition timing
  DEFAULT: 'transition-colors',
  all: 'transition-all',
  colors: 'transition-colors',
  opacity: 'transition-opacity',
  shadow: 'transition-shadow',
  transform: 'transition-transform',

  // Duration
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',

  // Easing
  ease: 'ease-in-out',
} as const;

export const focus = {
  // Consistent focus styles
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'ring-sm':
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2',
} as const;

export const layout = {
  // Standard section padding
  section: {
    base: 'px-6 py-16',
    sm: 'px-6 py-12',
    lg: 'px-6 py-24',
    xl: 'px-6 py-32',
  },

  // Hero sections
  hero: {
    base: 'px-6 py-24 md:py-32 lg:py-40',
    compact: 'px-6 py-16 md:py-24',
  },

  // Container padding
  container: {
    base: 'px-4 sm:px-6 lg:px-8',
    tight: 'px-4',
    loose: 'px-6 lg:px-10',
  },
} as const;

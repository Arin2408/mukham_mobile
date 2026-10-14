/**
 * Colours, fonts and spacing, matching the web app's dark theme
 * (mukham_frontend/app/globals.css, `.dark`). Every screen takes its
 * styling from here, so the look changes in one place.
 */

export const colors = {
  background: '#0A0A0A', // --background
  card: '#000000', // --card (dark): cards are black on the near-black page
  cardRaised: 'rgba(255, 255, 255, 0.05)', // inputs and controls (the web's bg-foreground/5)
  cardBorder: '#1F2937', // --border
  text: '#FAFAFA', // --foreground
  textMuted: '#A3A3A3', // --muted-foreground
  primary: '#2563EB', // --primary
  primaryText: '#FFFFFF',
  primarySoft: 'rgba(37, 99, 235, 0.15)',
  danger: '#DC2626', // --destructive
  dangerSoft: 'rgba(220, 38, 38, 0.12)',
  success: '#16A34A',
  successText: '#4ADE80',
  warningText: '#FACC15',
  dangerText: '#F87171',
  infoText: '#60A5FA',
  purple: '#9333EA',
  cyan: '#22D3EE',
  tabBar: '#000000',
} as const;

// Loaded in the root layout from @expo-google-fonts/archivo
export const fonts = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16, // cards, as the web's rounded-2xl
  xl: 24,
} as const;

/** Gradients from the web app (globals.css). Colours run top-left to bottom-right. */
export const gradients = {
  /** Page titles: blue-600 to purple-600. */
  title: ['#2563EB', '#9333EA'],
  /** Logo tile and highlights: blue-400 to purple-500. */
  brand: ['#60A5FA', '#A855F7'],
  /** The sign-in brand panel: blue-600, indigo-600, purple-700. */
  panel: ['#2563EB', '#4F46E5', '#7E22CE'],
  /** Stat tiles, alternating. */
  statBlue: ['rgba(30, 58, 138, 0.45)', 'rgba(0, 0, 0, 1)'],
  statPurple: ['rgba(88, 28, 135, 0.45)', 'rgba(0, 0, 0, 1)'],
  /** The sign-in card's border. */
  border: ['rgba(59, 130, 246, 0.6)', 'rgba(168, 85, 247, 0.6)', 'rgba(6, 182, 212, 0.4)'],
} as const;

export const statBorders = {
  blue: 'rgba(30, 58, 138, 0.6)',
  purple: 'rgba(88, 28, 135, 0.6)',
} as const;

/** Motion from the web: cards fade up 12 px over 500 ms, staggered 60 ms. */
export const motion = {
  enter: 500,
  stagger: 60,
  rise: 12,
} as const;

export const text = {
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  heading: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
} as const;

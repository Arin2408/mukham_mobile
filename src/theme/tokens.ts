/**
 * Colours, fonts and spacing, matching the web app's two themes
 * (mukham_frontend/app/globals.css: `:root` is light, `.dark` is dark).
 * Screens read the current theme with useTheme() and build their styles
 * with makeStyles(), so switching theme restyles the whole app.
 */

export type Palette = {
  background: string;
  card: string;
  cardRaised: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successText: string;
  warningText: string;
  dangerText: string;
  infoText: string;
  purple: string;
  cyan: string;
  tabBar: string;
  /** Faint tint for neutral chips and the clock's status pill. */
  subtle: string;
  /** Shadow under raised things (cards in light theme, the main button). */
  shadow: string;
};

const dark: Palette = {
  background: '#0A0A0A', // --background
  card: '#000000', // --card: cards are black on the near-black page
  cardRaised: 'rgba(255, 255, 255, 0.05)', // inputs and controls (bg-foreground/5)
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
  subtle: 'rgba(255, 255, 255, 0.06)',
  shadow: '#000000',
};

const light: Palette = {
  background: '#F7F7F7', // --background: 0 0% 97%
  card: '#FFFFFF', // --card
  cardRaised: 'rgba(10, 10, 10, 0.04)', // bg-foreground/5 on white
  cardBorder: '#E5E7EB', // --border: 220 13% 91%
  text: '#0A0A0A', // --foreground
  textMuted: '#737373', // --muted-foreground: 0 0% 45.1%
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  primarySoft: 'rgba(37, 99, 235, 0.1)',
  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.08)',
  success: '#16A34A',
  successText: '#15803D',
  warningText: '#A16207',
  dangerText: '#DC2626',
  infoText: '#2563EB',
  purple: '#9333EA',
  cyan: '#0891B2',
  tabBar: '#FFFFFF',
  subtle: 'rgba(10, 10, 10, 0.05)',
  shadow: '#64748B',
};

export const palettes = { dark, light } as const;
export type Scheme = keyof typeof palettes;

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

/** Motion from the web: cards fade up 12 px over 500 ms, staggered 60 ms. */
export const motion = {
  enter: 500,
  stagger: 60,
  rise: 12,
} as const;

/** Text styles for a palette. */
function textFor(c: Palette) {
  return {
    title: { fontFamily: fonts.bold, fontSize: 24, color: c.text },
    heading: { fontFamily: fonts.semibold, fontSize: 18, color: c.text },
    body: { fontFamily: fonts.regular, fontSize: 15, color: c.text },
    muted: { fontFamily: fonts.regular, fontSize: 13, color: c.textMuted },
  } as const;
}

/** Gradients from the web (globals.css). Colours run top-left to bottom-right. */
function gradientsFor(scheme: Scheme) {
  return {
    /** Page titles: blue-600 to purple-600 (both themes). */
    title: ['#2563EB', '#9333EA'],
    /** Logo tile and highlights: blue-400 to purple-500. */
    brand: ['#60A5FA', '#A855F7'],
    /** The sign-in brand panel: blue-600, indigo-600, purple-700. */
    panel: ['#2563EB', '#4F46E5', '#7E22CE'],
    /** Stat tiles, alternating: --stat-blue / --stat-purple. */
    statBlue:
      scheme === 'dark' ? ['rgba(30, 58, 138, 0.45)', 'rgba(0, 0, 0, 1)'] : ['rgba(219, 234, 254, 0.9)', '#FFFFFF'],
    statPurple:
      scheme === 'dark' ? ['rgba(88, 28, 135, 0.45)', 'rgba(0, 0, 0, 1)'] : ['rgba(243, 232, 255, 0.9)', '#FFFFFF'],
    /** The sign-in card's border. */
    border: ['rgba(59, 130, 246, 0.6)', 'rgba(168, 85, 247, 0.6)', 'rgba(6, 182, 212, 0.4)'],
  } as const;
}

function statBordersFor(scheme: Scheme) {
  return scheme === 'dark'
    ? { blue: 'rgba(30, 58, 138, 0.6)', purple: 'rgba(88, 28, 135, 0.6)' }
    : { blue: 'rgba(147, 197, 253, 0.6)', purple: 'rgba(216, 180, 254, 0.6)' };
}

export type Theme = {
  scheme: Scheme;
  colors: Palette;
  text: ReturnType<typeof textFor>;
  gradients: ReturnType<typeof gradientsFor>;
  statBorders: ReturnType<typeof statBordersFor>;
};

export function themeFor(scheme: Scheme): Theme {
  const colors = palettes[scheme];
  return { scheme, colors, text: textFor(colors), gradients: gradientsFor(scheme), statBorders: statBordersFor(scheme) };
}


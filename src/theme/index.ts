/**
 * Colours, fonts and spacing, matching the web app's dark theme
 * (mukham_frontend/app/globals.css, `.dark`). Every screen takes its
 * styling from here, so the look changes in one place.
 */

export const colors = {
  background: '#0A0A0A', // --background
  card: '#141414',
  cardBorder: '#1F2937', // --border
  text: '#FAFAFA', // --foreground
  textMuted: '#A3A3A3', // --muted-foreground
  primary: '#2563EB', // --primary
  primaryText: '#FFFFFF',
  primarySoft: 'rgba(37, 99, 235, 0.15)',
  danger: '#DC2626', // --destructive
  dangerSoft: 'rgba(220, 38, 38, 0.12)',
  success: '#16A34A',
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
  lg: 16,
} as const;

export const text = {
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  heading: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
} as const;

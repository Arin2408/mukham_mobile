import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { makeStyles, radius, spacing } from '@/theme';

import { FadeIn } from './motion';

type Props = { index?: number; style?: StyleProp<ViewStyle>; children: ReactNode };

/** The web's quantanex-card: black, slate border, 16 px corners, fading up into place. */
export function Card({ index = 0, style, children }: Props) {
  const styles = useStyles();
  return (
    <FadeIn index={index} style={[styles.card, style]}>
      {children}
    </FadeIn>
  );
}

const useStyles = makeStyles(({ colors, scheme }) => ({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    // White cards lift off the light page with a soft shadow, as on the web.
    ...(scheme === 'light'
      ? { shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 }
      : null),
  },
}));

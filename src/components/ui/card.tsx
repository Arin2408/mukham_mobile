import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { FadeIn } from './motion';

type Props = { index?: number; style?: StyleProp<ViewStyle>; children: ReactNode };

/** The web's quantanex-card: black, slate border, 16 px corners, fading up into place. */
export function Card({ index = 0, style, children }: Props) {
  return (
    <FadeIn index={index} style={[styles.card, style]}>
      {children}
    </FadeIn>
  );
}

export const cardStyle = {
  backgroundColor: colors.card,
  borderColor: colors.cardBorder,
  borderWidth: 1,
  borderRadius: radius.lg,
  padding: spacing.md,
} as const;

const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    gap: spacing.xs,
  },
});

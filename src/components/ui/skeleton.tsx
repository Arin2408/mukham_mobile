import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { makeStyles, radius, spacing } from '@/theme';

import { useLoop } from './motion';

/** Placeholder cards that pulse gently while a list loads. */
export function Skeleton({ rows = 3 }: { rows?: number }) {
  const styles = useStyles();
  const t = useLoop(1400);
  const pulse = useAnimatedStyle(() => ({ opacity: 0.45 + t.get() * 0.4 }));
  return (
    <View style={styles.list} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: rows }, (_, i) => (
        <Animated.View key={i} style={[styles.card, pulse]}>
          <View style={[styles.line, styles.wide]} />
          <View style={[styles.line, styles.short]} />
        </Animated.View>
      ))}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  list: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.subtle,
  },
  wide: {
    width: '60%',
  },
  short: {
    width: '35%',
  },
}));

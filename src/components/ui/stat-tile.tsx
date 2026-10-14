import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

import { Gradient } from './gradient';
import { FadeIn } from './motion';

type Props = {
  value: number;
  /** e.g. "%" after the number. */
  suffix?: string;
  label: string;
  tone: 'blue' | 'purple';
  index?: number;
};

/** A number counting up to `target` over 700 ms (straight to it with reduce motion). */
function useCountUp(target: number): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 700);
      setShown(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p === 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, reduced]);
  return reduced ? target : shown;
}

/** The web's stat card: a blue or purple tint fading to black, with a count-up number. */
export function StatTile({ value, suffix = '', label, tone, index = 0 }: Props) {
  const styles = useStyles();
  const { text, gradients, statBorders } = useTheme();
  const shown = useCountUp(value);
  return (
    <FadeIn index={index} style={styles.wrap}>
      <Gradient
        colors={tone === 'blue' ? gradients.statBlue : gradients.statPurple}
        style={[styles.tile, { borderColor: tone === 'blue' ? statBorders.blue : statBorders.purple }]}>
        <Text style={styles.value} accessibilityLabel={`${value}${suffix}`}>
          {shown}
          {suffix}
        </Text>
        <Text style={text.muted}>{label}</Text>
      </Gradient>
    </FadeIn>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  wrap: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  tile: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
    overflow: 'hidden',
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
  },
}));

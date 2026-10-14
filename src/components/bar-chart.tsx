import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

import { easeOut } from './ui/motion';

const BAR_AREA = 96;

type Props = {
  /** One bar per label, e.g. Mon … Sun. */
  labels: string[];
  values: number[];
  /** The value that fills the whole height; bigger values still fit. */
  max: number;
  /** Text above a bar, e.g. "8.5" or "67%". */
  formatValue: (value: number) => string;
  /** The bar to highlight (today); -1 for none. */
  highlight: number;
  title: string;
  /** Shown at the top right, e.g. the week's total. */
  total?: string;
};

/** A small bar chart drawn with plain views (no chart library, no native code). */
export function BarChart({ labels, values, max: fullHeight, formatValue, highlight, title, total }: Props) {
  const styles = useStyles();
  const { text } = useTheme();
  const max = Math.max(fullHeight, ...values);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={text.muted}>{title}</Text>
        {total ? <Text style={styles.total}>{total}</Text> : null}
      </View>
      <View style={styles.bars}>
        {values.map((value, i) => (
          <View
            key={`${labels[i]}-${i}`}
            style={styles.column}
            accessible
            accessibilityLabel={`${labels[i]}: ${formatValue(value)}`}>
            <Text style={styles.value}>{value > 0 ? formatValue(value) : ''}</Text>
            <View style={styles.track}>
              <Bar
                height={value > 0 ? Math.max(3, (value / max) * BAR_AREA) : 0}
                index={i}
                today={i === highlight}
              />
            </View>
            <Text style={[styles.label, i === highlight && styles.todayLabel]}>{labels[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** One bar, growing from the bottom to its height, a little after the one before. */
function Bar({ height, index, today }: { height: number; index: number; today: boolean }) {
  const styles = useStyles();
  const h = useSharedValue(0);
  useEffect(() => {
    h.set(withDelay(150 + index * 50, withTiming(height, { duration: 600, easing: easeOut })));
  }, [height, index, h]);
  const style = useAnimatedStyle(() => ({ height: h.get() }));
  return <Animated.View style={[styles.bar, today && styles.today, style]} />;
}

const useStyles = makeStyles(({ colors, text }) => ({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  total: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    ...text.muted,
    fontSize: 11,
    height: 14,
  },
  track: {
    height: BAR_AREA,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 18,
    borderRadius: 4,
    backgroundColor: colors.primarySoft,
  },
  today: {
    backgroundColor: colors.primary,
  },
  label: {
    ...text.muted,
    fontSize: 12,
  },
  todayLabel: {
    color: colors.text,
    fontFamily: fonts.semibold,
  },
}));

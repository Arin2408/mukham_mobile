import { StyleSheet, Text, View } from 'react-native';

import { WEEK_LABELS } from '@/lib/format';
import { colors, fonts, radius, spacing, text } from '@/theme';

const BAR_AREA = 96;

type Props = {
  /** Hours for Monday to Sunday. */
  hours: number[];
  /** 0 = Monday … 6 = Sunday; highlighted. -1 for none. */
  todayIndex: number;
  title: string;
  total: string;
};

/** A seven-bar chart of hours per day, drawn with plain views (no chart library). */
export function HoursChart({ hours, todayIndex, title, total }: Props) {
  // A full shift fills most of the height; longer days still fit.
  const max = Math.max(9, ...hours);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={text.muted}>{title}</Text>
        <Text style={styles.total}>{total}</Text>
      </View>
      <View style={styles.bars}>
        {hours.map((value, i) => (
          <View
            key={WEEK_LABELS[i]}
            style={styles.column}
            accessible
            accessibilityLabel={`${WEEK_LABELS[i]}: ${value.toFixed(1)} h`}>
            <Text style={styles.value}>{value > 0 ? value.toFixed(1) : ''}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  { height: value > 0 ? Math.max(3, (value / max) * BAR_AREA) : 0 },
                  i === todayIndex && styles.today,
                ]}
              />
            </View>
            <Text style={[styles.label, i === todayIndex && styles.todayLabel]}>{WEEK_LABELS[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
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
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { formatMonth, startOfWeek, toDateParam, WEEK_LABELS } from '@/lib/format';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

type Props = {
  /** Any day in the month to show. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /** "2026-10-13" */
  selected: string | null;
  onSelect: (date: string) => void;
  /** Days that get a dot (e.g. days with tasks). */
  marks?: Set<string>;
};

/** A month of days, Monday first, with arrows to change month. Plain views, no native module. */
export const MonthGrid = memo(function MonthGrid({ month, onMonthChange, selected, onSelect, marks }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const weeks = useMemo(() => monthWeeks(month), [month]);
  const today = toDateParam(new Date());
  const shift = (by: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Pressable onPress={() => shift(-1)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Previous month">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{formatMonth(month)}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Next month">
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {WEEK_LABELS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label.slice(0, 2)}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0].param} style={styles.row}>
          {week.map((day) => {
            const isSelected = day.param === selected;
            return (
              <Pressable
                key={day.param}
                onPress={() => onSelect(day.param)}
                accessibilityRole="button"
                accessibilityLabel={day.param}
                accessibilityState={{ selected: isSelected }}
                style={[styles.day, isSelected && styles.selected]}>
                <Text
                  style={[
                    styles.dayText,
                    !day.inMonth && styles.outside,
                    day.param === today && styles.today,
                    isSelected && styles.selectedText,
                  ]}>
                  {day.date.getDate()}
                </Text>
                <View style={[styles.dot, marks?.has(day.param) && styles.dotOn]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
});

type Day = { date: Date; param: string; inMonth: boolean };

/** The weeks (Monday to Sunday) that cover a month. */
export function monthWeeks(month: Date): Day[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const weeks: Day[][] = [];
  const cursor = startOfWeek(first);
  while (cursor <= last) {
    const week: Day[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(cursor);
      week.push({ date, param: toDateParam(date), inMonth: date.getMonth() === month.getMonth() });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const useStyles = makeStyles(({ colors, text }) => ({
  box: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  title: {
    ...text.heading,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  weekday: {
    ...text.muted,
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 4,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  outside: {
    color: colors.textMuted,
    opacity: 0.5,
  },
  today: {
    color: colors.infoText,
    fontFamily: fonts.bold,
  },
  selectedText: {
    color: colors.primaryText,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
  },
  dotOn: {
    backgroundColor: colors.infoText,
  },
}));

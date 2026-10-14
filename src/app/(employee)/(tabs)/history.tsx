import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { getAttendanceHistory, type HistoryRecord } from '@/api/attendance';
import { BarChart } from '@/components/bar-chart';
import { ListScreen } from '@/components/list-screen';
import { Pill } from '@/components/pill';
import { Segmented } from '@/components/segmented';
import { StateView } from '@/components/state-view';
import {
  formatDate,
  formatDay,
  formatHours,
  formatTime,
  hoursByWeekday,
  rangeFor,
  startOfWeek,
  toDateParam,
  type RangePreset,
  WEEK_LABELS,
} from '@/lib/format';
import { colors, fonts, radius, spacing, text } from '@/theme';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<RangePreset>('week');

  const now = new Date();
  const range = rangeFor(preset, now);
  const week = rangeFor('week', now);

  const records = useQuery({
    queryKey: ['attendance', 'history', range.from, range.to],
    queryFn: () => getAttendanceHistory(range.from, range.to),
  });
  // Same key as the list when "This week" is chosen, so one request serves both.
  const thisWeek = useQuery({
    queryKey: ['attendance', 'history', week.from, week.to],
    queryFn: () => getAttendanceHistory(week.from, week.to),
  });

  const daily = hoursByWeekday(thisWeek.data ?? [], startOfWeek(now));
  const weekTotal = daily.reduce((sum, h) => sum + h, 0);
  const rows = records.data ?? [];

  const refresh = () => {
    records.refetch();
    thisWeek.refetch();
  };

  return (
    <ListScreen
      title={t('history.title')}
      data={rows}
      keyExtractor={(r) => String(r.id)}
      renderItem={({ item }) => <HistoryRow record={item} />}
      refreshing={records.isRefetching || thisWeek.isRefetching}
      onRefresh={refresh}
      header={
        <>
          <BarChart
            labels={WEEK_LABELS}
            values={daily}
            max={9}
            formatValue={(h) => h.toFixed(1)}
            highlight={(now.getDay() + 6) % 7}
            title={t('history.thisWeek')}
            total={formatHours(weekTotal)}
          />
          <Segmented
            value={preset}
            onChange={setPreset}
            options={[
              { value: 'week', label: t('history.week') },
              { value: 'month', label: t('history.month') },
              { value: 'quarter', label: t('history.quarter') },
            ]}
          />
          <Text style={text.muted}>
            {t('history.range', {
              from: formatDate(range.from),
              to: formatDate(toDateParam(now)),
              count: rows.length,
            })}
          </Text>
        </>
      }
      empty={
        records.isPending ? (
          <StateView kind="loading" />
        ) : records.isError ? (
          <StateView kind="error" error={records.error} onRetry={() => records.refetch()} />
        ) : (
          <StateView kind="empty" message={t('history.empty')} />
        )
      }
    />
  );
}

function HistoryRow({ record }: { record: HistoryRecord }) {
  const { t } = useTranslation();
  const open = !record.check_out;

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.day}>{formatDay(record.check_in)}</Text>
        <Text style={styles.hours}>
          {open ? t('history.open') : formatHours(record.hours_worked ?? 0)}
        </Text>
      </View>
      <Text style={styles.times}>
        {formatTime(record.check_in)} – {record.check_out ? formatTime(record.check_out) : '…'}
      </Text>
      <View style={styles.pills}>
        <Pill label={record.status} tone={record.status === 'Late' ? 'warn' : 'good'} />
        {record.source === 'manual' || record.location_status === 'manual' ? (
          <Pill label={t('history.manual')} tone="info" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  hours: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  times: {
    ...text.muted,
    fontSize: 14,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});

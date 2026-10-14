import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { getDashboardSummary } from '@/api/admin';
import { BarChart } from '@/components/bar-chart';
import { Screen } from '@/components/screen';
import { StateView } from '@/components/state-view';
import { parseDateParam } from '@/lib/format';
import { colors, fonts, radius, spacing, text } from '@/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdminDashboardScreen() {
  const { t } = useTranslation();
  const summary = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getDashboardSummary });
  const s = summary.data;

  return (
    <Screen title={t('admin.dashboard')} refreshing={summary.isRefetching} onRefresh={() => summary.refetch()}>
      {summary.isPending ? (
        <StateView kind="loading" />
      ) : summary.isError ? (
        <StateView kind="error" error={summary.error} onRetry={() => summary.refetch()} />
      ) : (
        <>
          <View style={styles.tiles}>
            <Tile value={String(s!.total_employees)} label={t('dashboard.employees')} />
            <Tile value={`${s!.attendance_score}%`} label={t('dashboard.score')} />
            <Tile value={String(s!.active_shifts)} label={t('dashboard.shifts')} />
            <Tile value={String(s!.office_locations)} label={t('dashboard.offices')} />
          </View>

          <BarChart
            title={t('dashboard.week')}
            labels={s!.weekly_attendance.map((d) => WEEKDAYS[parseDateParam(d.date).getDay()])}
            values={s!.weekly_attendance.map((d) => d.percent)}
            max={100}
            formatValue={(p) => `${Math.round(p)}%`}
            highlight={s!.weekly_attendance.length - 1}
            total={t('dashboard.todayPresent', {
              present: s!.weekly_attendance.at(-1)?.present ?? 0,
              total: s!.total_employees,
            })}
          />

          <Section title={t('dashboard.leaderboard')} empty={t('dashboard.noDepartments')}>
            {s!.leaderboard.map((d, i) => (
              <Line key={d.department_id} label={`${i + 1}. ${d.department_name}`} value={`${Math.round(d.punctuality_score)}%`} />
            ))}
          </Section>

          <Section title={t('dashboard.roles')} empty={t('dashboard.noEmployees')}>
            {s!.roles.map((r) => (
              <Line
                key={r.name}
                label={r.name === 'Unassigned' ? t('dashboard.unassigned') : r.name}
                value={String(r.count)}
              />
            ))}
          </Section>
        </>
      )}
    </Screen>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={text.muted}>{label}</Text>
    </View>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <View style={styles.card}>
      <Text style={text.muted}>{title}</Text>
      {children.length ? children : <Text style={text.body}>{empty}</Text>}
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={[text.body, styles.lineLabel]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  tileValue: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lineLabel: {
    flex: 1,
  },
  lineValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
});

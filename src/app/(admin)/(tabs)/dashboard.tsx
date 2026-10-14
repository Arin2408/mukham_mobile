import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { getDashboardSummary } from '@/api/admin';
import { BarChart } from '@/components/bar-chart';
import { Screen } from '@/components/screen';
import { StateView } from '@/components/state-view';
import { Card } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/motion';
import { StatTile } from '@/components/ui/stat-tile';
import { parseDateParam } from '@/lib/format';
import { fonts, makeStyles, spacing, useTheme } from '@/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdminDashboardScreen() {
  const styles = useStyles();
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
            <StatTile index={1} tone="blue" value={s!.total_employees} label={t('dashboard.employees')} />
            <StatTile index={2} tone="purple" value={s!.attendance_score} suffix="%" label={t('dashboard.score')} />
            <StatTile index={3} tone="purple" value={s!.active_shifts} label={t('dashboard.shifts')} />
            <StatTile index={4} tone="blue" value={s!.office_locations} label={t('dashboard.offices')} />
          </View>

          <FadeIn index={5}>
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
          </FadeIn>

          <Section index={6} title={t('dashboard.leaderboard')} empty={t('dashboard.noDepartments')}>
            {s!.leaderboard.map((d, i) => (
              <Line key={d.department_id} label={`${i + 1}. ${d.department_name}`} value={`${Math.round(d.punctuality_score)}%`} />
            ))}
          </Section>

          <Section index={7} title={t('dashboard.roles')} empty={t('dashboard.noEmployees')}>
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

function Section({ index, title, empty, children }: { index: number; title: string; empty: string; children: ReactNode[] }) {
  const styles = useStyles();
  const { text } = useTheme();
  return (
    <Card index={index} style={styles.card}>
      <Text style={text.muted}>{title}</Text>
      {children.length ? children : <Text style={text.body}>{empty}</Text>}
    </Card>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  const { text } = useTheme();
  return (
    <View style={styles.line}>
      <Text style={[text.body, styles.lineLabel]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
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
}));

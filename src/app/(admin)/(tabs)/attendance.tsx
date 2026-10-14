import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

import { getOrgEmployees, getOrgHistory, type OrgEmployee, type OrgRecord } from '@/api/admin';
import { ListScreen } from '@/components/list-screen';
import { StateView } from '@/components/state-view';
import { daysAgo, dayStatus, formatHours, formatTime, type DayStatus } from '@/lib/format';
import { PressableScale } from '@/components/ui/motion';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

type Row = { employee: OrgEmployee; status: DayStatus };

export default function AdminAttendanceScreen() {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const employees = useQuery({ queryKey: ['admin', 'employees'], queryFn: getOrgEmployees });
  // From yesterday, so someone still in from a night shift shows as in.
  const from = daysAgo(1);
  const to = daysAgo(0);
  const recent = useQuery({
    queryKey: ['admin', 'history', from, to],
    queryFn: () => getOrgHistory(from, to),
  });

  const rows = useMemo<Row[]>(() => {
    const byEmployee = new Map<number, OrgRecord[]>();
    for (const record of recent.data ?? []) {
      const list = byEmployee.get(record.employee_id) ?? [];
      list.push(record);
      byEmployee.set(record.employee_id, list);
    }
    return (employees.data ?? []).map((employee) => ({
      employee,
      status: dayStatus(byEmployee.get(employee.employee_id) ?? []),
    }));
  }, [employees.data, recent.data]);

  const counts = useMemo(() => {
    const c = { in: 0, out: 0, absent: 0 };
    for (const row of rows) c[row.status.kind]++;
    return c;
  }, [rows]);

  const query = search.trim().toLowerCase();
  const shown = useMemo(
    () =>
      query
        ? rows.filter(({ employee: e }) =>
            `${e.first_name} ${e.last_name}`.toLowerCase().includes(query) || e.mobile_number.includes(query),
          )
        : rows,
    [rows, query],
  );

  const loading = employees.isPending || recent.isPending;
  const error = employees.error ?? recent.error;
  const refresh = () => {
    employees.refetch();
    recent.refetch();
  };

  return (
    <ListScreen
      title={t('admin.attendance')}
      data={loading || error ? [] : shown}
      keyExtractor={(row) => String(row.employee.employee_id)}
      renderItem={({ item }) => <EmployeeRow row={item} />}
      refreshing={employees.isRefetching || recent.isRefetching}
      onRefresh={refresh}
      header={
        <>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('attendance.search')}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t('attendance.search')}
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>
          {!loading && !error ? <Text style={text.muted}>{t('attendance.today', counts)}</Text> : null}
        </>
      }
      empty={
        loading ? (
          <StateView kind="loading" />
        ) : error ? (
          <StateView kind="error" error={error} onRetry={refresh} />
        ) : (
          <StateView kind="empty" message={query ? t('attendance.noMatch') : t('attendance.noEmployees')} />
        )
      }
    />
  );
}

const EmployeeRow = memo(function EmployeeRow({ row }: { row: Row }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { employee: e, status } = row;
  const line =
    status.kind === 'in'
      ? t('attendance.inSince', { time: formatTime(status.since) })
      : status.kind === 'out'
        ? t('attendance.outAt', { time: formatTime(status.at), hours: formatHours(status.hours) })
        : t('attendance.notIn');

  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/employee/[id]', params: { id: String(e.employee_id) } })}
      accessibilityRole="button"
      style={styles.row}>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {`${e.first_name} ${e.last_name}`.trim()}
        </Text>
        <Text style={[styles.status, status.kind === 'in' && styles.in, status.kind === 'absent' && styles.absent]}>
          {line}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </PressableScale>
  );
});

const useStyles = makeStyles(({ colors, text }) => ({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: colors.cardRaised,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  status: {
    ...text.muted,
    fontSize: 14,
  },
  in: {
    color: colors.successText,
  },
  absent: {
    color: colors.dangerText,
  },
}));

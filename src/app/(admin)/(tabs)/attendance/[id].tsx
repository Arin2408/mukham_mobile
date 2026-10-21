import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { getOrgEmployees, getOrgHistory, markManually, type OrgRecord } from '@/api/admin';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { ListScreenBody } from '@/components/list-screen';
import { Pill } from '@/components/pill';
import { StateView } from '@/components/state-view';
import { awayPeriods } from '@/features/presence/away-periods';
import { daysAgo, dayStatus, formatDay, formatDuration, formatHours, formatTime } from '@/lib/format';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

const DAYS = 30;

/** One employee's last 30 days, with a manual check-in or check-out at the current time. */
export default function EmployeeAttendanceScreen() {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const employeeId = Number(id);
  const queryClient = useQueryClient();

  // Usually already loaded by the Attendance tab.
  const employees = useQuery({ queryKey: ['admin', 'employees'], queryFn: getOrgEmployees });
  const employee = employees.data?.find((e) => e.employee_id === employeeId);

  const from = daysAgo(DAYS - 1);
  const to = daysAgo(0);
  const history = useQuery({
    queryKey: ['admin', 'history', from, to, employeeId],
    queryFn: () => getOrgHistory(from, to, employeeId),
  });

  const status = dayStatus(history.data ?? []);
  const action = status.kind === 'in' ? 'checkout' : 'checkin';

  const mark = useMutation({
    mutationFn: () => markManually(employeeId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const name = employee ? `${employee.first_name} ${employee.last_name}`.trim() : '';

  const confirm = () =>
    Alert.alert(
      action === 'checkin' ? t('attendance.confirmIn', { name }) : t('attendance.confirmOut', { name }),
      t('attendance.confirmBody'),
      [
        { text: t('checkIn.cancel'), style: 'cancel' },
        { text: action === 'checkin' ? t('attendance.checkInNow') : t('attendance.checkOutNow'), onPress: () => mark.mutate() },
      ],
    );

  const statusLine =
    status.kind === 'in'
      ? t('attendance.inSince', { time: formatTime(status.since) })
      : status.kind === 'out'
        ? t('attendance.outAt', { time: formatTime(status.at), hours: formatHours(status.hours) })
        : t('attendance.notInToday');

  const loading = employees.isPending || history.isPending;
  const error = employees.error ?? history.error;

  return (
    <>
      <Stack.Screen options={{ title: name || t('admin.attendance') }} />
      <ListScreenBody
        data={loading || error ? [] : (history.data ?? [])}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => <DayRow record={item} />}
        refreshing={history.isRefetching}
        onRefresh={() => history.refetch()}
        header={
          loading || error ? null : (
            <>
              <Text style={text.muted}>
                {[employee?.department_name, employee?.shift_name].filter(Boolean).join(' · ')}
              </Text>
              <Text style={[styles.status, status.kind === 'in' && styles.in, status.kind === 'absent' && styles.absent]}>
                {statusLine}
              </Text>
              <Button
                label={action === 'checkin' ? t('attendance.checkInNow') : t('attendance.checkOutNow')}
                onPress={confirm}
                loading={mark.isPending}
              />
              <Text style={text.muted}>{t('attendance.manualNote')}</Text>
              <ErrorBanner message={mark.isError ? errorMessage(mark.error, t) : null} />
              <Text style={styles.section}>{t('attendance.lastDays', { days: DAYS })}</Text>
            </>
          )
        }
        empty={
          loading ? (
            <StateView kind="loading" />
          ) : error ? (
            <StateView
              kind="error"
              error={error}
              onRetry={() => (employees.isError ? employees.refetch() : history.refetch())}
            />
          ) : (
            <StateView kind="empty" message={t('history.empty')} />
          )
        }
      />
    </>
  );
}

function DayRow({ record }: { record: OrgRecord }) {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.day}>{formatDay(record.check_in)}</Text>
        <Text style={styles.day}>{record.check_out ? formatHours(record.hours_worked ?? 0) : t('history.open')}</Text>
      </View>
      <Text style={text.muted}>
        {formatTime(record.check_in)} – {record.check_out ? formatTime(record.check_out) : '…'}
      </Text>
      <View style={styles.pills}>
        <Pill label={record.status} tone={record.status === 'Late' ? 'warn' : 'good'} />
        {record.source === 'manual' || record.location_status === 'manual' ? (
          <Pill label={t('history.manual')} tone="info" />
        ) : null}
        {record.presence_tracking === 'off' ? <Pill label={t('presence.trackingOff')} tone="warn" /> : null}
        {record.time_outside_minutes ? (
          <Pill label={t('presence.outside', { duration: formatDuration(record.time_outside_minutes) })} tone="warn" />
        ) : null}
      </View>
      {awayPeriods(record.presence_events).map((p) => (
        <Text key={p.from} style={text.muted}>
          {p.to
            ? t('presence.away', { from: formatTime(p.from), to: formatTime(p.to) })
            : t('presence.awayNow', { from: formatTime(p.from) })}
        </Text>
      ))}
    </View>
  );
}

const useStyles = makeStyles(({ colors, text }) => ({
  status: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },
  in: {
    color: colors.successText,
  },
  absent: {
    color: colors.dangerText,
  },
  section: {
    ...text.heading,
    marginTop: spacing.sm,
  },
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
  pills: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
}));

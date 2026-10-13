import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { getLatestAttendance, getMyProfile, type AttendanceRecord } from '@/api/attendance';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { Screen } from '@/components/screen';
import { formatHours, formatShiftTime, formatTime, isToday } from '@/lib/format';
import { colors, fonts, radius, spacing, text } from '@/theme';

/** The clock on Home, updated every 15 seconds. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

type Status = { kind: 'out' } | { kind: 'in'; since: string } | { kind: 'done'; record: AttendanceRecord };

function statusOf(latest: AttendanceRecord | null | undefined): Status {
  if (latest && !latest.check_out) {
    return { kind: 'in', since: latest.check_in };
  }
  if (latest?.check_out && isToday(latest.check_in)) {
    return { kind: 'done', record: latest };
  }
  return { kind: 'out' };
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const now = useNow();
  const profile = useQuery({ queryKey: ['profile'], queryFn: getMyProfile });
  const latest = useQuery({ queryKey: ['attendance', 'latest'], queryFn: getLatestAttendance });

  const status = statusOf(latest.data);
  const p = profile.data;
  const office = p?.office_location;

  const refresh = () => {
    profile.refetch();
    latest.refetch();
  };

  return (
    <Screen
      title={p ? t('home.greeting', { name: p.first_name }) : t('home.title')}
      refreshing={profile.isRefetching || latest.isRefetching}
      onRefresh={refresh}>
      <Text style={styles.date}>{now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
      <Text style={styles.clock} accessibilityRole="timer">
        {formatTime(now.toISOString())}
      </Text>

      {profile.isError || latest.isError ? <ErrorBanner message={t('home.loadFailed')} /> : null}

      <View style={styles.card}>
        <Text style={text.muted}>{t('home.shift')}</Text>
        <Text style={styles.cardValue}>
          {p?.shift_start_time
            ? `${formatShiftTime(p.shift_start_time)} - ${formatShiftTime(p.shift_end_time)}`
            : t('home.noShift')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={text.muted}>{t('home.office')}</Text>
        <Text style={styles.cardValue}>
          {office
            ? t('home.officeRadius', { name: office.location_name, radius: office.radius_meters })
            : t('home.noOffice')}
        </Text>
      </View>

      <Text style={styles.status}>
        {status.kind === 'in'
          ? t('home.checkedInAt', { time: formatTime(status.since) })
          : status.kind === 'done'
            ? t('home.checkedOutAt', {
                time: formatTime(status.record.check_out!),
                hours: formatHours(status.record.hours_worked ?? 0),
              })
            : t('home.notCheckedIn')}
      </Text>

      <Button
        label={status.kind === 'in' ? t('home.checkOut') : t('home.checkIn')}
        disabled={!p || (!office && status.kind !== 'in')}
        onPress={() =>
          router.push({ pathname: '/check-in', params: { action: status.kind === 'in' ? 'checkout' : 'checkin' } })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: {
    ...text.muted,
    marginTop: -spacing.sm,
  },
  clock: {
    fontFamily: fonts.bold,
    fontSize: 44,
    color: colors.text,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardValue: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },
  status: {
    ...text.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

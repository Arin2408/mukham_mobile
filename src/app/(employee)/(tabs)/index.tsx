import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { getLatestAttendance, getMyProfile, type AttendanceRecord } from '@/api/attendance';
import { ErrorBanner } from '@/components/error-banner';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { Gradient } from '@/components/ui/gradient';
import { FadeIn } from '@/components/ui/motion';
import { CheckInButton } from '@/features/home/check-in-button';
import { formatHours, formatShiftTime, formatTime, isToday } from '@/lib/format';
import { colors, fonts, gradients, radius, spacing, statBorders, text } from '@/theme';

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

  const canAct = !!p && (!!office || status.kind === 'in');

  return (
    <Screen
      title={p ? t('home.greeting', { name: p.first_name }) : t('home.title')}
      refreshing={profile.isRefetching || latest.isRefetching}
      onRefresh={refresh}>
      {/* Hero: today's date, the time, and where the day stands. */}
      <FadeIn index={1}>
        <Gradient colors={gradients.statBlue} style={styles.hero}>
          <Text style={styles.date}>
            {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Text style={styles.clock} accessibilityRole="timer">
            {formatTime(now.toISOString())}
          </Text>
          <View style={[styles.statusPill, status.kind === 'in' && styles.statusIn, status.kind === 'done' && styles.statusDone]}>
            <View style={[styles.dot, status.kind === 'in' && styles.dotIn, status.kind === 'done' && styles.dotDone]} />
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
          </View>
        </Gradient>
      </FadeIn>

      {profile.isError || latest.isError ? <ErrorBanner message={t('home.loadFailed')} /> : null}

      <FadeIn index={2}>
        <CheckInButton
          label={status.kind === 'in' ? t('home.checkOut') : t('home.checkIn')}
          mode={status.kind === 'in' ? 'check-out' : 'check-in'}
          disabled={!canAct}
          onPress={() =>
            router.push({ pathname: '/check-in', params: { action: status.kind === 'in' ? 'checkout' : 'checkin' } })
          }
        />
      </FadeIn>

      <View style={styles.row}>
        <InfoCard
          index={3}
          icon="time-outline"
          label={t('home.shift')}
          value={
            p?.shift_start_time
              ? `${formatShiftTime(p.shift_start_time)} - ${formatShiftTime(p.shift_end_time)}`
              : t('home.noShift')
          }
        />
        <InfoCard
          index={4}
          icon="location-outline"
          label={t('home.office')}
          value={
            office
              ? t('home.officeRadius', { name: office.location_name, radius: office.radius_meters })
              : t('home.noOffice')
          }
        />
      </View>
    </Screen>
  );
}

type IconName = ComponentProps<typeof Ionicons>['name'];

function InfoCard({ index, icon, label, value }: { index: number; icon: IconName; label: string; value: string }) {
  return (
    <Card index={index} style={styles.info}>
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={18} color={colors.infoText} />
      </View>
      <Text style={text.muted}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: statBorders.blue,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  date: {
    ...text.muted,
    fontSize: 14,
  },
  clock: {
    fontFamily: fonts.bold,
    fontSize: 52,
    color: colors.text,
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: spacing.xs,
  },
  statusIn: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  statusDone: {
    backgroundColor: colors.primarySoft,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  dotIn: {
    backgroundColor: colors.successText,
  },
  dotDone: {
    backgroundColor: colors.infoText,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  cardValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
});

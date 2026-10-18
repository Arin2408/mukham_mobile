import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { getMyProfile } from '@/api/attendance';
import { mediaUrl } from '@/api/config';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { LinkRow } from '@/components/link-row';
import { Screen } from '@/components/screen';
import { AppearanceCard } from '@/components/ui/appearance-card';
import { SignOutSection } from '@/components/sign-out-section';
import { NotificationSettings } from '@/features/notifications/notification-settings';
import { StateView } from '@/components/state-view';
import { formatShiftTime } from '@/lib/format';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

export default function ProfileScreen() {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const profile = useQuery({ queryKey: ['profile'], queryFn: getMyProfile });
  const p = profile.data;

  const rows: [string, string | null | undefined][] = p
    ? [
        [t('profile.mobile'), p.mobile_number],
        [t('profile.email'), p.email],
        [t('profile.department'), p.department_name],
        [t('profile.designation'), p.designation_name],
        [
          t('profile.shift'),
          p.shift_start_time
            ? `${p.shift_name ?? ''} ${formatShiftTime(p.shift_start_time)} - ${formatShiftTime(p.shift_end_time)}`.trim()
            : null,
        ],
        [t('profile.office'), p.office_location?.location_name ?? p.location_name],
      ]
    : [];

  return (
    <Screen title={t('profile.title')} refreshing={profile.isRefetching} onRefresh={() => profile.refetch()}>
      {profile.isPending ? (
        <StateView kind="loading" />
      ) : profile.isError ? (
        <StateView kind="error" error={profile.error} onRetry={() => profile.refetch()} />
      ) : (
        <>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Avatar uri={mediaUrl(p!.photo)} />
            </View>
            <Text style={text.title}>{`${p!.first_name} ${p!.last_name}`.trim()}</Text>
            {p!.designation_name ? <Text style={text.muted}>{p!.designation_name}</Text> : null}
          </View>

          <View style={styles.card}>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={text.muted}>{label}</Text>
                <Text style={styles.value}>{value || t('profile.notSet')}</Text>
              </View>
            ))}
          </View>

          <Button label={t('profile.showIdCard')} onPress={() => router.push('/id-card')} />
        </>
      )}
      <LinkRow
        title={t('account.changePassword')}
        detail={t('account.changePasswordDetail')}
        onPress={() => router.push('/profile/change-password')}
      />
      <AppearanceCard />
      <NotificationSettings />
      <SignOutSection />
    </Screen>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  avatar: {
    marginBottom: spacing.sm,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    gap: 2,
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
}));

import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOffices } from '@/api/setup';
import { Button } from '@/components/button';
import { LinkRow } from '@/components/link-row';
import { StateView } from '@/components/state-view';
import { formatDistance } from '@/lib/format';
import { colors, spacing } from '@/theme';

/** Office locations: where employees may check in. */
export default function OfficesScreen() {
  const { t } = useTranslation();
  const offices = useQuery({ queryKey: ['admin', 'offices'], queryFn: getOffices });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {offices.isPending ? (
          <StateView kind="loading" />
        ) : offices.isError ? (
          <StateView kind="error" error={offices.error} onRetry={() => offices.refetch()} />
        ) : offices.data.length === 0 ? (
          <StateView kind="empty" message={t('setup.noOffices')} />
        ) : (
          offices.data.map((o) => (
            <LinkRow
              key={o.location_id}
              title={o.location_name}
              detail={t('setup.officeDetail', {
                radius: formatDistance(o.radius_meters),
                lat: Number(o.latitude).toFixed(5),
                lng: Number(o.longitude).toFixed(5),
              })}
              onPress={() => router.push({ pathname: '/setup/office', params: { id: String(o.location_id) } })}
            />
          ))
        )}
        <Button label={t('setup.addOffice')} onPress={() => router.push('/setup/office')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});

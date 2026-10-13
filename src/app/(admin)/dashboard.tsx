import { useTranslation } from 'react-i18next';

import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';
import { ServerStatus } from '@/components/server-status';

export default function AdminDashboardScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('admin.dashboard')}>
      <ServerStatus />
      <PlaceholderCard message={t('admin.dashboardPlaceholder')} />
    </Screen>
  );
}

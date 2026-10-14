import { useTranslation } from 'react-i18next';

import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';
import { ServerStatus } from '@/components/server-status';
import { SignOutSection } from '@/components/sign-out-section';

export default function AdminSetupScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('admin.setup')}>
      <PlaceholderCard message={t('admin.setupPlaceholder')} />
      <ServerStatus />
      <SignOutSection />
    </Screen>
  );
}

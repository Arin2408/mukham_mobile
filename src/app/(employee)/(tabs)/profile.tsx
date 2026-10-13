import { useTranslation } from 'react-i18next';

import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';
import { SignOutSection } from '@/components/sign-out-section';

export default function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('profile.title')}>
      <PlaceholderCard message={t('profile.placeholder')} />
      <SignOutSection />
    </Screen>
  );
}

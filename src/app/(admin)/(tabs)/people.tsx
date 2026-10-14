import { useTranslation } from 'react-i18next';

import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

export default function AdminPeopleScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('admin.people')}>
      <PlaceholderCard message={t('admin.peoplePlaceholder')} />
    </Screen>
  );
}

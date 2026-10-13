import { useTranslation } from 'react-i18next';

import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

export default function HistoryScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('history.title')}>
      <PlaceholderCard message={t('history.placeholder')} />
    </Screen>
  );
}

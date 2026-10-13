import { useTranslation } from 'react-i18next';

import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

export default function TasksScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('tasks.title')}>
      <PlaceholderCard message={t('tasks.placeholder')} />
    </Screen>
  );
}

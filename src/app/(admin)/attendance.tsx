import { useTranslation } from 'react-i18next';

import { PlaceholderCard } from '@/components/placeholder-card';
import { Screen } from '@/components/screen';

export default function AdminAttendanceScreen() {
  const { t } = useTranslation();

  return (
    <Screen title={t('admin.attendance')}>
      <PlaceholderCard message={t('admin.attendancePlaceholder')} />
    </Screen>
  );
}

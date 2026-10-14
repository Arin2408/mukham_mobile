import { useLocalSearchParams } from 'expo-router';

import { IdCardView } from '@/features/id-card/id-card-view';

/** Any employee's ID card, opened by an admin. */
export default function AdminIdCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <IdCardView employeeId={Number(id)} />;
}

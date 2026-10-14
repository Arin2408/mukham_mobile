import { useQuery } from '@tanstack/react-query';

import { getMyProfile } from '@/api/attendance';
import { IdCardView } from '@/features/id-card/id-card-view';

/** The employee's own ID card. */
export default function IdCardScreen() {
  const profile = useQuery({ queryKey: ['profile'], queryFn: getMyProfile });
  return (
    <IdCardView
      employeeId={profile.data?.user_id}
      lookupError={profile.error}
      onRetryLookup={() => profile.refetch()}
    />
  );
}

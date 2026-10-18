import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getDepartments, getDesignations, getOffices, getShifts } from '@/api/setup';
import { LinkRow } from '@/components/link-row';
import { Screen } from '@/components/screen';
import { AppearanceCard } from '@/components/ui/appearance-card';
import { SignOutSection } from '@/components/sign-out-section';

/** Setup: everything an admin sets up once. */
export default function AdminSetupScreen() {
  const { t } = useTranslation();
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const designations = useQuery({ queryKey: ['admin', 'designations'], queryFn: getDesignations });
  const shifts = useQuery({ queryKey: ['admin', 'shifts'], queryFn: getShifts });
  const offices = useQuery({ queryKey: ['admin', 'offices'], queryFn: getOffices });

  const refresh = () => {
    departments.refetch();
    designations.refetch();
    shifts.refetch();
    offices.refetch();
  };
  const overnight = shifts.data?.filter((s) => s.is_overnight).length ?? 0;

  return (
    <Screen
      title={t('admin.setup')}
      refreshing={departments.isRefetching || designations.isRefetching || shifts.isRefetching || offices.isRefetching}
      onRefresh={refresh}>
      <LinkRow
        title={t('setup.departments')}
        detail={departments.data ? t('setup.departmentsDetail', { count: departments.data.length }) : undefined}
        onPress={() => router.push('/setup/departments')}
      />
      <LinkRow
        title={t('setup.designations')}
        detail={designations.data ? t('setup.designationsDetail', { count: designations.data.length }) : undefined}
        onPress={() => router.push('/setup/designations')}
      />
      <LinkRow
        title={t('setup.shifts')}
        detail={
          shifts.data
            ? [t('setup.shiftsDetail', { count: shifts.data.length }), overnight ? t('setup.overnightCount', { count: overnight }) : null]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        onPress={() => router.push('/setup/shifts')}
      />
      <LinkRow
        title={t('setup.offices')}
        detail={offices.data ? t('setup.officesDetail', { count: offices.data.length }) : undefined}
        onPress={() => router.push('/setup/offices')}
      />
      <LinkRow title={t('setup.profile')} detail={t('setup.profileDetail')} onPress={() => router.push('/setup/profile')} />
      <LinkRow
        title={t('account.changePassword')}
        detail={t('account.changePasswordDetail')}
        onPress={() => router.push('/setup/password')}
      />
      <AppearanceCard />
      <SignOutSection />
    </Screen>
  );
}

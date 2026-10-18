import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDepartments, getOffices, getShifts } from '@/api/setup';
import { Fab, FAB_CLEARANCE } from '@/components/fab';
import { LinkRow } from '@/components/link-row';
import { StateView } from '@/components/state-view';
import { formatDuration } from '@/lib/format';
import { departmentLabel, shiftTimes } from '@/lib/setup-labels';
import { makeStyles, spacing } from '@/theme';

/** Every shift with its times, department and how many people have it. */
export default function ShiftsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const shifts = useQuery({ queryKey: ['admin', 'shifts'], queryFn: getShifts });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const offices = useQuery({ queryKey: ['admin', 'offices'], queryFn: getOffices });
  const failed = shifts.error ?? departments.error ?? offices.error;
  // "Stores · HQ": the department and its office, to tell same-named shifts apart.
  const departmentOf = (id: number) => {
    const d = departments.data?.find((x) => x.department_id === id);
    return d && offices.data ? departmentLabel(d, offices.data) : undefined;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {failed ? (
          <StateView
            kind="error"
            error={failed}
            onRetry={() => {
              shifts.refetch();
              departments.refetch();
              offices.refetch();
            }}
          />
        ) : !shifts.data || !departments.data || !offices.data ? (
          <StateView kind="loading" />
        ) : shifts.data.length === 0 ? (
          <StateView kind="empty" message={t('setup.noShifts')} />
        ) : (
          shifts.data.map((s) => (
            <LinkRow
              key={s.shift_id}
              title={shiftTimes(s)}
              detail={[
                departmentOf(s.department_id),
                s.is_overnight ? t('setup.overnight') : null,
                formatDuration(s.duration_minutes),
                t('setup.people', { count: s.employee_count }),
              ]
                .filter(Boolean)
                .join(' · ')}
              onPress={() => router.push({ pathname: '/setup/shift', params: { id: String(s.shift_id) } })}
            />
          ))
        )}
      </ScrollView>
      <Fab label={t('setup.addShift')} onPress={() => router.push('/setup/shift')} />
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: FAB_CLEARANCE,
    gap: spacing.sm,
  },
}));

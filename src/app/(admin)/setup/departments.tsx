import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDepartments, getDesignations, getOffices } from '@/api/setup';
import { Fab, FAB_CLEARANCE } from '@/components/fab';
import { LinkRow } from '@/components/link-row';
import { StateView } from '@/components/state-view';
import { makeStyles, spacing } from '@/theme';

/** Departments, each with its office and designations. */
export default function DepartmentsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const designations = useQuery({ queryKey: ['admin', 'designations'], queryFn: getDesignations });
  const offices = useQuery({ queryKey: ['admin', 'offices'], queryFn: getOffices });

  const failed = departments.error ?? designations.error ?? offices.error;
  const ready = departments.data && designations.data && offices.data;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {failed ? (
          <StateView
            kind="error"
            error={failed}
            onRetry={() => {
              departments.refetch();
              designations.refetch();
              offices.refetch();
            }}
          />
        ) : !ready ? (
          <StateView kind="loading" />
        ) : departments.data.length === 0 ? (
          <StateView kind="empty" message={t('setup.noDepartments')} />
        ) : (
          departments.data.map((d) => {
            const office = offices.data.find((o) => o.location_id === d.location_id)?.location_name;
            const roles = designations.data.filter((x) => x.department_id === d.department_id).map((x) => x.details);
            return (
              <LinkRow
                key={d.department_id}
                title={d.details}
                detail={[office, roles.length ? roles.join(', ') : t('setup.noDesignations')].filter(Boolean).join(' · ')}
                onPress={() => router.push({ pathname: '/setup/department', params: { id: String(d.department_id) } })}
              />
            );
          })
        )}
      </ScrollView>
      <Fab label={t('setup.addDepartment')} onPress={() => router.push('/setup/department')} />
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

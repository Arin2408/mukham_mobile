import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Segmented } from '@/components/segmented';
import { GradientText } from '@/components/ui/gradient-text';
import { FadeIn } from '@/components/ui/motion';
import { EmployeesView } from '@/features/people/employees-view';
import { OrgChartView } from '@/features/people/org-chart-view';
import { TasksView } from '@/features/people/tasks-view';
import { makeStyles, spacing, useTheme } from '@/theme';

type PeopleView = 'employees' | 'org' | 'tasks';

/** People: employees, the org chart and tasks, one at a time. */
export default function AdminPeopleScreen() {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const [view, setView] = useState<PeopleView>('employees');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <FadeIn style={styles.titleRow}>
          <View style={styles.titleText}>
            <GradientText style={text.title} accessibilityRole="header">
              {t('admin.people')}
            </GradientText>
          </View>
        </FadeIn>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'employees', label: t('people.employees') },
            { value: 'org', label: t('people.orgChart') },
            { value: 'tasks', label: t('people.tasks') },
          ]}
        />
      </View>
      {view === 'employees' ? <EmployeesView /> : view === 'org' ? <OrgChartView /> : <TasksView />}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  titleRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleText: {
    flex: 1,
  },
}));

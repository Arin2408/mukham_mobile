import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Segmented } from '@/components/segmented';
import { EmployeesView } from '@/features/people/employees-view';
import { OrgChartView } from '@/features/people/org-chart-view';
import { TasksView } from '@/features/people/tasks-view';
import { colors, spacing, text } from '@/theme';

type PeopleView = 'employees' | 'org' | 'tasks';

/** People: employees, the org chart and tasks, one at a time. */
export default function AdminPeopleScreen() {
  const { t } = useTranslation();
  const [view, setView] = useState<PeopleView>('employees');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[text.title, styles.title]} accessibilityRole="header">
          {t('admin.people')}
        </Text>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  title: {
    marginTop: spacing.md,
  },
});

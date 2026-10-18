import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEmployees } from '@/api/people';
import { getTask } from '@/api/tasks';
import { StateView } from '@/components/state-view';
import { TaskForm } from '@/features/tasks/task-form';
import { toDateParam } from '@/lib/format';
import { makeStyles } from '@/theme';

/** Assign a task (?date= to start on a day) or edit one (?id=). */
export default function TaskFormScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const taskId = id ? Number(id) : null;

  const employees = useQuery({ queryKey: ['admin', 'people'], queryFn: getEmployees });
  const task = useQuery({ queryKey: ['task', taskId], queryFn: () => getTask(taskId!), enabled: taskId != null });

  const failed = employees.error ?? task.error;
  const ready = employees.data && (taskId == null || task.data);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: taskId != null ? t('adminTasks.editTitle') : t('adminTasks.assign') }} />
      {failed ? (
        <StateView
          kind="error"
          error={failed}
          onRetry={() => {
            employees.refetch();
            if (taskId != null) task.refetch();
          }}
        />
      ) : !ready ? (
        <StateView kind="loading" />
      ) : (
        <TaskForm
          existing={task.data}
          people={employees
            .data!.map((e) => ({ id: e.employee_id, name: `${e.first_name} ${e.last_name}`.trim() }))
            .sort((a, b) => a.name.localeCompare(b.name))}
          startDate={date ?? toDateParam(new Date())}
          refreshKeys={[['admin']]}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
}));

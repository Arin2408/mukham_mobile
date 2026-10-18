import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTask, getTeam } from '@/api/tasks';
import { StateView } from '@/components/state-view';
import { TaskForm } from '@/features/tasks/task-form';
import { toDateParam } from '@/lib/format';
import { makeStyles } from '@/theme';

/** A manager assigns a task to someone who reports to them (?id= to edit one). */
export default function TeamTaskScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const taskId = id ? Number(id) : null;

  const team = useQuery({ queryKey: ['team'], queryFn: getTeam });
  const task = useQuery({ queryKey: ['task', taskId], queryFn: () => getTask(taskId!), enabled: taskId != null });

  const failed = team.error ?? task.error;
  const ready = team.data && (taskId == null || task.data);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: taskId != null ? t('tasks.teamTaskTitle') : t('tasks.assignTeam') }} />
      {failed ? (
        <StateView
          kind="error"
          error={failed}
          onRetry={() => {
            team.refetch();
            if (taskId != null) task.refetch();
          }}
        />
      ) : !ready ? (
        <StateView kind="loading" />
      ) : team.data!.length === 0 ? (
        <StateView kind="empty" message={t('tasks.noTeam')} />
      ) : (
        <TaskForm
          existing={task.data}
          people={team.data!.map((m) => ({ id: m.employee_id, name: `${m.first_name} ${m.last_name}`.trim() }))}
          startDate={toDateParam(new Date())}
          refreshKeys={[['tasks']]}
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

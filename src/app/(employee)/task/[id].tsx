import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyProfile } from '@/api/attendance';
import { errorMessage } from '@/api/errors';
import { getTask, setTaskStatus, type Task, type TaskStatus } from '@/api/tasks';
import { ErrorBanner } from '@/components/error-banner';
import { Segmented } from '@/components/segmented';
import { StateView } from '@/components/state-view';
import { TaskPills } from '@/features/tasks/task-pills';
import { formatDate } from '@/lib/format';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

export default function TaskDetailScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = Number(id);
  const queryClient = useQueryClient();

  const task = useQuery({ queryKey: ['task', taskId], queryFn: () => getTask(taskId) });
  const profile = useQuery({ queryKey: ['profile'], queryFn: getMyProfile });
  const myId = profile.data?.user_id;

  const change = useMutation({
    mutationFn: (status: TaskStatus) => setTaskStatus(taskId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(['task', taskId], updated);
      // The task moves between the Pending / In progress / Completed lists.
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: t('tasks.detailTitle') }} />
      {task.isPending ? (
        <StateView kind="loading" />
      ) : task.isError ? (
        <StateView kind="error" error={task.error} onRetry={() => task.refetch()} />
      ) : (
        <TaskBody
          task={task.data}
          // The assignee, or whoever assigned it; a manager only views the
          // admin's tasks for their team.
          canChangeStatus={myId != null && (task.data.employee_id === myId || task.data.created_by_id === myId)}
          onChange={(status) => change.mutate(status)}
          saving={change.isPending}
          error={change.isError ? errorMessage(change.error, t) : null}
        />
      )}
    </SafeAreaView>
  );
}

type BodyProps = {
  task: Task;
  canChangeStatus: boolean;
  onChange: (status: TaskStatus) => void;
  saving: boolean;
  error: string | null;
};

function TaskBody({ task, canChangeStatus, onChange, saving, error }: BodyProps) {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const dates: [string, string | null][] = [
    [t('tasks.assigned'), task.assigned_date],
    [t('tasks.dueLabel'), task.due_date],
    [t('tasks.completedOn'), task.completed_date],
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={text.title} accessibilityRole="header">
        {task.title}
      </Text>
      <TaskPills task={task} />
      {task.assigned_by_name ? (
        <Text style={text.muted}>{t('tasks.assignedBy', { name: task.assigned_by_name })}</Text>
      ) : null}

      {task.description ? <Text style={styles.description}>{task.description}</Text> : null}

      <View style={styles.card}>
        {dates
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <View key={label} style={styles.dateRow}>
              <Text style={text.muted}>{label}</Text>
              <Text style={styles.dateValue}>{formatDate(value!)}</Text>
            </View>
          ))}
      </View>

      <Text style={styles.section}>{t('tasks.status')}</Text>
      {!canChangeStatus ? (
        <Text style={text.body}>{t(task.status === 'in_progress' ? 'tasks.inProgress' : `tasks.${task.status}`)}</Text>
      ) : (
      <View style={saving && styles.saving} pointerEvents={saving ? 'none' : 'auto'}>
        <Segmented
          value={task.status}
          onChange={(status) => status !== task.status && onChange(status)}
          options={[
            { value: 'pending', label: t('tasks.pending') },
            { value: 'in_progress', label: t('tasks.inProgress') },
            { value: 'completed', label: t('tasks.completed') },
          ]}
        />
      </View>
      )}
      <ErrorBanner message={error} />
    </ScrollView>
  );
}

const useStyles = makeStyles(({ colors, text }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  description: {
    ...text.body,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  section: {
    ...text.heading,
    marginTop: spacing.sm,
  },
  saving: {
    opacity: 0.5,
  },
}));

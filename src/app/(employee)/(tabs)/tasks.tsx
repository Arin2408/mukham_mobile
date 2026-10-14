import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { getTasks, type Task, type TaskStatus } from '@/api/tasks';
import { ListScreen } from '@/components/list-screen';
import { Segmented } from '@/components/segmented';
import { StateView } from '@/components/state-view';
import { TaskPills } from '@/features/tasks/task-pills';
import { formatDate } from '@/lib/format';
import { PressableScale } from '@/components/ui/motion';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

export default function TasksScreen() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TaskStatus>('pending');
  const tasks = useQuery({ queryKey: ['tasks', status], queryFn: () => getTasks(status) });

  return (
    <ListScreen
      title={t('tasks.title')}
      data={tasks.data ?? []}
      keyExtractor={(task) => String(task.task_id)}
      renderItem={({ item }) => <TaskRow task={item} />}
      refreshing={tasks.isRefetching}
      onRefresh={() => tasks.refetch()}
      header={
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pending', label: t('tasks.pending') },
            { value: 'in_progress', label: t('tasks.inProgress') },
            { value: 'completed', label: t('tasks.completed') },
          ]}
        />
      }
      empty={
        tasks.isPending ? (
          <StateView kind="loading" />
        ) : tasks.isError ? (
          <StateView kind="error" error={tasks.error} onRetry={() => tasks.refetch()} />
        ) : (
          <StateView kind="empty" message={t(`tasks.empty_${status}`)} />
        )
      }
    />
  );
}

function TaskRow({ task }: { task: Task }) {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/task/[id]', params: { id: String(task.task_id) } })}
      accessibilityRole="button"
      style={styles.row}>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={text.muted}>
          {task.due_date ? t('tasks.due', { date: formatDate(task.due_date) }) : t('tasks.noDue')}
        </Text>
        <TaskPills task={task} />
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </PressableScale>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
}));

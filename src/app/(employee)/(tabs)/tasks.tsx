import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { getMyProfile } from '@/api/attendance';
import { getTasks, getTeamTasks, type Task, type TaskStatus } from '@/api/tasks';
import { Fab, FAB_CLEARANCE } from '@/components/fab';
import { ListScreen } from '@/components/list-screen';
import { Segmented } from '@/components/segmented';
import { StateView } from '@/components/state-view';
import { TaskPills } from '@/features/tasks/task-pills';
import { formatDate } from '@/lib/format';
import { PressableScale } from '@/components/ui/motion';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

type Scope = 'mine' | 'team';

/** My tasks; a manager also sees, and assigns, their direct reports' tasks. */
export default function TasksScreen() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [scope, setScope] = useState<Scope>('mine');
  const profile = useQuery({ queryKey: ['profile'], queryFn: getMyProfile });
  const isManager = (profile.data?.team_size ?? 0) > 0;
  const team = isManager && scope === 'team';
  const tasks = useQuery({
    queryKey: team ? ['tasks', 'team', status] : ['tasks', status],
    queryFn: () => (team ? getTeamTasks(status) : getTasks(status)),
  });
  const myId = profile.data?.user_id;

  return (
    <ListScreen
      title={t('tasks.title')}
      data={tasks.data ?? []}
      keyExtractor={(task) => String(task.task_id)}
      renderItem={({ item }) => <TaskRow task={item} team={team} mine={item.created_by_id === myId} />}
      refreshing={tasks.isRefetching}
      onRefresh={() => tasks.refetch()}
      bottomSpace={team ? FAB_CLEARANCE : 0}
      floating={team ? <Fab label={t('tasks.assignTeam')} onPress={() => router.push('/team-task')} /> : null}
      header={
        <>
        {isManager ? (
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: 'mine', label: t('tasks.mine') },
              { value: 'team', label: t('tasks.myTeam') },
            ]}
          />
        ) : null}
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pending', label: t('tasks.pending') },
            { value: 'in_progress', label: t('tasks.inProgress') },
            { value: 'completed', label: t('tasks.completed') },
          ]}
        />
        </>
      }
      empty={
        tasks.isPending ? (
          <StateView kind="loading" />
        ) : tasks.isError ? (
          <StateView kind="error" error={tasks.error} onRetry={() => tasks.refetch()} />
        ) : (
          <StateView kind="empty" message={t(team ? `tasks.teamEmpty_${status}` : `tasks.empty_${status}`)} />
        )
      }
    />
  );
}

function TaskRow({ task, team, mine }: { task: Task; team: boolean; mine: boolean }) {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  // A manager edits the team tasks they assigned; the admin's are view-only.
  const open = () =>
    team && mine
      ? router.push({ pathname: '/team-task', params: { id: String(task.task_id) } })
      : router.push({ pathname: '/task/[id]', params: { id: String(task.task_id) } });
  return (
    <PressableScale
      onPress={open}
      accessibilityRole="button"
      style={styles.row}>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        {team ? <Text style={text.muted}>{t('tasks.forPerson', { name: task.employee_name })}</Text> : null}
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

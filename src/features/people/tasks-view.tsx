import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { getOrgTasks, type Task } from '@/api/tasks';
import { monthWeeks, MonthGrid } from '@/components/month-grid';
import { StateView } from '@/components/state-view';
import { TaskPills } from '@/features/tasks/task-pills';
import { formatDate, formatDateShort, toDateParam } from '@/lib/format';
import { PressableScale } from '@/components/ui/motion';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

/** Tasks running on a day: assigned on or before it, and not completed before it. */
export function tasksOn(tasks: Task[], day: string): Task[] {
  return tasks.filter((t) => t.assigned_date <= day && (!t.completed_date || t.completed_date >= day));
}

/** People › Tasks: a month calendar; tap a day for its tasks. */
export function TasksView() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => toDateParam(new Date()));

  // The whole grid, including the days of the next and previous months it shows.
  const weeks = useMemo(() => monthWeeks(month), [month]);
  const from = weeks[0][0].param;
  const to = weeks.at(-1)!.at(-1)!.param;
  const tasks = useQuery({ queryKey: ['admin', 'tasks', from, to], queryFn: () => getOrgTasks(from, to) });

  // A dot where something happens: assigned, due or completed.
  const marks = useMemo(() => {
    const set = new Set<string>();
    for (const task of tasks.data ?? []) {
      set.add(task.assigned_date);
      if (task.due_date) set.add(task.due_date);
      if (task.completed_date) set.add(task.completed_date);
    }
    return set;
  }, [tasks.data]);

  const onDay = useMemo(() => tasksOn(tasks.data ?? [], selected), [tasks.data, selected]);

  const changeMonth = (next: Date) => {
    setMonth(next);
    const today = new Date();
    setSelected(
      next.getMonth() === today.getMonth() && next.getFullYear() === today.getFullYear()
        ? toDateParam(today)
        : toDateParam(new Date(next.getFullYear(), next.getMonth(), 1)),
    );
  };

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <MonthGrid month={month} onMonthChange={changeMonth} selected={selected} onSelect={setSelected} marks={marks} />
        <Text style={styles.day}>{formatDateShort(selected)}</Text>
        {tasks.isPending ? (
          <StateView kind="loading" />
        ) : tasks.isError ? (
          <StateView kind="error" error={tasks.error} onRetry={() => tasks.refetch()} />
        ) : onDay.length === 0 ? (
          <StateView kind="empty" message={t('adminTasks.noneOnDay')} />
        ) : (
          onDay.map((task) => <TaskRow key={task.task_id} task={task} />)
        )}
      </ScrollView>
      <PressableScale
        onPress={() => router.push({ pathname: '/task-form', params: { date: selected } })}
        accessibilityRole="button"
        accessibilityLabel={t('adminTasks.assign')}
        style={styles.fab}>
        <Ionicons name="add" size={22} color={colors.primaryText} />
        <Text style={styles.fabText}>{t('adminTasks.assign')}</Text>
      </PressableScale>
    </View>
  );
}

function TaskRow({ task }: { task: Task }) {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const status = {
    pending: t('tasks.pending'),
    in_progress: t('tasks.inProgress'),
    completed: t('tasks.completed'),
  }[task.status];
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/task-form', params: { id: String(task.task_id) } })}
      accessibilityRole="button"
      style={styles.row}>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={text.muted}>
          {[task.employee_name, status, task.due_date ? t('tasks.due', { date: formatDate(task.due_date) }) : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <TaskPills task={task} />
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </PressableScale>
  );
}

const useStyles = makeStyles(({ colors, text }) => ({
  fill: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: 96,
    gap: spacing.sm,
  },
  day: {
    ...text.heading,
    marginTop: spacing.sm,
  },
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
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  fabText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primaryText,
  },
}));

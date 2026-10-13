import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Task } from '@/api/tasks';
import { Pill, type PillTone } from '@/components/pill';
import { spacing } from '@/theme';

const PRIORITY_TONE: Record<Task['priority'], PillTone> = { high: 'bad', medium: 'warn', low: 'neutral' };

/** Priority, plus Overdue or Completed late when they apply. */
export function TaskPills({ task }: { task: Task }) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Pill label={t(`tasks.priority_${task.priority}`)} tone={PRIORITY_TONE[task.priority]} />
      {task.is_overdue ? <Pill label={t('tasks.overdue')} tone="bad" /> : null}
      {task.completed_late ? <Pill label={t('tasks.completedLate')} tone="warn" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});

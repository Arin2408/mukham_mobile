import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import { getEmployees, type Employee } from '@/api/people';
import {
  createTask,
  deleteTask,
  getTask,
  setTaskStatus,
  updateTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/api/tasks';
import { Button } from '@/components/button';
import { DateField } from '@/components/date-field';
import { ErrorBanner } from '@/components/error-banner';
import { PickerField } from '@/components/picker-field';
import { Segmented } from '@/components/segmented';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { validateTask } from '@/features/people/validate';
import { toDateParam } from '@/lib/format';
import { colors, spacing, text } from '@/theme';

/** Assign a task (?date= to start on a day) or edit one (?id=). */
export default function TaskFormScreen() {
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
        <TaskForm existing={task.data} employees={employees.data!} startDate={date ?? toDateParam(new Date())} />
      )}
    </SafeAreaView>
  );
}

type FormProps = { existing?: Task; employees: Employee[]; startDate: string };

function TaskForm({ existing, employees, startDate }: FormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState<number | null>(existing?.employee_id ?? null);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(existing?.priority ?? 'medium');
  const [assigned, setAssigned] = useState<string>(existing?.assigned_date ?? startDate);
  const [due, setDue] = useState<string | null>(existing?.due_date ?? null);
  const [status, setStatus] = useState<TaskStatus>(existing?.status ?? 'pending');
  const [problem, setProblem] = useState<string | null>(null);

  const people = employees
    .map((e) => ({ id: e.employee_id, name: `${e.first_name} ${e.last_name}`.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const done = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
    await queryClient.invalidateQueries({ queryKey: ['task'] });
    router.back();
  };

  const save = useMutation({
    mutationFn: async () => {
      const input = {
        employee_id: employeeId!,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        assigned_date: assigned,
        due_date: due,
      };
      if (!existing) return createTask(input);
      const saved = await updateTask(existing.task_id, input);
      return status !== existing.status ? setTaskStatus(existing.task_id, status) : saved;
    },
    onSuccess: done,
  });

  const remove = useMutation({ mutationFn: () => deleteTask(existing!.task_id), onSuccess: done });

  const submit = () => {
    const issue = validateTask({ employee_id: employeeId, title, description, priority, assigned_date: assigned, due_date: due });
    setProblem(issue ? t(`adminTasks.invalid.${issue}`) : null);
    if (!issue) save.mutate();
  };

  const confirmDelete = () =>
    Alert.alert(t('adminTasks.deleteTitle'), existing?.title, [
      { text: t('checkIn.cancel'), style: 'cancel' },
      { text: t('adminTasks.delete'), style: 'destructive', onPress: () => remove.mutate() },
    ]);

  const busy = save.isPending || remove.isPending;
  const failure = save.error ?? remove.error;

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PickerField label={t('adminTasks.employee')} value={employeeId} options={people} onChange={setEmployeeId} />
        <TextField label={t('adminTasks.title')} value={title} onChangeText={setTitle} maxLength={200} />
        <TextField
          label={t('adminTasks.description')}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={5000}
        />
        <Text style={text.muted}>{t('adminTasks.priority')}</Text>
        <Segmented
          value={priority}
          onChange={setPriority}
          options={[
            { value: 'low', label: t('adminTasks.low') },
            { value: 'medium', label: t('adminTasks.medium') },
            { value: 'high', label: t('adminTasks.high') },
          ]}
        />
        <DateField label={t('tasks.assigned')} value={assigned} onChange={(v) => v && setAssigned(v)} />
        <DateField label={t('tasks.dueLabel')} value={due} onChange={setDue} clearable />
        {existing ? (
          <>
            <Text style={text.muted}>{t('tasks.status')}</Text>
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
        ) : null}
        <ErrorBanner message={problem ?? (failure ? errorMessage(failure, t) : null)} />
        <Button label={t('person.save')} onPress={submit} loading={save.isPending} disabled={busy} />
        {existing ? (
          <Button variant="danger" label={t('adminTasks.delete')} onPress={confirmDelete} loading={remove.isPending} disabled={busy} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import {
  addShift,
  assignShiftToDepartment,
  deleteShift,
  getDepartments,
  getOffices,
  getShifts,
  updateShift,
  type Shift,
} from '@/api/setup';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { PickerField } from '@/components/picker-field';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { TimeField } from '@/components/time-field';
import { formatDuration, shiftLength } from '@/lib/format';
import { departmentLabel } from '@/lib/setup-labels';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

/** Add a shift (no id) or edit one (?id=), give it to a department, or delete it. */
export default function ShiftScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const shiftId = id ? Number(id) : null;
  const shifts = useQuery({ queryKey: ['admin', 'shifts'], queryFn: getShifts });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const offices = useQuery({ queryKey: ['admin', 'offices'], queryFn: getOffices });
  const existing = shifts.data?.find((s) => s.shift_id === shiftId);

  const failed = shifts.error ?? departments.error ?? offices.error;
  const ready = shifts.data && departments.data && offices.data && (shiftId == null || existing);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <Stack.Screen options={{ title: existing ? existing.shift_name : t('setup.addShift') }} />
      {failed ? (
        <StateView
          kind="error"
          error={failed}
          onRetry={() => {
            shifts.refetch();
            departments.refetch();
            offices.refetch();
          }}
        />
      ) : !ready ? (
        <StateView kind="loading" />
      ) : (
        <ShiftForm
          existing={existing}
          departments={departments.data!.map((d) => ({ id: d.department_id, name: departmentLabel(d, offices.data!) }))}
        />
      )}
    </SafeAreaView>
  );
}

function ShiftForm({ existing, departments }: { existing?: Shift; departments: { id: number; name: string }[] }) {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Plain conditionals, not `existing?.a.b`: the React Compiler can drop the
  // guard from those and read them on every render, crashing in Add mode.
  const [name, setName] = useState(existing ? existing.shift_name : '');
  const [department, setDepartment] = useState<number | null>(existing ? existing.department_id : null);
  const [start, setStart] = useState(existing ? existing.shift_start_time.slice(0, 5) : '09:00');
  const [end, setEnd] = useState(existing ? existing.shift_end_time.slice(0, 5) : '18:00');
  const [problem, setProblem] = useState<string | null>(null);

  const length = shiftLength(start, end);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });

  const save = useMutation({
    mutationFn: () => {
      const input = { shift_name: name.trim(), shift_start_time: start, shift_end_time: end, department: department! };
      return existing ? updateShift(existing.shift_id, input) : addShift(input);
    },
    onSuccess: async () => {
      await refresh();
      router.back();
    },
  });

  const submit = () => {
    const issue = !name.trim()
      ? t('setup.invalid.name')
      : department == null
        ? t('setup.invalid.department')
        : start === end
          ? t('setup.invalid.sameTimes')
          : null;
    setProblem(issue);
    if (!issue) save.mutate();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextField label={t('setup.shiftName')} value={name} onChangeText={setName} maxLength={255} />
      <PickerField label={t('profile.department')} value={department} options={departments} onChange={setDepartment} />
      <View style={styles.times}>
        <TimeField label={t('setup.starts')} value={start} onChange={setStart} />
        <TimeField label={t('setup.ends')} value={end} onChange={setEnd} />
      </View>
      {start !== end ? (
        <View style={styles.note}>
          <Text style={text.body}>
            {length.overnight
              ? t('setup.overnightNote', { length: formatDuration(length.minutes) })
              : t('setup.dayNote', { length: formatDuration(length.minutes) })}
          </Text>
        </View>
      ) : null}
      <ErrorBanner message={problem ?? (save.isError ? errorMessage(save.error, t) : null)} />
      <Button label={t('person.save')} onPress={submit} loading={save.isPending} />
      {existing ? <ShiftActions shift={existing} departments={departments} onDone={refresh} /> : null}
    </ScrollView>
  );
}

type ActionsProps = { shift: Shift; departments: { id: number; name: string }[]; onDone: () => Promise<void> };

/** For a saved shift: give it to its whole department, or delete it. */
function ShiftActions({ shift, departments, onDone }: ActionsProps) {
  const { text } = useTheme();
  const { t } = useTranslation();
  // The saved department, not an unsaved change in the form above.
  const departmentName = departments.find((d) => d.id === shift.department_id)?.name ?? '';

  const assign = useMutation({
    mutationFn: () => assignShiftToDepartment(shift.department_id, shift.shift_id),
    onSuccess: async (result) => {
      await onDone();
      Alert.alert(t('setup.assignedTitle'), t('setup.assignedBody', { count: result.updated_count, shift: shift.shift_name }));
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteShift(shift.shift_id),
    onSuccess: async () => {
      await onDone();
      router.back();
    },
  });

  const confirmAssign = () =>
    Alert.alert(
      t('setup.assignTitle', { shift: shift.shift_name, department: departmentName }),
      t('setup.assignBody', { department: departmentName }),
      [
        { text: t('checkIn.cancel'), style: 'cancel' },
        { text: t('setup.assign'), onPress: () => assign.mutate() },
      ],
    );

  const confirmRemove = () =>
    Alert.alert(
      t('setup.deleteTitle', { name: shift.shift_name }),
      shift.employee_count ? t('setup.deleteShiftBody', { count: shift.employee_count }) : undefined,
      [
        { text: t('checkIn.cancel'), style: 'cancel' },
        { text: t('setup.delete'), style: 'destructive', onPress: () => remove.mutate() },
      ],
    );

  const busy = assign.isPending || remove.isPending;
  const failure = assign.error ?? remove.error;

  return (
    <>
      <Button
        variant="secondary"
        label={t('setup.giveToAll', { department: departmentName })}
        onPress={confirmAssign}
        loading={assign.isPending}
        disabled={busy}
      />
      <Button variant="danger" label={t('setup.deleteShift')} onPress={confirmRemove} loading={remove.isPending} disabled={busy} />
      {shift.employee_count ? (
        <Text style={text.muted}>{t('setup.deleteShiftBody', { count: shift.employee_count })}</Text>
      ) : null}
      <ErrorBanner message={failure ? errorMessage(failure, t) : null} />
    </>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  times: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  note: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
}));

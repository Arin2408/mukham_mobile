import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import {
  addDepartment,
  addDesignation,
  deleteDepartment,
  getDepartments,
  getDesignations,
  getOffices,
  updateDepartment,
  type Department,
} from '@/api/setup';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { PickerField } from '@/components/picker-field';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { DesignationRow } from '@/features/setup/designation-row';
import { colors, fonts, radius, spacing, text } from '@/theme';

/** Add a department (no id) or edit one and its designations (?id=). */
export default function DepartmentScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const departmentId = id ? Number(id) : null;
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const offices = useQuery({ queryKey: ['admin', 'offices'], queryFn: getOffices });
  const existing = departments.data?.find((d) => d.department_id === departmentId);

  const failed = departments.error ?? offices.error;
  const ready = departments.data && offices.data && (departmentId == null || existing);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: existing ? existing.details : t('setup.addDepartment') }} />
      {failed ? (
        <StateView kind="error" error={failed} onRetry={() => {
            departments.refetch();
            offices.refetch();
          }} />
      ) : !ready ? (
        <StateView kind="loading" />
      ) : (
        <DepartmentForm
          existing={existing}
          offices={offices.data!.map((o) => ({ id: o.location_id, name: o.location_name }))}
        />
      )}
    </SafeAreaView>
  );
}

function DepartmentForm({ existing, offices }: { existing?: Department; offices: { id: number; name: string }[] }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Plain conditionals: see the note in setup/shift.tsx about the React Compiler.
  const [name, setName] = useState(existing ? existing.details : '');
  const [office, setOffice] = useState<number | null>(
    existing ? existing.location_id : offices.length === 1 ? offices[0].id : null,
  );
  const [problem, setProblem] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });

  const save = useMutation({
    mutationFn: () =>
      existing ? updateDepartment(existing.department_id, name.trim(), office!) : addDepartment(name.trim(), office!),
    onSuccess: async () => {
      await refresh();
      router.back();
    },
  });

  const submit = () => {
    const issue = !name.trim() ? t('setup.invalid.name') : office == null ? t('setup.invalid.office') : null;
    setProblem(issue);
    if (!issue) save.mutate();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextField label={t('setup.departmentName')} value={name} onChangeText={setName} />
      <PickerField label={t('setup.office')} value={office} options={offices} onChange={setOffice} />
      {offices.length === 0 ? <Text style={text.muted}>{t('setup.needOffice')}</Text> : null}
      <ErrorBanner message={problem ?? (save.isError ? errorMessage(save.error, t) : null)} />
      <Button label={t('person.save')} onPress={submit} loading={save.isPending} />
      {existing ? null : <Text style={text.muted}>{t('setup.designationsAfterSave')}</Text>}
      {existing ? (
        <>
          <Designations department={existing} />
          <DeleteDepartment department={existing} onDone={refresh} />
        </>
      ) : null}
    </ScrollView>
  );
}

/** For a saved department: delete it (the server refuses while anything uses it). */
function DeleteDepartment({ department, onDone }: { department: Department; onDone: () => Promise<void> }) {
  const { t } = useTranslation();
  const remove = useMutation({
    mutationFn: () => deleteDepartment(department.department_id),
    onSuccess: async () => {
      await onDone();
      router.back();
    },
  });

  const confirmRemove = () =>
    Alert.alert(t('setup.deleteTitle', { name: department.details }), t('setup.deleteDepartmentBody'), [
      { text: t('checkIn.cancel'), style: 'cancel' },
      { text: t('setup.delete'), style: 'destructive', onPress: () => remove.mutate() },
    ]);

  return (
    <>
      <Button variant="danger" label={t('setup.deleteDepartment')} onPress={confirmRemove} loading={remove.isPending} />
      <ErrorBanner message={remove.isError ? errorMessage(remove.error, t) : null} />
    </>
  );
}

/** The department's designations: add, rename, remove. */
function Designations({ department }: { department: Department }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const designations = useQuery({ queryKey: ['admin', 'designations'], queryFn: getDesignations });
  const [draft, setDraft] = useState('');
  const mine = (designations.data ?? []).filter((d) => d.department_id === department.department_id);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });
  const onError = (error: unknown) => Alert.alert(t('setup.couldNotSave'), errorMessage(error, t));

  const add = useMutation({
    mutationFn: () => addDesignation(department.department_id, draft.trim()),
    onSuccess: async () => {
      setDraft('');
      await refresh();
    },
    onError,
  });

  return (
    <View style={styles.section}>
      <Text style={text.heading}>{t('setup.designations')}</Text>
      {mine.length === 0 ? <Text style={text.muted}>{t('setup.noDesignations')}</Text> : null}
      {mine.map((d) => (
        <DesignationRow key={d.designation_id} designation={d} onChanged={refresh} />
      ))}
      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('setup.newDesignation')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('setup.newDesignation')}
          style={styles.inlineInput}
        />
        <Button label={t('setup.add')} onPress={() => draft.trim() && add.mutate()} loading={add.isPending} />
      </View>
    </View>
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
  section: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
});

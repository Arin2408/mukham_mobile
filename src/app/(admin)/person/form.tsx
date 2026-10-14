import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import {
  createEmployee,
  getEmployees,
  getFormOptions,
  updateEmployee,
  type Employee,
  type EmployeeInput,
  type FormOptions,
} from '@/api/people';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { PickerField } from '@/components/picker-field';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { validateEmployee } from '@/features/people/validate';
import { colors, fonts, radius, spacing, text } from '@/theme';

/** Add an employee (no id) or edit one (?id=). */
export default function PersonFormScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;

  const employees = useQuery({ queryKey: ['admin', 'people'], queryFn: getEmployees });
  const options = useQuery({ queryKey: ['admin', 'form-options'], queryFn: getFormOptions });
  const existing = editingId != null ? employees.data?.find((e) => e.employee_id === editingId) : undefined;

  const ready = employees.data && options.data && (editingId == null || existing);
  const failed = employees.error ?? options.error;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: editingId != null ? t('person.editTitle') : t('person.addTitle') }} />
      {failed ? (
        <StateView
          kind="error"
          error={failed}
          onRetry={() => {
            employees.refetch();
            options.refetch();
          }}
        />
      ) : !ready ? (
        <StateView kind="loading" />
      ) : (
        <EmployeeForm existing={existing} employees={employees.data!} options={options.data!} />
      )}
    </SafeAreaView>
  );
}

type FormProps = { existing?: Employee; employees: Employee[]; options: FormOptions };

function EmployeeForm({ existing, employees, options }: FormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EmployeeInput>(() => ({
    first_name: existing?.first_name ?? '',
    last_name: existing?.last_name ?? '',
    mobile_number: existing?.mobile_number ?? '',
    email: existing?.email ?? '',
    department: existing?.department_id ?? null,
    designation: existing?.designation_id ?? null,
    shift: existing?.shift_id ?? null,
    office_location: existing?.office_location_id ?? null,
    manager: existing?.manager_id ?? null,
  }));
  const [problem, setProblem] = useState<string | null>(null);
  const set = <K extends keyof EmployeeInput>(key: K) => (value: EmployeeInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Anyone but the person being edited can be their manager.
  const managers = employees
    .filter((e) => e.employee_id !== existing?.employee_id)
    .map((e) => ({ id: e.employee_id, name: `${e.first_name} ${e.last_name}`.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const save = useMutation({
    mutationFn: (input: EmployeeInput) =>
      existing ? updateEmployee(existing.employee_id, input) : createEmployee(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      const password = 'member_password' in result ? result.member_password : null;
      if (!existing && password) {
        // Shown once, as on the web: the admin passes it on to the employee.
        Alert.alert(t('person.addedTitle'), t('person.addedBody', { name: result.first_name, mobile: result.mobile_number, password }), [
          { text: t('checkIn.done'), onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
    },
  });

  const submit = () => {
    const input = {
      ...form,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      mobile_number: form.mobile_number.replace(/\D/g, ''),
    };
    const issue = validateEmployee(input);
    setProblem(issue ? t(`person.invalid.${issue}`) : null);
    if (!issue) save.mutate(input);
  };

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label={t('person.firstName')} value={form.first_name} onChangeText={set('first_name')} autoCapitalize="words" />
        <TextField label={t('person.lastName')} value={form.last_name} onChangeText={set('last_name')} autoCapitalize="words" />
        <View style={styles.mobileRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <View style={styles.mobileField}>
            <TextField
              label={t('profile.mobile')}
              value={form.mobile_number}
              onChangeText={set('mobile_number')}
              keyboardType="number-pad"
              maxLength={10}
              placeholder={t('signIn.mobilePlaceholder')}
            />
          </View>
        </View>
        <TextField
          label={t('profile.email')}
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PickerField label={t('profile.department')} value={form.department} options={options.departments} onChange={set('department')} noneLabel={t('person.none')} />
        <PickerField label={t('profile.designation')} value={form.designation} options={options.designations} onChange={set('designation')} noneLabel={t('person.none')} />
        <PickerField label={t('profile.shift')} value={form.shift} options={options.shifts} onChange={set('shift')} noneLabel={t('person.none')} />
        <PickerField label={t('profile.office')} value={form.office_location} options={options.locations} onChange={set('office_location')} noneLabel={t('person.none')} />
        <PickerField label={t('person.reportsTo')} value={form.manager} options={managers} onChange={set('manager')} noneLabel={t('person.organisation')} />
        <ErrorBanner message={problem ?? (save.isError ? errorMessage(save.error, t) : null)} />
        <Button label={t('person.save')} onPress={submit} loading={save.isPending} />
        {existing ? null : <Text style={text.muted}>{t('person.passwordNote')}</Text>}
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
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  prefix: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  prefixText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textMuted,
  },
  mobileField: {
    flex: 1,
  },
});

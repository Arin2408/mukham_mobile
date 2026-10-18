import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import { addDesignation, getDepartments, getDesignations, getOffices } from '@/api/setup';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { Fab, FAB_CLEARANCE } from '@/components/fab';
import { PickerField } from '@/components/picker-field';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { DesignationRow } from '@/features/setup/designation-row';
import { departmentLabel } from '@/lib/setup-labels';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

/** Every designation, grouped by department and office; add, rename, delete. */
export default function DesignationsScreen() {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const designations = useQuery({ queryKey: ['admin', 'designations'], queryFn: getDesignations });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const offices = useQuery({ queryKey: ['admin', 'offices'], queryFn: getOffices });

  const [name, setName] = useState('');
  const [department, setDepartment] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // The add form opens from the corner button, as on the other lists.
  const [adding, setAdding] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });
  const add = useMutation({
    mutationFn: () => addDesignation(department!, name.trim()),
    onSuccess: async () => {
      setName('');
      setAdding(false);
      await refresh();
    },
  });

  const submit = () => {
    const issue = !name.trim() ? t('setup.invalid.name') : department == null ? t('setup.invalid.department') : null;
    setProblem(issue);
    if (!issue) add.mutate();
  };

  const failed = designations.error ?? departments.error ?? offices.error;
  if (failed) {
    return (
      <StateView
        kind="error"
        error={failed}
        onRetry={() => {
          designations.refetch();
          departments.refetch();
          offices.refetch();
        }}
      />
    );
  }
  if (!designations.data || !departments.data || !offices.data) return <StateView kind="loading" />;

  const departmentOptions = departments.data.map((d) => ({ id: d.department_id, name: departmentLabel(d, offices.data) }));

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {adding ? (
        <View style={styles.card}>
          <Text style={text.heading}>{t('setup.addDesignation')}</Text>
          <TextField label={t('setup.designationName')} value={name} onChangeText={setName} />
          <PickerField label={t('profile.department')} value={department} options={departmentOptions} onChange={setDepartment} />
          {departments.data.length === 0 ? <Text style={text.muted}>{t('setup.needDepartment')}</Text> : null}
          <ErrorBanner message={problem ?? (add.isError ? errorMessage(add.error, t) : null)} />
          <Button label={t('setup.add')} onPress={submit} loading={add.isPending} />
          <Button label={t('setup.cancel')} variant="secondary" onPress={() => setAdding(false)} />
        </View>
        ) : null}

        {departments.data.map((d) => {
          const mine = designations.data.filter((x) => x.department_id === d.department_id);
          return (
            <View key={d.department_id} style={styles.group}>
              <Text style={styles.groupTitle}>{departmentLabel(d, offices.data)}</Text>
              {mine.length === 0 ? <Text style={text.muted}>{t('setup.noDesignations')}</Text> : null}
              {mine.map((x) => (
                <DesignationRow key={x.designation_id} designation={x} onChanged={refresh} />
              ))}
            </View>
          );
        })}
      </ScrollView>
      {!adding ? <Fab label={t('setup.addDesignation')} onPress={() => setAdding(true)} /> : null}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, text }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: FAB_CLEARANCE,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    ...text.heading,
    fontSize: 16,
  },
}));

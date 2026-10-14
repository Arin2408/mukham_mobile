import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mediaUrl } from '@/api/config';
import { errorMessage } from '@/api/errors';
import { deleteEmployee, getEmployees } from '@/api/people';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { StateView } from '@/components/state-view';
import { colors, fonts, radius, spacing, text } from '@/theme';

const shown = (value: string | null | undefined) => (value && value !== 'N/A' ? value : null);

/** One employee, for the admin: details, Edit, ID card, Remove. */
export default function PersonScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const employeeId = Number(id);
  const queryClient = useQueryClient();

  // The People list already holds everyone; this reuses it.
  const employees = useQuery({ queryKey: ['admin', 'people'], queryFn: getEmployees });
  const e = employees.data?.find((x) => x.employee_id === employeeId);
  const name = e ? `${e.first_name} ${e.last_name}`.trim() : '';

  const remove = useMutation({
    mutationFn: () => deleteEmployee(employeeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      router.back();
    },
  });

  const confirmRemove = () =>
    Alert.alert(t('person.removeTitle', { name }), t('person.removeBody'), [
      { text: t('checkIn.cancel'), style: 'cancel' },
      { text: t('person.remove'), style: 'destructive', onPress: () => remove.mutate() },
    ]);

  if (employees.isPending) return <StateView kind="loading" />;
  if (employees.isError) return <StateView kind="error" error={employees.error} onRetry={() => employees.refetch()} />;
  if (!e) return <StateView kind="empty" message={t('person.gone')} />;

  const rows: [string, string | null][] = [
    [t('profile.mobile'), e.mobile_number],
    [t('profile.email'), e.email],
    [t('profile.department'), shown(e.department_name)],
    [t('profile.designation'), shown(e.designation_name)],
    [t('profile.shift'), shown(e.shift_name)],
    [t('profile.office'), shown(e.location_name)],
    [t('person.reportsTo'), e.manager_name ?? t('person.organisation')],
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <Avatar uri={mediaUrl(e.photo)} />
          <Text style={text.title}>{name}</Text>
          {e.is_member_registered ? null : <Text style={styles.pending}>{t('people.notSignedIn')}</Text>}
        </View>
        <View style={styles.card}>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={text.muted}>{label}</Text>
              <Text style={styles.value}>{value ?? t('profile.notSet')}</Text>
            </View>
          ))}
        </View>
        <Button label={t('person.edit')} onPress={() => router.push({ pathname: '/person/form', params: { id } })} />
        <Button
          variant="secondary"
          label={t('profile.showIdCard')}
          onPress={() => router.push({ pathname: '/person/card', params: { id } })}
        />
        <Button variant="danger" label={t('person.remove')} onPress={confirmRemove} loading={remove.isPending} />
        <ErrorBanner message={remove.isError ? errorMessage(remove.error, t) : null} />
      </ScrollView>
    </SafeAreaView>
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
  },
  identity: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  pending: {
    ...text.muted,
    color: '#FACC15',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    gap: 2,
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
});

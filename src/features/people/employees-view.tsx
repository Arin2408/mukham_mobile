import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { getEmployees, type Employee } from '@/api/people';
import { ListScreenBody } from '@/components/list-screen';
import { StateView } from '@/components/state-view';
import { PressableScale } from '@/components/ui/motion';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

import { shareEmployeesCsv } from './share-csv';

/** People › Employees: search, open, add, export. */
export function EmployeesView() {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const employees = useQuery({ queryKey: ['admin', 'people'], queryFn: getEmployees });

  const query = search.trim().toLowerCase();
  const shown = useMemo(() => {
    const all = employees.data ?? [];
    if (!query) return all;
    return all.filter((e) =>
      [`${e.first_name} ${e.last_name}`, e.mobile_number, e.department_name, e.designation_name]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [employees.data, query]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const shared = await shareEmployeesCsv(employees.data ?? [], t('people.exportTitle'));
      if (!shared) Alert.alert(t('people.exportFailed'), t('people.exportUnavailable'));
    } catch (error) {
      Alert.alert(t('people.exportFailed'), errorMessage(error, t));
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.fill}>
      <ListScreenBody
        data={employees.isPending || employees.isError ? [] : shown}
        keyExtractor={(e) => String(e.employee_id)}
        renderItem={({ item }) => <EmployeeRow employee={item} />}
        refreshing={employees.isRefetching}
        onRefresh={() => employees.refetch()}
        bottomSpace={88}
        header={
          <>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('people.search')}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={t('people.search')}
                autoCorrect={false}
                style={styles.searchInput}
              />
            </View>
            {employees.data ? (
              <View style={styles.toolbar}>
                <Text style={text.muted}>{t('people.count', { count: employees.data.length })}</Text>
                <Pressable
                  onPress={exportCsv}
                  disabled={exporting || employees.data.length === 0}
                  accessibilityRole="button"
                  hitSlop={8}>
                  <Text style={styles.link}>{exporting ? t('people.exporting') : t('people.export')}</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        }
        empty={
          employees.isPending ? (
            <StateView kind="loading" />
          ) : employees.isError ? (
            <StateView kind="error" error={employees.error} onRetry={() => employees.refetch()} />
          ) : (
            <StateView kind="empty" message={query ? t('attendance.noMatch') : t('people.empty')} />
          )
        }
      />
      <PressableScale
        onPress={() => router.push('/person/form')}
        accessibilityRole="button"
        accessibilityLabel={t('people.add')}
        style={styles.fab}>
        <Ionicons name="add" size={22} color={colors.primaryText} />
        <Text style={styles.fabText}>{t('people.add')}</Text>
      </PressableScale>
    </View>
  );
}

const EmployeeRow = memo(function EmployeeRow({ employee: e }: { employee: Employee }) {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const role = [e.designation_name, e.department_name].filter((v) => v && v !== 'N/A').join(' · ');
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/person/[id]', params: { id: String(e.employee_id) } })}
      accessibilityRole="button"
      style={styles.row}>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {`${e.first_name} ${e.last_name}`.trim()}
        </Text>
        {e.is_member_registered ? (
          <Text style={text.muted}>{role || t('people.noRole')}</Text>
        ) : (
          <Text style={styles.pending}>{t('people.notSignedIn')}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </PressableScale>
  );
});

const useStyles = makeStyles(({ colors, text }) => ({
  fill: {
    flex: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    backgroundColor: colors.cardRaised,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.infoText,
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
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  pending: {
    ...text.muted,
    color: colors.warningText,
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

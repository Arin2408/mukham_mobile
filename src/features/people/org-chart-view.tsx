import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { getHierarchy, setManager, type HierarchyPerson } from '@/api/people';
import { OptionSheet } from '@/components/picker-field';
import { StateView } from '@/components/state-view';
import { colors, fonts, radius, spacing, text } from '@/theme';

const fullName = (p: HierarchyPerson) => `${p.first_name} ${p.last_name}`.trim();

/**
 * People › Org chart, one level at a time: the people who report to the
 * organisation, then to whoever you tap. Readable with hundreds of people.
 */
export function OrgChartView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const hierarchy = useQuery({ queryKey: ['admin', 'hierarchy'], queryFn: getHierarchy });
  // The people tapped so far, top first; empty = the organisation.
  const [path, setPath] = useState<number[]>([]);
  const [moving, setMoving] = useState<HierarchyPerson | null>(null);

  const people = hierarchy.data?.employees;
  const byId = useMemo(() => new Map((people ?? []).map((p) => [p.employee_id, p])), [people]);
  // People whose manager has gone (or isn't in the list) show at the top.
  const reportsTo = useMemo(() => {
    const map = new Map<number | null, HierarchyPerson[]>();
    for (const p of people ?? []) {
      const key = p.manager_id != null && byId.has(p.manager_id) ? p.manager_id : null;
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    for (const list of map.values()) list.sort((a, b) => fullName(a).localeCompare(fullName(b)));
    return map;
  }, [people, byId]);

  // Drop anyone from the path who has been removed since.
  const trail = path.filter((id) => byId.has(id));
  const currentId = trail.at(-1) ?? null;
  const current = currentId != null ? byId.get(currentId) : undefined;
  const rows = reportsTo.get(currentId) ?? [];

  const change = useMutation({
    mutationFn: ({ person, managerId }: { person: HierarchyPerson; managerId: number | null }) =>
      setManager(person.employee_id, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (error) => Alert.alert(t('org.changeFailed'), errorMessage(error, t)),
  });

  const actions = (person: HierarchyPerson) =>
    Alert.alert(fullName(person), undefined, [
      { text: t('org.changeManager'), onPress: () => setMoving(person) },
      {
        text: t('org.openProfile'),
        onPress: () => router.push({ pathname: '/person/[id]', params: { id: String(person.employee_id) } }),
      },
      { text: t('checkIn.cancel'), style: 'cancel' },
    ]);

  if (hierarchy.isPending) return <StateView kind="loading" />;
  if (hierarchy.isError) {
    return <StateView kind="error" error={hierarchy.error} onRetry={() => hierarchy.refetch()} />;
  }

  const managerChoices = moving
    ? (people ?? [])
        .filter((p) => p.employee_id !== moving.employee_id)
        .map((p) => ({ id: p.employee_id, name: fullName(p) }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return (
    <View style={styles.fill}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.crumbs}>
        <Pressable onPress={() => setPath([])} accessibilityRole="button" hitSlop={6}>
          <Text style={[styles.crumb, trail.length === 0 && styles.crumbHere]}>{hierarchy.data.organisation_name}</Text>
        </Pressable>
        {trail.map((id, i) => (
          <View key={id} style={styles.crumbItem}>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            <Pressable onPress={() => setPath(trail.slice(0, i + 1))} accessibilityRole="button" hitSlop={6}>
              <Text style={[styles.crumb, i === trail.length - 1 && styles.crumbHere]}>{fullName(byId.get(id)!)}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <FlatList
        data={rows}
        keyExtractor={(p) => String(p.employee_id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshing={hierarchy.isRefetching}
        onRefresh={() => hierarchy.refetch()}
        ListHeaderComponent={
          <View style={styles.head}>
            <Text style={styles.headName}>{current ? fullName(current) : hierarchy.data.organisation_name}</Text>
            <Text style={text.muted}>
              {current
                ? [current.designation_name, t('org.reports', { count: rows.length })].filter(Boolean).join(' · ')
                : t('org.topLevel', { count: rows.length })}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <StateView kind="empty" message={current ? t('org.noReports', { name: fullName(current) }) : t('people.empty')} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setPath([...trail, item.employee_id])}
            onLongPress={() => actions(item)}
            accessibilityRole="button"
            accessibilityHint={t('org.hint')}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.body}>
              <Text style={styles.name}>{fullName(item)}</Text>
              <Text style={text.muted}>
                {[item.designation_name, item.direct_reports ? t('org.reports', { count: item.direct_reports }) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <Pressable
              onPress={() => actions(item)}
              accessibilityRole="button"
              accessibilityLabel={t('org.more', { name: fullName(item) })}
              hitSlop={10}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
            </Pressable>
          </Pressable>
        )}
      />

      <OptionSheet
        visible={moving != null}
        title={moving ? t('org.whoManages', { name: fullName(moving) }) : ''}
        options={managerChoices}
        value={moving?.manager_id ?? null}
        noneLabel={hierarchy.data.organisation_name}
        onChoose={(managerId) => {
          const person = moving!;
          setMoving(null);
          if (managerId !== person.manager_id) change.mutate({ person, managerId });
        }}
        onClose={() => setMoving(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  crumbs: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  crumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  crumb: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#60A5FA',
  },
  crumbHere: {
    color: colors.text,
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
  },
  head: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    marginBottom: spacing.md,
  },
  headName: {
    ...text.heading,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginLeft: spacing.md,
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
});

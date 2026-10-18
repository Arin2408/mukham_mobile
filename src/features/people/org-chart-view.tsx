import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { getHierarchy, setManager, type HierarchyPerson } from '@/api/people';
import { getDepartments, getOffices } from '@/api/setup';
import { OptionSheet } from '@/components/picker-field';
import { StateView } from '@/components/state-view';
import { FadeIn, PressableScale } from '@/components/ui/motion';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { StatTile } from '@/components/ui/stat-tile';
import { departmentLabel } from '@/lib/setup-labels';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

import { allManagers, buildChildren, fullName, treeStats, visibleRows, type TreeRow } from './org-tree';

const INDENT = 20;
/** Deeper levels stop indenting further, so names never get squeezed off a phone screen. */
const MAX_INDENT_LEVELS = 6;

/**
 * People › Org chart, as on the web: totals, search, a department filter,
 * and the reporting tree with teams that open and close.
 */
export function OrgChartView() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const hierarchy = useQuery({ queryKey: ['admin', 'hierarchy'], queryFn: getHierarchy });
  const departments = useQuery({ queryKey: ['admin', 'departments'], queryFn: getDepartments });
  const offices = useQuery({ queryKey: ['admin', 'offices'], queryFn: getOffices });

  const people = hierarchy.data?.employees;
  const children = useMemo(() => buildChildren(people ?? []), [people]);
  const stats = useMemo(() => treeStats(children, people?.length ?? 0), [children, people]);

  // Teams open at first: the people who report to the organisation.
  const [expanded, setExpanded] = useState<Set<number> | null>(null);
  const open = useMemo(
    () =>
      expanded ??
      new Set((children.get(null) ?? []).filter((p) => (children.get(p.employee_id) ?? []).length).map((p) => p.employee_id)),
    [expanded, children],
  );
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState<number | null>(null);
  const [pickingDepartment, setPickingDepartment] = useState(false);
  const [moving, setMoving] = useState<HierarchyPerson | null>(null);

  const rows = useMemo(() => visibleRows(children, open, query), [children, open, query]);

  const toggle = (id: number) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const change = useMutation({
    mutationFn: ({ person, managerId }: { person: HierarchyPerson; managerId: number | null }) =>
      setManager(person.employee_id, managerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    onError: (error) => Alert.alert(t('org.changeFailed'), errorMessage(error, t)),
  });

  const actions = (person: HierarchyPerson) =>
    Alert.alert(fullName(person), undefined, [
      { text: t('org.changeManager'), onPress: () => setMoving(person) },
      {
        text: t('org.openProfile'),
        onPress: () => router.push({ pathname: '/people/[id]', params: { id: String(person.employee_id) } }),
      },
      { text: t('checkIn.cancel'), style: 'cancel' },
    ]);

  if (hierarchy.isPending || hierarchy.isError) {
    return (
      <View style={styles.list}>
        {hierarchy.isPending ? (
          <StateView kind="loading" />
        ) : (
          <StateView kind="error" error={hierarchy.error} onRetry={() => hierarchy.refetch()} />
        )}
      </View>
    );
  }

  const departmentOptions = (departments.data ?? []).map((d) => ({
    id: d.department_id,
    name: departmentLabel(d, offices.data ?? []),
  }));
  const departmentName = departmentOptions.find((d) => d.id === department)?.name;

  // Anyone but the person and their own team can be their manager (no loops).
  const managerChoices = moving ? candidateManagers(moving, children, people ?? []) : [];

  return (
    <View style={styles.fill}>
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.person.employee_id)}
        contentContainerStyle={styles.list}
        refreshing={hierarchy.isRefetching}
        onRefresh={() => hierarchy.refetch()}
        initialNumToRender={20}
        windowSize={9}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.tiles}>
              <StatTile compact index={0} tone="blue" value={stats.total} label={t('org.statEmployees')} />
              <StatTile compact index={1} tone="purple" value={stats.topLevel} label={t('org.statTop')} />
              <StatTile compact index={2} tone="purple" value={stats.managers} label={t('org.statManagers')} />
              <StatTile compact index={3} tone="blue" value={stats.levels} label={t('org.statLevels')} />
            </View>

            <FadeIn index={4} style={styles.search}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('org.search')}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={t('org.search')}
                autoCorrect={false}
                style={styles.searchInput}
              />
            </FadeIn>

            <FadeIn index={5} style={styles.toolbar}>
              <Pressable
                onPress={() => setPickingDepartment(true)}
                accessibilityRole="button"
                style={[styles.filter, department != null && styles.filterOn]}>
                <Ionicons
                  name="funnel-outline"
                  size={14}
                  color={department != null ? colors.primaryText : colors.textMuted}
                />
                <Text style={[styles.filterText, department != null && styles.filterTextOn]} numberOfLines={1}>
                  {departmentName ?? t('org.allDepartments')}
                </Text>
              </Pressable>
              <View style={styles.grow} />
              <Pressable onPress={() => setExpanded(allManagers(children))} accessibilityRole="button" hitSlop={6}>
                <Text style={styles.link}>{t('org.expandAll')}</Text>
              </Pressable>
              <Pressable onPress={() => setExpanded(new Set())} accessibilityRole="button" hitSlop={6}>
                <Text style={styles.link}>{t('org.collapseAll')}</Text>
              </Pressable>
            </FadeIn>

            {/* The organisation: the root every chain starts from. */}
            <FadeIn index={6} style={styles.root}>
              <View style={styles.rootIcon}>
                <Ionicons name="business" size={18} color={colors.primaryText} />
              </View>
              <View style={styles.grow}>
                <Text style={styles.rootName} numberOfLines={1}>
                  {hierarchy.data.organisation_name}
                </Text>
                <Text style={styles.meta}>{t('org.topLevel', { count: stats.topLevel })}</Text>
              </View>
            </FadeIn>
          </View>
        }
        ListEmptyComponent={
          <StateView kind="empty" message={query.trim() ? t('attendance.noMatch') : t('people.empty')} />
        }
        renderItem={({ item }) => (
          <TreeNode
            row={item}
            dimmed={department != null && item.person.department_id !== department}
            onToggle={toggle}
            onMenu={actions}
          />
        )}
      />

      <OptionSheet
        visible={pickingDepartment}
        title={t('profile.department')}
        options={departmentOptions}
        value={department}
        noneLabel={t('org.allDepartments')}
        onChoose={(id) => {
          setDepartment(id);
          setPickingDepartment(false);
        }}
        onClose={() => setPickingDepartment(false)}
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

/** Everyone except the person and the people below them: picking those would make a loop. */
function candidateManagers(
  person: HierarchyPerson,
  children: Map<number | null, HierarchyPerson[]>,
  people: HierarchyPerson[],
) {
  const below = new Set<number>();
  const stack = [...(children.get(person.employee_id) ?? [])];
  while (stack.length) {
    const p = stack.pop()!;
    if (below.has(p.employee_id)) continue;
    below.add(p.employee_id);
    stack.push(...(children.get(p.employee_id) ?? []));
  }
  return people
    .filter((p) => p.employee_id !== person.employee_id && !below.has(p.employee_id))
    .map((p) => ({ id: p.employee_id, name: fullName(p) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

type NodeProps = {
  row: TreeRow;
  dimmed: boolean;
  onToggle: (id: number) => void;
  onMenu: (person: HierarchyPerson) => void;
};

/** One person in the tree: connector lines, then their card. */
const TreeNode = memo(function TreeNode({ row, dimmed, onToggle, onMenu }: NodeProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { person, reports, open } = row;
  const depth = Math.min(row.depth, MAX_INDENT_LEVELS);
  const rails = row.rails.slice(0, depth);
  const name = fullName(person);
  const role = [person.designation_name ?? t('org.noDesignation'), person.department_name]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.node, dimmed && styles.dimmed]}>
      {/* Lines down from the managers above, then an elbow into this card. */}
      <View style={{ width: (depth + 1) * INDENT }}>
        {rails.map((continues, i) =>
          continues ? <View key={i} style={[styles.rail, { left: i * INDENT + INDENT / 2 }]} /> : null,
        )}
        <View style={[styles.rail, { left: depth * INDENT + INDENT / 2 }, row.last && styles.railHalf]} />
        <View style={[styles.elbow, { left: depth * INDENT + INDENT / 2 }]} />
      </View>

      <PressableScale
        onPress={() => (reports ? onToggle(person.employee_id) : onMenu(person))}
        onLongPress={() => onMenu(person)}
        accessibilityRole="button"
        accessibilityLabel={name}
        accessibilityHint={reports ? t('org.hintTeam') : t('org.hintMenu')}
        accessibilityState={reports ? { expanded: open } : undefined}
        style={[styles.card, row.match && styles.cardMatch]}>
        {/* A spacer, not a see-through icon: Android can paint "transparent" text after a theme change. */}
        {reports ? (
          <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.textMuted} />
        ) : (
          <View style={styles.chevronSpace} />
        )}
        <PersonAvatar name={name} photo={person.photo} size={36} />
        <View style={styles.grow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {role}
          </Text>
        </View>
        {reports ? (
          <View style={styles.count} accessibilityLabel={t('org.reports', { count: reports })}>
            <Ionicons name="people-outline" size={12} color={colors.textMuted} />
            <Text style={styles.countText}>{reports}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => onMenu(person)}
          accessibilityRole="button"
          accessibilityLabel={t('org.more', { name })}
          hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
        </Pressable>
      </PressableScale>
    </View>
  );
});

const useStyles = makeStyles(({ colors }) => ({
  fill: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  chevronSpace: {
    width: 16,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
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
    alignItems: 'center',
    gap: spacing.md,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '55%',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  filterOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  filterTextOn: {
    color: colors.primaryText,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.infoText,
  },
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
  },
  rootIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  node: {
    flexDirection: 'row',
  },
  dimmed: {
    opacity: 0.35,
  },
  rail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: colors.cardBorder,
  },
  railHalf: {
    bottom: '50%',
  },
  elbow: {
    position: 'absolute',
    top: '50%',
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardBorder,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  cardMatch: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  grow: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.subtle,
  },
  countText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
  },
}));

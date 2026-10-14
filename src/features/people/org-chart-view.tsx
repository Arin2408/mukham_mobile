import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { getHierarchy, setManager, type HierarchyPerson } from '@/api/people';
import { OptionSheet } from '@/components/picker-field';
import { StateView } from '@/components/state-view';
import { Gradient } from '@/components/ui/gradient';
import { FadeIn, PressableScale } from '@/components/ui/motion';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

const fullName = (p: HierarchyPerson) => `${p.first_name} ${p.last_name}`.trim();

/**
 * People › Org chart, one level at a time: the people who report to the
 * organisation, then to whoever you tap. Readable with hundreds of people.
 */
export function OrgChartView() {
  const styles = useStyles();
  const { colors, text, gradients } = useTheme();
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

  const headName = current ? fullName(current) : hierarchy.data.organisation_name;

  return (
    <View style={styles.fill}>
      {/* The path: tap any step to go back up. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.crumbs}>
        <Pressable
          onPress={() => setPath([])}
          accessibilityRole="button"
          hitSlop={6}
          style={[styles.chip, trail.length === 0 && styles.chipHere]}>
          <Ionicons name="business-outline" size={13} color={trail.length === 0 ? colors.primaryText : colors.textMuted} />
          <Text style={[styles.chipText, trail.length === 0 && styles.chipTextHere]}>{hierarchy.data.organisation_name}</Text>
        </Pressable>
        {trail.map((id, i) => {
          const here = i === trail.length - 1;
          return (
            <View key={id} style={styles.crumbItem}>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              <Pressable
                onPress={() => setPath(trail.slice(0, i + 1))}
                accessibilityRole="button"
                hitSlop={6}
                style={[styles.chip, here && styles.chipHere]}>
                <Text style={[styles.chipText, here && styles.chipTextHere]}>{fullName(byId.get(id)!)}</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <FlatList
        data={rows}
        keyExtractor={(p) => String(p.employee_id)}
        contentContainerStyle={styles.list}
        refreshing={hierarchy.isRefetching}
        onRefresh={() => hierarchy.refetch()}
        ListHeaderComponent={
          <FadeIn>
            <Gradient colors={gradients.statBlue} style={styles.head}>
              {current ? (
                <PersonAvatar name={headName} photo={current.photo} size={56} />
              ) : (
                <View style={styles.orgIcon}>
                  <Ionicons name="business" size={26} color={colors.primaryText} />
                </View>
              )}
              <View style={styles.headBody}>
                <Text style={styles.headName} numberOfLines={1}>
                  {headName}
                </Text>
                {current?.designation_name ? <Text style={text.muted}>{current.designation_name}</Text> : null}
                <View style={styles.badge}>
                  <Ionicons name="people" size={13} color={colors.infoText} />
                  <Text style={styles.badgeText}>
                    {current ? t('org.reports', { count: rows.length }) : t('org.topLevel', { count: rows.length })}
                  </Text>
                </View>
              </View>
            </Gradient>
            {rows.length ? <View style={styles.stem} /> : null}
          </FadeIn>
        }
        ListEmptyComponent={
          <StateView kind="empty" message={current ? t('org.noReports', { name: fullName(current) }) : t('people.empty')} />
        }
        renderItem={({ item, index }) => (
          <FadeIn index={index + 1} style={styles.branch}>
            {/* The connector: a line down the left, a tick to each person. */}
            <View style={[styles.rail, index === rows.length - 1 && styles.railLast]} />
            <View style={styles.tick} />
            <PressableScale
              onPress={() => setPath([...trail, item.employee_id])}
              onLongPress={() => actions(item)}
              accessibilityRole="button"
              accessibilityHint={t('org.hint')}
              style={styles.row}>
              <PersonAvatar name={fullName(item)} photo={item.photo} />
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={1}>
                  {fullName(item)}
                </Text>
                <Text style={text.muted} numberOfLines={1}>
                  {[item.designation_name, item.department_name].filter(Boolean).join(' · ') || ' '}
                </Text>
              </View>
              {item.direct_reports ? (
                <View style={styles.count} accessibilityLabel={t('org.reports', { count: item.direct_reports })}>
                  <Ionicons name="people-outline" size={12} color={colors.infoText} />
                  <Text style={styles.countText}>{item.direct_reports}</Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => actions(item)}
                accessibilityRole="button"
                accessibilityLabel={t('org.more', { name: fullName(item) })}
                hitSlop={10}>
                <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
              </Pressable>
            </PressableScale>
          </FadeIn>
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

const RAIL_X = 22;

const useStyles = makeStyles(({ colors, text, statBorders }) => ({
  fill: {
    flex: 1,
  },
  crumbs: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  crumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  chipHere: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  chipTextHere: {
    color: colors.primaryText,
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: statBorders.blue,
    padding: spacing.md,
    overflow: 'hidden',
  },
  orgIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headBody: {
    flex: 1,
    gap: 2,
  },
  headName: {
    ...text.heading,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.infoText,
  },
  stem: {
    marginLeft: RAIL_X,
    width: 2,
    height: spacing.md,
    backgroundColor: colors.cardBorder,
  },
  branch: {
    paddingLeft: RAIL_X + 18,
    paddingBottom: spacing.sm,
  },
  rail: {
    position: 'absolute',
    left: RAIL_X,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.cardBorder,
  },
  railLast: {
    bottom: '55%',
  },
  tick: {
    position: 'absolute',
    left: RAIL_X,
    top: '45%',
    width: 18,
    height: 2,
    backgroundColor: colors.cardBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
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
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  countText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.infoText,
  },
}));

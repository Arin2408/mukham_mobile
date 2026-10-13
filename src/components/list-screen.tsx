import type { ReactElement, ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, text } from '@/theme';

type Props<T> = {
  title: string;
  /** Filters, charts and the like, above the rows. */
  header?: ReactNode;
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  /** Shown instead of the rows when there are none (loading, empty, error). */
  empty?: ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/**
 * Screen for long lists: like Screen, but the rows are virtualised, so
 * months of history stay smooth on a low-end phone.
 */
export function ListScreen<T>({ title, header, data, renderItem, keyExtractor, empty, refreshing, onRefresh }: Props<T>) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[text.title, styles.title]} accessibilityRole="header">
              {title}
            </Text>
            {header}
          </View>
        }
        ListEmptyComponent={empty}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    marginTop: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
});

import type { ReactElement, ReactNode } from 'react';
import { FlatList, RefreshControl, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, spacing, useTheme } from '@/theme';

import { GlowBackground } from './ui/glow-background';
import { GradientText } from './ui/gradient-text';
import { FadeIn } from './ui/motion';

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
  /** Extra space under the last row, e.g. for a floating button. */
  bottomSpace?: number;
};

/**
 * Screen for long lists: like Screen, but the rows are virtualised, so
 * months of history stay smooth on a low-end phone.
 */
export function ListScreen<T>({ title, header, ...rest }: Props<T>) {
  const styles = useStyles();
  const { text } = useTheme();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <GlowBackground />
      <ListScreenBody
        {...rest}
        header={
          <>
            <FadeIn style={styles.titleRow}>
              <View style={styles.titleText}>
                <GradientText style={text.title} accessibilityRole="header">
                  {title}
                </GradientText>
              </View>
            </FadeIn>
            {header}
          </>
        }
      />
    </SafeAreaView>
  );
}

/** The list alone, for screens under a header bar (which gives the title). */
export function ListScreenBody<T>({
  header,
  data,
  renderItem,
  keyExtractor,
  empty,
  refreshing,
  onRefresh,
  bottomSpace = 0,
}: Omit<Props<T>, 'title'>) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <FlatList
      style={styles.list}
      data={data}
      // Each row fades up in turn, as the web's cards do.
      renderItem={(info) => <FadeIn index={info.index + 1}>{renderItem(info)}</FadeIn>}
      keyExtractor={keyExtractor}
      contentContainerStyle={[styles.content, bottomSpace ? { paddingBottom: bottomSpace } : null]}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={header ? <View style={styles.header}>{header}</View> : null}
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
  );
}

function Separator() {
  const styles = useStyles();
  return <View style={styles.separator} />;
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleText: {
    flex: 1,
  },
  separator: {
    height: spacing.sm,
  },
}));

import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, text } from '@/theme';

type Props = {
  title: string;
  children?: ReactNode;
  /** Pull down to refresh, when given. */
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** The frame every tab screen uses: safe area, title, scrolling content. */
export function Screen({ title, children, refreshing, onRefresh }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }>
        <Text style={[text.title, styles.title]} accessibilityRole="header">
          {title}
        </Text>
        {children}
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
  title: {
    marginTop: spacing.sm,
  },
});

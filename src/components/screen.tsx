import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, text } from '@/theme';

import { GlowBackground } from './ui/glow-background';
import { GradientText } from './ui/gradient-text';
import { FadeIn } from './ui/motion';

type Props = {
  title: string;
  children?: ReactNode;
  /** Pull down to refresh, when given. */
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** The frame every tab screen uses: safe area, a faint glow, the gradient title, scrolling content. */
export function Screen({ title, children, refreshing, onRefresh }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <GlowBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }>
        <FadeIn style={styles.title}>
          <GradientText style={text.title} accessibilityRole="header">
            {title}
          </GradientText>
        </FadeIn>
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

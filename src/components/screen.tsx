import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, spacing, useTheme } from '@/theme';

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
  const styles = useStyles();
  const { colors, text } = useTheme();
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
        <FadeIn style={styles.titleRow}>
          <View style={styles.titleText}>
            <GradientText style={text.title} accessibilityRole="header">
              {title}
            </GradientText>
          </View>
        </FadeIn>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
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
}));

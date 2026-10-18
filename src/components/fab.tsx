import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from 'react-native';

import { PressableScale } from '@/components/ui/motion';
import { fonts, makeStyles, spacing, useTheme } from '@/theme';

/** Space to leave under a list so its last row isn't hidden behind the Fab. */
export const FAB_CLEARANCE = 96;

/**
 * The "+ Add" button floating in the bottom-right corner of a list screen.
 * Its parent must fill the screen (flex: 1) for the corner to be the
 * screen's corner.
 */
export function Fab({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.fab}>
      <Ionicons name="add" size={22} color={colors.primaryText} />
      <Text style={styles.text}>{label}</Text>
    </PressableScale>
  );
}

const useStyles = makeStyles(({ colors }) => ({
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
  text: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primaryText,
  },
}));

import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, text } from '@/theme';

/** Marks where a later phase's feature will appear. */
export function PlaceholderCard({ message }: { message: string }) {
  return (
    <View style={styles.card}>
      <Text style={text.muted}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.lg,
  },
});

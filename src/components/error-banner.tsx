import { Text, View } from 'react-native';

import { fonts, makeStyles, radius, spacing } from '@/theme';

/** A clear, red message shown above a form when something fails. */
export function ErrorBanner({ message }: { message: string | null }) {
  const styles = useStyles();
  if (!message) {
    return null;
  }
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  banner: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
}));

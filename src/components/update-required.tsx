import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

type Props = {
  current: string;
  required: string;
  onRetry: () => void;
};

/** Shown instead of the app when the server says this version is too old. */
export function UpdateRequired({ current, required, onRetry }: Props) {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={text.title} accessibilityRole="header">
          {t('update.title')}
        </Text>
        <Text style={[text.body, styles.body]}>{t('update.body', { current, required })}</Text>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{t('update.retry')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  body: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.primaryText,
  },
}));

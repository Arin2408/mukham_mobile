import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ApiError, errorMessage } from '@/api/errors';
import { colors, fonts, spacing, text } from '@/theme';

import { Button } from './button';

type Props =
  | { kind: 'loading' }
  | { kind: 'empty'; message: string }
  | { kind: 'error'; error: unknown; onRetry: () => void };

/** What a list shows when it has no rows: loading, nothing yet, offline or failed. */
export function StateView(props: Props) {
  const { t } = useTranslation();

  if (props.kind === 'loading') {
    return (
      <View style={styles.box} accessibilityLabel={t('states.loading')}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (props.kind === 'empty') {
    return (
      <View style={styles.box}>
        <Ionicons name="file-tray-outline" size={36} color={colors.textMuted} />
        <Text style={styles.message}>{props.message}</Text>
      </View>
    );
  }

  const offline = props.error instanceof ApiError && props.error.code === 'network_error';
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Ionicons name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'} size={36} color={colors.textMuted} />
      <Text style={styles.heading}>{offline ? t('states.offlineTitle') : t('states.errorTitle')}</Text>
      <Text style={styles.message}>{offline ? t('states.offlineBody') : errorMessage(props.error, t)}</Text>
      <Button variant="link" label={t('states.retry')} onPress={props.onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  message: {
    ...text.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

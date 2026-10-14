import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ApiError, errorMessage } from '@/api/errors';
import { fonts, makeStyles, spacing, useTheme } from '@/theme';

import { Button } from './button';
import { Skeleton } from './ui/skeleton';
import { FadeIn } from './ui/motion';

type Props =
  | { kind: 'loading' }
  | { kind: 'empty'; message: string }
  | { kind: 'error'; error: unknown; onRetry: () => void };

/** What a list shows when it has no rows: loading, nothing yet, offline or failed. */
export function StateView(props: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (props.kind === 'loading') {
    return <Skeleton />;
  }

  if (props.kind === 'empty') {
    return (
      <FadeIn style={styles.box}>
        <Ionicons name="file-tray-outline" size={36} color={colors.textMuted} />
        <Text style={styles.message}>{props.message}</Text>
      </FadeIn>
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

const useStyles = makeStyles(({ colors, text }) => ({
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
}));

import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { API_BASE_URL } from '@/api/config';
import { useServerStatus } from '@/hooks/use-server';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

/** A small line showing whether the app can reach the server. */
export function ServerStatus() {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const { isPending, isError } = useServerStatus();

  const state = isPending ? 'checking' : isError ? 'unreachable' : 'connected';
  const dotColor = {
    checking: colors.textMuted,
    unreachable: colors.danger,
    connected: colors.success,
  }[state];

  return (
    <View style={styles.row} accessibilityLiveRegion="polite">
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.texts}>
        <Text style={styles.label}>{t(`server.${state}`)}</Text>
        <Text style={text.muted} numberOfLines={1}>
          {t('server.address', { url: API_BASE_URL })}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
}));

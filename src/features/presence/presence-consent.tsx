import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

import { askBackgroundLocation, backgroundLocationStatus, syncPresence } from './presence';

type Status = Awaited<ReturnType<typeof backgroundLocationStatus>>;

/**
 * Shown after check-in until "Allow all the time" location is on: says
 * what is tracked and when, then asks. Android 11+ opens the app's settings
 * page for this, so the answer is read again when the app comes back.
 */
export function PresenceConsent() {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const check = () =>
      backgroundLocationStatus()
        .then((next) => {
          setStatus(next);
          if (next === 'granted') return syncPresence();
        })
        .catch(() => setStatus('unavailable'));
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, []);

  if (status === null || status === 'unavailable') return null;

  if (status === 'granted') {
    return <Text style={[text.muted, styles.centered]}>{t('presence.on')}</Text>;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('presence.consentTitle')}</Text>
      <Text style={text.muted}>{t('presence.consentBody')}</Text>
      {status === 'askable' ? (
        <Button
          variant="secondary"
          label={t('presence.allow')}
          onPress={() => askBackgroundLocation().then((granted) => granted && setStatus('granted'))}
        />
      ) : (
        <>
          <Text style={text.muted}>{t('presence.blocked')}</Text>
          <Button variant="secondary" label={t('checkIn.openSettings')} onPress={() => Linking.openSettings()} />
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    alignSelf: 'stretch',
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  centered: {
    textAlign: 'center',
  },
}));

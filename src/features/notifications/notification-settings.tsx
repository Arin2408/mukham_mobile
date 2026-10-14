import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Switch, Text, View } from 'react-native';

import { ApiError, errorMessage } from '@/api/errors';
import {
  getNotificationPreferences,
  setNotificationPreferences,
  type NotificationPreferences,
} from '@/api/notifications';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { fonts, makeStyles, radius, spacing, useTheme } from '@/theme';

import { askPushPermission, getPushPermission, registerForPush, type PushPermission } from './push';

/** The server's message, or the phone's own error text (e.g. from Firebase). */
function reasonOf(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) return errorMessage(error, t);
  return error instanceof Error && error.message ? error.message : t('errors.unknown');
}

const KINDS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: 'shift_start', label: 'push.switchShift' },
  { key: 'check_out', label: 'push.switchCheckOut' },
  { key: 'new_task', label: 'push.switchTask' },
];

/** Profile › Notifications: the phone's permission, and a switch for each kind. */
export function NotificationSettings() {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<PushPermission | null>(null);

  // Read again when the person comes back from the phone's settings.
  useEffect(() => {
    const check = () => getPushPermission().then(setPermission);
    check();
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => subscription.remove();
  }, []);

  // Registering this phone with the server; a failure is shown, not hidden.
  const registration = useQuery({
    queryKey: ['push-registration'],
    queryFn: registerForPush,
    enabled: permission === 'granted',
    retry: false,
    staleTime: Infinity,
  });

  const prefs = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
    enabled: permission === 'granted',
  });
  const change = useMutation({
    mutationFn: setNotificationPreferences,
    onSuccess: (updated) => queryClient.setQueryData(['notification-preferences'], updated),
  });

  const turnOn = async () => {
    const result = await askPushPermission();
    setPermission(result);
    if (result === 'granted') await queryClient.invalidateQueries({ queryKey: ['push-registration'] });
  };

  return (
    <View style={styles.card}>
      <Text style={text.heading}>{t('push.title')}</Text>
      {permission === 'unavailable' ? (
        <Text style={text.muted}>{t('push.unavailable')}</Text>
      ) : permission === 'denied' ? (
        <>
          <Text style={text.muted}>{t('push.denied')}</Text>
          <Button variant="secondary" label={t('checkIn.openSettings')} onPress={() => Linking.openSettings()} />
        </>
      ) : permission === 'undetermined' ? (
        <>
          <Text style={text.muted}>{t('push.offNote')}</Text>
          <Button label={t('push.turnOn')} onPress={turnOn} />
        </>
      ) : permission === 'granted' && prefs.data ? (
        KINDS.map(({ key, label }) => {
          // Shows the new position while it saves; flips back if saving fails.
          const on = (change.isPending ? change.variables?.[key] : undefined) ?? prefs.data[key];
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{t(label)}</Text>
              <Switch
                value={on}
                onValueChange={(value) => change.mutate({ [key]: value })}
                trackColor={{ true: colors.primary, false: colors.cardBorder }}
                accessibilityLabel={t(label)}
              />
            </View>
          );
        })
      ) : permission === 'granted' && prefs.isError ? (
        <ErrorBanner message={errorMessage(prefs.error, t)} />
      ) : null}
      {permission === 'granted' && registration.isError ? (
        <>
          <ErrorBanner message={t('push.registerFailed', { reason: reasonOf(registration.error, t) })} />
          <Button variant="secondary" label={t('states.retry')} onPress={() => registration.refetch()} />
        </>
      ) : null}
      {change.isError ? <ErrorBanner message={errorMessage(change.error, t)} /> : null}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
}));

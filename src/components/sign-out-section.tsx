import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { APP_VERSION } from '@/hooks/use-server';
import { useSession } from '@/store/session';
import { spacing, useTheme } from '@/theme';

import { Button } from './button';

/** Who is signed in, the Sign out button and the app version. */
export function SignOutSection() {
  const { text } = useTheme();
  const { t } = useTranslation();
  const role = useSession((s) => s.role);
  const signOut = useSession((s) => s.signOut);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function onSignOut() {
    setLoading(true);
    await signOut();
    // Nothing from this person's session stays cached for the next one.
    queryClient.clear();
  }

  return (
    <View style={styles.section}>
      <Text style={text.muted}>
        {t('account.signedInAs', {
          role: t(role === 'organization' ? 'account.roleAdmin' : 'account.roleEmployee'),
        })}
      </Text>
      <Button variant="danger" label={t('account.signOut')} onPress={onSignOut} loading={loading} />
      <Text style={text.muted}>{t('app.version', { version: APP_VERSION })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});

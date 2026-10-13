import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { requestPasswordReset } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { text } from '@/theme';

/**
 * Admins only. The emailed link opens the web app's reset page, which
 * works on any device; the new password then works here too.
 */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t('forgot.invalidInput'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title={t('forgot.title')}>
      {sent ? (
        <Text style={styles.body}>{t('forgot.sent')}</Text>
      ) : (
        <>
          <Text style={styles.body}>{t('forgot.body')}</Text>
          <ErrorBanner message={error} />
          <TextField
            label={t('forgot.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            onSubmitEditing={submit}
          />
          <Button label={t('forgot.submit')} onPress={submit} loading={loading} />
        </>
      )}
      <Button variant="link" label={t('forgot.back')} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    ...text.body,
    lineHeight: 22,
  },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { cleanMobile, registerOrganisation } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { colors, fonts, radius, spacing, text } from '@/theme';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', mobile: '', email: '', details: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ mobile: string; password: string } | null>(null);

  const update = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });

  async function submit() {
    if (!form.name.trim() || cleanMobile(form.mobile).length !== 10) {
      setError(t('register.invalidInput'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await registerOrganisation(form);
      setDone({ mobile: data.mobile_number, password: data.generated_password });
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Screen title={t('register.doneTitle')}>
        <Text style={styles.body}>{t('register.doneBody', { mobile: done.mobile })}</Text>
        <View style={styles.passwordBox}>
          <Text style={styles.password} selectable>
            {done.password}
          </Text>
        </View>
        <Button label={t('register.toSignIn')} onPress={() => router.replace('/sign-in')} />
      </Screen>
    );
  }

  return (
    <Screen title={t('register.title')}>
      <ErrorBanner message={error} />
      <TextField label={t('register.name')} value={form.name} onChangeText={update('name')} />
      <TextField
        label={t('register.mobile')}
        value={form.mobile}
        onChangeText={update('mobile')}
        keyboardType="phone-pad"
        maxLength={15}
      />
      <TextField
        label={t('register.email')}
        value={form.email}
        onChangeText={update('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextField label={t('register.details')} value={form.details} onChangeText={update('details')} multiline />
      <Button label={t('register.submit')} onPress={submit} loading={loading} />
      <Button variant="link" label={t('forgot.back')} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    ...text.body,
    lineHeight: 22,
  },
  passwordBox: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  password: {
    fontFamily: fonts.bold,
    fontSize: 24,
    letterSpacing: 1,
    color: colors.text,
  },
});

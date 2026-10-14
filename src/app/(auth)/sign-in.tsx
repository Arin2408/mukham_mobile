import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { adminSignIn, cleanMobile, employeePasswordStep, isFaceRegistered } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { Segmented } from '@/components/segmented';
import { TextField } from '@/components/text-field';
import { Gradient } from '@/components/ui/gradient';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { FadeIn } from '@/components/ui/motion';
import { BrandPanel } from '@/features/brand/brand-panel';
import { useEmployeeSignIn, useSession } from '@/store/session';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

type Role = 'employee' | 'admin';

export default function SignInScreen() {
  const styles = useStyles();
  const { text, gradients } = useTheme();
  const { t } = useTranslation();
  const signIn = useSession((s) => s.signIn);
  const startEmployeeSignIn = useEmployeeSignIn((s) => s.start);
  const insets = useSafeAreaInsets();

  const [role, setRole] = useState<Role>('employee');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (cleanMobile(mobile).length !== 10 || !password) {
      setError(t('signIn.invalidInput'));
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (role === 'admin') {
        const data = await adminSignIn(mobile, password);
        await signIn({ access: data.access, refresh: data.refresh }, 'organization');
        return;
      }

      // Employee: password first, then the live face check.
      const { pre_auth_token } = await employeePasswordStep(mobile, password);
      const registered = await isFaceRegistered(mobile);
      startEmployeeSignIn(cleanMobile(mobile), pre_auth_token, registered);
      setPassword('');
      router.push(registered ? '/face' : '/consent');
    } catch (e) {
      const message = errorMessage(e, t);
      setError(message === t('errors.unknown') ? t('signIn.failed') : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
          keyboardShouldPersistTaps="handled">
          <BrandPanel tagline={t('brand.tagline')} topInset={insets.top} />

          {/* The form card overlaps the panel, with the web's gradient border. */}
          <FadeIn index={3} style={styles.cardWrap}>
            <Gradient colors={gradients.border} style={styles.border}>
              <View style={styles.card}>
                <View style={styles.titleRow}>
                  <Text style={[text.heading, styles.grow]}>{t('signIn.title')}</Text>
                  <ThemeToggle />
                </View>
                <Text style={[text.muted, styles.subtitle]}>{t('signIn.subtitle')}</Text>

                <Segmented
                  options={[
                    { value: 'employee', label: t('signIn.roleEmployee') },
                    { value: 'admin', label: t('signIn.roleAdmin') },
                  ]}
                  value={role}
                  onChange={(value) => {
                    setRole(value);
                    setError(null);
                  }}
                />

                <ErrorBanner message={error} />

                <TextField
                  label={t('signIn.mobile')}
                  placeholder={t('signIn.mobilePlaceholder')}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={15}
                />
                <TextField
                  label={t('signIn.password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  onSubmitEditing={submit}
                />

                <Button label={t('signIn.continue')} onPress={submit} loading={loading} />

                {role === 'admin' ? (
                  <View style={styles.links}>
                    <Button variant="link" label={t('signIn.adminForgot')} onPress={() => router.push('/forgot-password')} />
                    <Button variant="link" label={t('signIn.register')} onPress={() => router.push('/register')} />
                  </View>
                ) : (
                  <Text style={[text.muted, styles.center]}>{t('signIn.employeeForgot')}</Text>
                )}
              </View>
            </Gradient>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
  },
  cardWrap: {
    marginTop: -spacing.xl,
    marginHorizontal: spacing.md,
  },
  border: {
    borderRadius: radius.lg + 1,
    padding: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grow: {
    flex: 1,
  },
  subtitle: {
    marginTop: -spacing.sm,
  },
  links: {
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
}));

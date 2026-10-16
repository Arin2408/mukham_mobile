import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { changePassword } from '@/api/auth';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { TextField } from '@/components/text-field';
import { savedPushToken } from '@/features/notifications/push';
import { makeStyles, spacing, useTheme } from '@/theme';

const MIN_LENGTH = 8;

/** Change your own password (admin or employee); other devices are signed out. */
export function ChangePasswordScreen() {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => changePassword(current, next, await savedPushToken()),
    onSuccess: () => {
      Alert.alert(t('account.changedTitle'), t('account.changedBody'), [{ text: 'OK', onPress: () => router.back() }]);
    },
  });

  const submit = () => {
    const issue = !current || !next
      ? t('account.invalid.missing')
      : next.length < MIN_LENGTH
        ? t('account.invalid.short')
        : next !== confirm
          ? t('account.invalid.mismatch')
          : null;
    setProblem(issue);
    if (!issue) save.mutate();
  };

  const passwordProps = { secureTextEntry: true, autoCapitalize: 'none', autoCorrect: false, maxLength: 128 } as const;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label={t('account.currentPassword')}
          value={current}
          onChangeText={setCurrent}
          autoComplete="current-password"
          textContentType="password"
          {...passwordProps}
        />
        <TextField
          label={t('account.newPassword')}
          value={next}
          onChangeText={setNext}
          autoComplete="new-password"
          textContentType="newPassword"
          {...passwordProps}
        />
        <TextField
          label={t('account.confirmPassword')}
          value={confirm}
          onChangeText={setConfirm}
          autoComplete="new-password"
          textContentType="newPassword"
          {...passwordProps}
        />
        <Text style={text.muted}>{t('account.passwordNote')}</Text>
        <ErrorBanner message={problem ?? (save.isError ? errorMessage(save.error, t) : null)} />
        <Button label={t('account.save')} onPress={submit} loading={save.isPending} />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
}));

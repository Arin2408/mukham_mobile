import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/errors';
import { getOrgProfile, updateOrgProfile } from '@/api/setup';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { makeStyles, spacing, useTheme } from '@/theme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The organisation's name, email (for password resets) and details. */
export default function OrgProfileScreen() {
  const styles = useStyles();
  const profile = useQuery({ queryKey: ['admin', 'org-profile'], queryFn: getOrgProfile });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      {profile.isPending ? (
        <StateView kind="loading" />
      ) : profile.isError ? (
        <StateView kind="error" error={profile.error} onRetry={() => profile.refetch()} />
      ) : (
        <ProfileForm profile={profile.data} />
      )}
    </SafeAreaView>
  );
}

type Loaded = Awaited<ReturnType<typeof getOrgProfile>>;

function ProfileForm({ profile }: { profile: Loaded }) {
  const styles = useStyles();
  const { text } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [details, setDetails] = useState(profile.details ?? '');
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => updateOrgProfile(profile.id, { name: name.trim(), email: email.trim(), details: details.trim() || null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      router.back();
    },
  });

  const submit = () => {
    const issue = !name.trim() ? t('setup.invalid.name') : !EMAIL.test(email.trim()) ? t('person.invalid.email') : null;
    setProblem(issue);
    if (!issue) save.mutate();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextField label={t('setup.orgName')} value={name} onChangeText={setName} />
      <TextField
        label={t('profile.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={text.muted}>{t('setup.emailNote')}</Text>
      <TextField label={t('register.details')} value={details} onChangeText={setDetails} multiline />
      {profile.mobile_number ? <Text style={text.muted}>{t('setup.signInMobile', { mobile: profile.mobile_number })}</Text> : null}
      <ErrorBanner message={problem ?? (save.isError ? errorMessage(save.error, t) : null)} />
      <Button label={t('person.save')} onPress={submit} loading={save.isPending} />
    </ScrollView>
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

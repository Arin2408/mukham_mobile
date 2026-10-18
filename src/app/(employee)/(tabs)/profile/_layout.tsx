import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackHeader } from '@/components/stack-header';

export const unstable_settings = { initialRouteName: 'index' };

/** The Profile tab: the profile, and changing the password, under the tab bar. */
export default function ProfileStack() {
  const header = useStackHeader();
  const { t } = useTranslation();
  return (
    <Stack screenOptions={header}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ title: t('account.changePassword') }} />
    </Stack>
  );
}

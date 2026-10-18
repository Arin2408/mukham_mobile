import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackHeader } from '@/components/stack-header';

// Opening a Setup screen from elsewhere (the dashboard checklist) still
// leaves Setup itself underneath, for the back arrow.
export const unstable_settings = { initialRouteName: 'index' };

/** The Setup tab: its list, and the screens it opens, under the tab bar. */
export default function SetupStack() {
  const header = useStackHeader();
  const { t } = useTranslation();
  return (
    <Stack screenOptions={header}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="departments" options={{ title: t('setup.departments') }} />
      <Stack.Screen name="department" />
      <Stack.Screen name="designations" options={{ title: t('setup.designations') }} />
      <Stack.Screen name="shifts" options={{ title: t('setup.shifts') }} />
      <Stack.Screen name="shift" />
      <Stack.Screen name="offices" options={{ title: t('setup.offices') }} />
      <Stack.Screen name="office" />
      <Stack.Screen name="profile" options={{ title: t('setup.profile') }} />
      <Stack.Screen name="password" options={{ title: t('account.changePassword') }} />
    </Stack>
  );
}

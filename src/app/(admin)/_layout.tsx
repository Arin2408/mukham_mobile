import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { colors, fonts } from '@/theme';

const withHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.semibold },
  headerShadowVisible: false,
};

/**
 * The admin's area: the tabs, plus screens on top of them: one employee's
 * attendance, an employee's page, the ID card, the employee and task forms,
 * and the Setup screens.
 */
export default function AdminLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="employee/[id]" options={withHeader} />
      <Stack.Screen name="person/[id]" options={withHeader} />
      <Stack.Screen name="person/form" options={{ ...withHeader, presentation: 'modal' }} />
      <Stack.Screen name="person/card" options={{ presentation: 'modal' }} />
      <Stack.Screen name="task-form" options={{ ...withHeader, presentation: 'modal' }} />
      <Stack.Screen name="setup/departments" options={{ ...withHeader, title: t('setup.departments') }} />
      <Stack.Screen name="setup/department" options={withHeader} />
      <Stack.Screen name="setup/designations" options={{ ...withHeader, title: t('setup.designations') }} />
      <Stack.Screen name="setup/shifts" options={{ ...withHeader, title: t('setup.shifts') }} />
      <Stack.Screen name="setup/shift" options={withHeader} />
      <Stack.Screen name="setup/offices" options={{ ...withHeader, title: t('setup.offices') }} />
      <Stack.Screen name="setup/office" options={withHeader} />
      <Stack.Screen name="setup/profile" options={{ ...withHeader, title: t('setup.profile') }} />
    </Stack>
  );
}

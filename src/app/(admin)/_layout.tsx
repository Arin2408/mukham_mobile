import { Stack } from 'expo-router';

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
 * attendance, an employee's page, the ID card, and the employee and task forms.
 */
export default function AdminLayout() {
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
    </Stack>
  );
}

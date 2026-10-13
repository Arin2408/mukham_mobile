import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** The employee's area: the tabs, plus full-screen steps such as check-in. */
export default function EmployeeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="check-in" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
    </Stack>
  );
}

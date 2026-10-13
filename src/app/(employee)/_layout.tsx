import { Stack } from 'expo-router';

import { colors, fonts } from '@/theme';

/**
 * The employee's area: the tabs, plus screens on top of them: check-in,
 * a task's details and the ID card.
 */
export default function EmployeeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="check-in" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen
        name="task/[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="id-card" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

import { Stack } from 'expo-router';

import { colors, fonts } from '@/theme';

/** The admin's area: the tabs, plus screens on top of them such as one employee's attendance. */
export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="employee/[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}

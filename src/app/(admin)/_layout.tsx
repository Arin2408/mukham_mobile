import { Stack } from 'expo-router';

import { useStackHeader } from '@/components/stack-header';
import { useTheme } from '@/theme';

/**
 * The admin's area: the tabs (each with its own pages under the tab bar),
 * plus forms that open over everything: the employee and task forms and the
 * ID card.
 */
export default function AdminLayout() {
  const { colors } = useTheme();
  const header = useStackHeader();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="person/form" options={{ ...header, presentation: 'modal' }} />
      <Stack.Screen name="person/card" options={{ presentation: 'modal' }} />
      <Stack.Screen name="task-form" options={{ ...header, presentation: 'modal' }} />
    </Stack>
  );
}

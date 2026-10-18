import { Stack } from 'expo-router';

import { useStackHeader } from '@/components/stack-header';

export const unstable_settings = { initialRouteName: 'index' };

/** The Attendance tab: its list, and one person's page, under the tab bar. */
export default function AttendanceStack() {
  const header = useStackHeader();
  return (
    <Stack screenOptions={header}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

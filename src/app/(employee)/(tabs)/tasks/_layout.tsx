import { Stack } from 'expo-router';

import { useStackHeader } from '@/components/stack-header';

export const unstable_settings = { initialRouteName: 'index' };

/** The Tasks tab: the list, and a task's details, under the tab bar. */
export default function TasksStack() {
  const header = useStackHeader();
  return (
    <Stack screenOptions={header}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

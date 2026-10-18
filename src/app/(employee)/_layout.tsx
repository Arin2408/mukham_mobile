import { Stack } from 'expo-router';

import { useStackHeader } from '@/components/stack-header';
import { usePushSetup } from '@/features/notifications/use-push-setup';
import { useTheme } from '@/theme';

/**
 * The employee's area: the tabs (each with its own pages under the tab
 * bar), plus what opens over everything: check-in, a manager's team task
 * form, the ID card and the notifications intro.
 */
export default function EmployeeLayout() {
  const { colors } = useTheme();
  const header = useStackHeader();
  usePushSetup();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="check-in" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      {/* Old link from notifications: forwards to the task inside the Tasks tab. */}
      <Stack.Screen name="task/[id]" />
      <Stack.Screen name="team-task" options={{ ...header, presentation: 'modal' }} />
      <Stack.Screen name="id-card" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications-intro" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

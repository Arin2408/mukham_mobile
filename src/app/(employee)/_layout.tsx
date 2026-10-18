import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { usePushSetup } from '@/features/notifications/use-push-setup';
import { fonts, useTheme } from '@/theme';

/**
 * The employee's area: the tabs, plus screens on top of them: check-in,
 * a task's details, a manager's team task form, the ID card and changing
 * the password.
 */
export default function EmployeeLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  usePushSetup();

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
      <Stack.Screen
        name="team-task"
        options={{
          headerShown: true,
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="id-card" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications-intro" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="change-password"
        options={{
          headerShown: true,
          title: t('account.changePassword'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.semibold },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}

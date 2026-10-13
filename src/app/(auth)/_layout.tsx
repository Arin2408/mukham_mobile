import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Sign-in, face enrolment, organisation sign-up and password reset. */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="face" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}

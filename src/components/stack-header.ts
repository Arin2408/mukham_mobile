import type { Stack } from 'expo-router';
import type { ComponentProps } from 'react';

import { fonts, useTheme } from '@/theme';

type ScreenOptions = Extract<NonNullable<ComponentProps<typeof Stack>['screenOptions']>, object>;

/** The header bar (title and back arrow) of screens opened inside a tab or on top of the tabs. */
export function useStackHeader() {
  const { colors } = useTheme();
  return {
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: fonts.semibold },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  } satisfies ScreenOptions;
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { fonts, useTheme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}

/** The organisation admin's tabs. Employees never see these. */
export default function AdminTabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Leaving a tab closes what was opened inside it, so coming back to
        // Setup (or People, Attendance) shows its main list again.
        popToTopOnBlur: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.cardBorder },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{ title: t('admin.dashboard'), tabBarIcon: tabIcon('grid-outline') }}
      />
      <Tabs.Screen
        name="attendance"
        options={{ title: t('admin.attendance'), tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tabs.Screen
        name="people"
        options={{ title: t('admin.people'), tabBarIcon: tabIcon('people-outline') }}
      />
      <Tabs.Screen
        name="setup"
        options={{ title: t('admin.setup'), tabBarIcon: tabIcon('settings-outline') }}
      />
    </Tabs>
  );
}

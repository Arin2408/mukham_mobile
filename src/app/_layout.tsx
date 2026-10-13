import '@/i18n';

import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  useFonts,
} from '@expo-google-fonts/archivo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';

import { setOnSessionExpired } from '@/api/client';
import { UpdateRequired } from '@/components/update-required';
import { APP_VERSION, useAppConfig } from '@/hooks/use-server';
import { useSession } from '@/store/session';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.tabBar,
    text: colors.text,
    border: colors.cardBorder,
  },
};

/** Blocks the app with "Update required" when the server asks for it. */
function VersionGate({ children }: { children: ReactNode }) {
  const { updateRequired, minVersion, refetch } = useAppConfig();

  if (updateRequired && minVersion) {
    return <UpdateRequired current={APP_VERSION} required={minVersion} onRetry={() => refetch()} />;
  }
  return children;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
  });

  const status = useSession((s) => s.status);
  const role = useSession((s) => s.role);

  useEffect(() => {
    // A session that can no longer be renewed signs this phone out.
    setOnSessionExpired(() => useSession.getState().expire());
    useSession.getState().restore();
  }, []);

  const ready = fontsLoaded && status !== 'loading';

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  const signedIn = status === 'signedIn';

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="light" />
        <VersionGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}>
            {/* Each group exists only for the person allowed to see it. */}
            <Stack.Protected guard={signedIn && role === 'employee'}>
              <Stack.Screen name="(employee)" />
            </Stack.Protected>
            <Stack.Protected guard={signedIn && role === 'organization'}>
              <Stack.Screen name="(admin)" />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
        </VersionGate>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

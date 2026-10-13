import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';

import { api } from '@/api/client';
import { compareVersions } from '@/lib/version';

export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

type AppConfig = { min_app_version: string };

/**
 * The server's minimum supported app version. If the server can't be
 * reached, the app keeps working; the check runs again on the next start.
 */
export function useAppConfig() {
  const query = useQuery({
    queryKey: ['app-config'],
    queryFn: () => api<AppConfig>('/app/config', { auth: false }),
  });

  const minVersion = query.data?.min_app_version;
  const updateRequired = minVersion ? compareVersions(APP_VERSION, minVersion) < 0 : false;

  return { ...query, minVersion, updateRequired };
}

/** Whether the server (and its database) answers. Re-checked every 30 s. */
export function useServerStatus() {
  return useQuery({
    queryKey: ['server-status'],
    queryFn: () => api<{ status: string; database: boolean }>('/health/db', { auth: false }),
    refetchInterval: 30_000,
    retry: false,
  });
}

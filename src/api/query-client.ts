import { QueryClient } from '@tanstack/react-query';

/**
 * The app's one cache of server data. Kept here, not in the root layout, so
 * the session can empty it whenever someone is signed out (see store/session).
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

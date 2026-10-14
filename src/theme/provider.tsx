import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { themeFor, type Scheme, type Theme } from './tokens';

const KEY = 'mukham.theme';
const THEMES = { dark: themeFor('dark'), light: themeFor('light') } as const;

type Choice = { theme: Theme; setScheme: (scheme: Scheme) => void; toggle: () => void };

// Without a provider (tests, previews) everything is the dark theme.
const ThemeContext = createContext<Choice>({ theme: THEMES.dark, setScheme: () => {}, toggle: () => {} });

async function readSaved(): Promise<Scheme | null> {
  try {
    const value =
      Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

async function save(scheme: Scheme): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, scheme);
    else await SecureStore.setItemAsync(KEY, scheme);
  } catch {
    // Not saved: the choice still applies until the app closes.
  }
}

/** Holds the light/dark choice (dark by default, as on the web) and remembers it on the phone. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<Scheme>('dark');

  useEffect(() => {
    readSaved().then((saved) => saved && setSchemeState(saved));
  }, []);

  const setScheme = useCallback((next: Scheme) => {
    setSchemeState(next);
    save(next);
  }, []);

  const value = useMemo<Choice>(
    () => ({
      theme: THEMES[scheme],
      setScheme,
      toggle: () => setScheme(scheme === 'dark' ? 'light' : 'dark'),
    }),
    [scheme, setScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The current theme: colours, text styles, gradients. */
export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

/** The current theme plus the switch. */
export function useThemeChoice(): Choice {
  return useContext(ThemeContext);
}

/**
 * Styles that follow the theme: write them as a function of the theme, get
 * a hook. Each theme's styles are built once and kept.
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(build: (theme: Theme) => T) {
  const cache = new Map<Scheme, T>();
  return function useStyles(): T {
    const theme = useTheme();
    let styles = cache.get(theme.scheme);
    if (!styles) {
      styles = StyleSheet.create(build(theme));
      cache.set(theme.scheme, styles);
    }
    return styles;
  };
}

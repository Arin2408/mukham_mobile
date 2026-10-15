import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { crossFade, release, snapshot } from './snapshot';
import { themeFor, type Scheme, type Theme } from './tokens';

const KEY = 'mukham.theme';
/** How long the new theme takes to spread across the screen. */
const WAVE = 650;
/** If a switch hasn't finished by now, something failed: drop the pictures and show the new theme. */
const GIVE_UP = 4000;
const THEMES = { dark: themeFor('dark'), light: themeFor('light') } as const;

/** Where on screen the switch was tapped; the new theme spreads out from there. */
export type Origin = { x: number; y: number };

type Choice = {
  theme: Theme;
  setScheme: (scheme: Scheme, origin?: Origin) => void;
  toggle: (origin?: Origin) => void;
};

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

/**
 * A switch in progress: pictures of the app before and after, and the circle
 * the new theme grows from (centre and final radius).
 */
type Wave = { before: string; after: string | null; x: number; y: number; radius: number };

/** Holds the light/dark choice (dark by default, as on the web) and remembers it on the phone. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<Scheme>('dark');
  const [wave, setWave] = useState<Wave | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const grow = useSharedValue(0);
  const reduced = useReducedMotion();
  const content = useRef<View>(null);
  const target = useRef<Scheme>('dark');
  const busy = useRef(false);
  // The wave on screen, for callbacks that outlive a render; and whether it has started growing.
  const live = useRef<Wave | null>(null);
  const started = useRef(false);

  useEffect(() => {
    readSaved().then((saved) => {
      if (saved) {
        target.current = saved;
        setSchemeState(saved);
      }
    });
  }, []);

  const show = useCallback((next: Wave | null) => {
    live.current = next;
    setWave(next);
  }, []);

  // Ends the switch, whether the wave finished or something failed along the way. Safe to call twice.
  const finish = useCallback(() => {
    const done = live.current;
    if (!done) return;
    show(null);
    release(done.before);
    if (done.after) release(done.after);
    busy.current = false;
    // Switched again mid-wave, or failed before restyling: catch up.
    setSchemeState(target.current);
  }, [show]);

  // Never leave the pictures up: a picture that fails to load or a wave that stalls ends the switch.
  const waveId = wave?.before;
  useEffect(() => {
    if (!waveId) return;
    const timer = setTimeout(finish, GIVE_UP);
    return () => clearTimeout(timer);
  }, [waveId, finish]);

  // The new theme is drawn under the "before" picture: take its picture too.
  useEffect(() => {
    if (!wave || wave.after || scheme !== target.current) return;
    let cancelled = false;
    requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        const after = await snapshot(content.current);
        if (cancelled) return;
        if (after) show({ ...wave, after });
        else finish();
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [wave, scheme, finish, show]);

  const startWave = useCallback(() => {
    // Images can report loading more than once; grow only once.
    if (started.current) return;
    started.current = true;
    grow.set(
      withTiming(1, { duration: WAVE, easing: Easing.inOut(Easing.cubic) }, () => {
        scheduleOnRN(finish);
      }),
    );
  }, [grow, finish]);

  const setScheme = useCallback(
    async (next: Scheme, origin?: Origin) => {
      save(next);
      if (next === target.current) return;
      target.current = next;
      if (busy.current) return;
      const apply = () => setSchemeState(next);
      if (reduced) {
        apply();
        return;
      }
      const x = origin?.x ?? size.width / 2;
      const y = origin?.y ?? size.height / 2;
      if (crossFade(apply, { x, y })) return;

      busy.current = true;
      const before = await snapshot(content.current);
      if (!before) {
        busy.current = false;
        setSchemeState(target.current);
        return;
      }
      grow.set(0);
      started.current = false;
      const radius = Math.hypot(Math.max(x, size.width - x), Math.max(y, size.height - y));
      show({ before, after: null, x, y, radius });
    },
    [reduced, size, grow, show],
  );

  const value = useMemo<Choice>(
    () => ({
      theme: THEMES[scheme],
      setScheme,
      toggle: (origin) => setScheme(target.current === 'dark' ? 'light' : 'dark', origin),
    }),
    [scheme, setScheme],
  );

  const circle = useAnimatedStyle(() => {
    const r = (wave?.radius ?? 0) * grow.get();
    const x = wave?.x ?? 0;
    const y = wave?.y ?? 0;
    return { left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r };
  }, [wave]);
  // Keeps the picture still while the circle around it grows.
  const inside = useAnimatedStyle(() => {
    const r = (wave?.radius ?? 0) * grow.get();
    return { left: r - (wave?.x ?? 0), top: r - (wave?.y ?? 0) };
  }, [wave]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={styles.root} onLayout={(e) => setSize(e.nativeEvent.layout)}>
        <View ref={content} collapsable={false} style={styles.root}>
          {children}
        </View>
        {wave ? (
          // Catches touches while the pictures are up, so nobody taps the hidden screen underneath.
          <View style={StyleSheet.absoluteFill}>
            {/* Restyle only once the old picture covers the screen. */}
            <Image
              testID="theme-before"
              source={{ uri: wave.before }}
              fadeDuration={0}
              onLoad={() => setSchemeState(target.current)}
              onError={finish}
              style={StyleSheet.absoluteFill}
            />
            {wave.after ? (
              <Animated.View style={[styles.circle, circle]}>
                <Animated.Image
                  testID="theme-after"
                  source={{ uri: wave.after }}
                  fadeDuration={0}
                  onLoad={startWave}
                  onError={finish}
                  style={[styles.inside, { width: size.width, height: size.height }, inside]}
                />
              </Animated.View>
            ) : null}
          </View>
        ) : null}
      </View>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  circle: { position: 'absolute', overflow: 'hidden' },
  inside: { position: 'absolute' },
});

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

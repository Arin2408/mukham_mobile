import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import '@/i18n';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ThemeProvider, useTheme } from '@/theme';
import { snapshot } from '@/theme/snapshot';

jest.mock('expo-secure-store', () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => {},
}));

// The wave runs only with motion allowed and a screenshot module in the build.
jest.mock('react-native-reanimated', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
jest.mock('@/theme/snapshot', () => ({
  snapshot: jest.fn(),
  release: jest.fn(async () => {}),
  viewTransition: () => false,
}));
const mockSnapshot = snapshot as jest.MockedFunction<typeof snapshot>;

function Probe() {
  return <Text testID="probe">{useTheme().scheme}</Text>;
}

async function setup() {
  await render(
    <ThemeProvider>
      <ThemeToggle />
      <Probe />
    </ThemeProvider>,
  );
}

const covered = () => screen.queryByTestId('theme-before') !== null;

beforeEach(() => {
  mockSnapshot.mockReset();
  mockSnapshot.mockResolvedValue('file:///shot.jpg');
});

describe('theme wave', () => {
  it('covers the app with the old picture, then restyles under it', async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText('Switch to light mode'));
    expect(covered()).toBe(true);
    expect(screen.getByTestId('probe')).toHaveTextContent('dark');

    await fireEvent(screen.getByTestId('theme-before'), 'load');
    expect(screen.getByTestId('probe')).toHaveTextContent('light');
  });

  it('drops the picture and switches when the picture fails to load', async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText('Switch to light mode'));
    await fireEvent(screen.getByTestId('theme-before'), 'error');

    expect(covered()).toBe(false);
    expect(screen.getByTestId('probe')).toHaveTextContent('light');

    // The button works again.
    await fireEvent.press(screen.getByLabelText('Switch to dark mode'));
    expect(covered()).toBe(true);
  });

  it('gives up after a while if the picture never loads', async () => {
    jest.useFakeTimers();
    try {
      await setup();
      await fireEvent.press(screen.getByLabelText('Switch to light mode'));
      expect(covered()).toBe(true);

      await act(async () => jest.advanceTimersByTime(4000));
      expect(covered()).toBe(false);
      expect(screen.getByTestId('probe')).toHaveTextContent('light');
    } finally {
      jest.useRealTimers();
    }
  });

  it('switches instantly when no picture can be taken', async () => {
    mockSnapshot.mockResolvedValue(null);
    await setup();
    await fireEvent.press(screen.getByLabelText('Switch to light mode'));
    expect(covered()).toBe(false);
    expect(screen.getByTestId('probe')).toHaveTextContent('light');
  });
});

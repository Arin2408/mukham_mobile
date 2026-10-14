import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import '@/i18n';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { makeStyles, ThemeProvider, useTheme } from '@/theme';

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => mockStore.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void mockStore.set(k, v),
}));

const useStyles = makeStyles(({ colors }) => ({ box: { backgroundColor: colors.background } }));

function Probe() {
  const { scheme, colors } = useTheme();
  const styles = useStyles();
  return <Text testID="probe">{`${scheme} ${colors.background} ${styles.box.backgroundColor}`}</Text>;
}

beforeEach(() => mockStore.clear());

describe('light and dark themes', () => {
  it('starts dark, switches to light with the toggle, and remembers it', async () => {
    await render(
      <ThemeProvider>
        <ThemeToggle />
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('dark #0A0A0A #0A0A0A');

    await fireEvent.press(screen.getByLabelText('Switch to light mode'));
    expect(screen.getByTestId('probe')).toHaveTextContent('light #F7F7F7 #F7F7F7');
    expect(screen.getByLabelText('Switch to dark mode')).toBeTruthy();
    await waitFor(() => expect(mockStore.get('mukham.theme')).toBe('light'));
  });

  it('opens in the theme chosen last time', async () => {
    mockStore.set('mukham.theme', 'light');
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('light #F7F7F7 #F7F7F7'));
  });

  it('is dark without a provider (tests, previews)', async () => {
    await render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('dark #0A0A0A #0A0A0A');
    await act(async () => {});
  });
});

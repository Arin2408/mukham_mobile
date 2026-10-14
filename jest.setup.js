// Animations run on a separate engine (Reanimated with worklets) that only
// exists on a phone; tests use their official mocks. Animations finish at once.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));

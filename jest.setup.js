// Animations run on a separate engine (Reanimated with worklets) that only
// exists on a phone; tests use their official mocks. Tests also run as if
// "reduce motion" is on, so counters and loops show their final state at once
// and timing never decides a result.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => true,
}));

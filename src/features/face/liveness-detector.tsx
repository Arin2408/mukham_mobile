import { requireOptionalNativeModule } from 'expo';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import type { LivenessCredentials } from '@/api/auth';

/**
 * AWS Face Liveness runs only inside a development or store build: Expo Go
 * and the browser don't include its native code. Screens check this first.
 */
export const livenessAvailable =
  Platform.OS !== 'web' && requireOptionalNativeModule('FaceLivenessDetector') != null;

type LivenessModule = typeof import('expo-face-liveness-for-aws-amplify');

// Loaded lazily, so Expo Go and the browser never touch the native module.
function loadModule(): LivenessModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-face-liveness-for-aws-amplify');
}

type Props = {
  sessionId: string;
  region: string;
  credentials: LivenessCredentials;
  onComplete: () => void;
  onError: (message: string) => void;
};

/** AWS's own liveness check: oval guide, face movement, live-person analysis. */
export function LivenessDetector({ sessionId, region, credentials, onComplete, onError }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mod = loadModule();
    let active = true;

    // The view reads the credentials when it appears, so set them first.
    mod
      .setAuthCredentials(credentials)
      .then(() => active && setReady(true))
      .catch(() => active && onError(''));

    return () => {
      active = false;
      mod.clearAuthCredentials().catch(() => {});
    };
  }, [credentials, onError]);

  if (!ready) {
    return <View style={styles.fill} />;
  }

  const { FaceLivenessDetectorView } = loadModule();
  return (
    <FaceLivenessDetectorView
      style={styles.fill}
      sessionId={sessionId}
      region={region}
      challengeOptions={{ faceMovement: { camera: 'front' } }}
      onAnalysisComplete={() => onComplete()}
      onError={(event) => onError(event.nativeEvent.message ?? '')}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});

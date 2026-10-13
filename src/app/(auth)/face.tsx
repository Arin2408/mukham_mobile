import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import {
  completeEmployeeSignIn,
  createLivenessSession,
  getLivenessCredentials,
  submitLivenessResult,
  type LivenessCredentials,
} from '@/api/auth';
import { ApiError, errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { Screen } from '@/components/screen';
import { CameraPermissionRequest } from '@/features/face/camera-permission';
import { LivenessDetector, livenessAvailable } from '@/features/face/liveness-detector';
import { useEmployeeSignIn, useSession } from '@/store/session';
import { colors, spacing, text } from '@/theme';

type Check = { sessionId: string; region: string; credentials: LivenessCredentials };

type Step =
  | { kind: 'starting' }
  | { kind: 'detecting'; check: Check }
  | { kind: 'checking' }
  | { kind: 'failed'; message: string }
  | { kind: 'expired' };

export default function FaceScreen() {
  const { t } = useTranslation();
  const signIn = useSession((s) => s.signIn);
  const { mobile, preAuthToken, faceRegistered, reset } = useEmployeeSignIn();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>({ kind: 'starting' });
  // Each attempt opens a new liveness session: a used one can't be replayed.
  const [attempt, setAttempt] = useState(0);

  const fail = useCallback(
    (error: unknown) => {
      // The 5-minute pre-sign-in token ran out: the password step must be redone.
      if (error instanceof ApiError && error.status === 401) {
        setStep({ kind: 'expired' });
        return;
      }
      const message = errorMessage(error, t);
      setStep({ kind: 'failed', message: message === t('errors.unknown') ? t('face.failed') : message });
    },
    [t],
  );

  useEffect(() => {
    if (!livenessAvailable || !permission?.granted || !preAuthToken) {
      return;
    }
    let active = true;
    Promise.all([createLivenessSession(preAuthToken), getLivenessCredentials(preAuthToken)])
      .then(([session, credentials]) => {
        if (active) {
          setStep({
            kind: 'detecting',
            check: { sessionId: session.session_id, region: session.region || 'ap-south-1', credentials },
          });
        }
      })
      .catch((error) => active && fail(error));
    return () => {
      active = false;
    };
  }, [permission?.granted, preAuthToken, attempt, fail]);

  function retry() {
    setStep({ kind: 'starting' });
    setAttempt((n) => n + 1);
  }

  async function finish(sessionId: string) {
    if (!preAuthToken) {
      setStep({ kind: 'expired' });
      return;
    }
    setStep({ kind: 'checking' });
    try {
      const failure = await submitLivenessResult(
        preAuthToken,
        sessionId,
        mobile,
        faceRegistered ? 'verify' : 'register',
      );
      if (failure !== null) {
        setStep({ kind: 'failed', message: failure || t('face.failed') });
        return;
      }
      const tokens = await completeEmployeeSignIn(preAuthToken, sessionId);
      // The session guard in the root layout then opens the employee tabs.
      await signIn({ access: tokens.access_token, refresh: tokens.refresh_token }, 'employee');
      reset();
    } catch (error) {
      fail(error);
    }
  }

  const onDetectorError = useCallback(() => setStep({ kind: 'failed', message: t('face.failed') }), [t]);

  function startOver() {
    reset();
    router.replace('/sign-in');
  }

  if (!livenessAvailable) {
    return (
      <Screen title={t('face.unavailableTitle')}>
        <Text style={styles.body}>{t('face.unavailableBody')}</Text>
        <Button variant="secondary" label={t('face.startOver')} onPress={startOver} />
      </Screen>
    );
  }

  if (!permission?.granted) {
    return (
      <CameraPermissionRequest
        permission={permission}
        requestPermission={requestPermission}
        onCancel={startOver}
        cancelLabel={t('face.startOver')}
      />
    );
  }

  if (step.kind === 'detecting') {
    return (
      <View style={styles.detector}>
        <LivenessDetector
          sessionId={step.check.sessionId}
          region={step.check.region}
          credentials={step.check.credentials}
          onComplete={() => finish(step.check.sessionId)}
          onError={onDetectorError}
        />
      </View>
    );
  }

  return (
    <Screen title={t('face.title')}>
      {preAuthToken && (step.kind === 'starting' || step.kind === 'checking') ? (
        <View style={styles.waiting}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={text.muted}>{t(step.kind === 'starting' ? 'face.starting' : 'face.checking')}</Text>
        </View>
      ) : null}

      {preAuthToken && step.kind === 'failed' ? (
        <>
          <ErrorBanner message={step.message} />
          <Text style={styles.body}>{t('face.hint')}</Text>
          <Button label={t('face.retry')} onPress={retry} />
          <Button variant="link" label={t('face.startOver')} onPress={startOver} />
        </>
      ) : null}

      {step.kind === 'expired' || !preAuthToken ? (
        <>
          <ErrorBanner message={t('face.expired')} />
          <Button label={t('face.startOver')} onPress={startOver} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    ...text.body,
    lineHeight: 22,
  },
  waiting: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  detector: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

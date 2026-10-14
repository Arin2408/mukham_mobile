import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getMyProfile,
  markAttendance,
  verifyCheckInFace,
  type MarkResult,
} from '@/api/attendance';
import { createLivenessSession, getLivenessCredentials, type LivenessCredentials } from '@/api/auth';
import { ApiError, errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { GlowBackground } from '@/components/ui/glow-background';
import { easeOut, FadeIn } from '@/components/ui/motion';
import { CameraPermissionRequest } from '@/features/face/camera-permission';
import { LivenessDetector, livenessAvailable } from '@/features/face/liveness-detector';
import { getPosition, PositionError, type Position } from '@/features/location/get-position';
import { getDeviceId } from '@/lib/device-id';
import { formatDistance, formatHours, formatTime } from '@/lib/format';
import { fonts, makeStyles, spacing, useTheme } from '@/theme';

type Action = 'checkin' | 'checkout';

type Failure = { title: string; body: string; settings?: boolean };

type Step =
  | { kind: 'working'; label: string }
  | { kind: 'face'; sessionId: string; region: string; credentials: LivenessCredentials; position: Position }
  | { kind: 'success'; result: MarkResult }
  | { kind: 'failure'; failure: Failure };

export default function CheckInScreen() {
  const styles = useStyles();
  const { colors, text } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ action?: string }>();
  const action: Action = params.action === 'checkout' ? 'checkout' : 'checkin';
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>({ kind: 'working', label: t('checkIn.locating') });
  const [attempt, setAttempt] = useState(0);

  /** Turns any error into the screen that explains it. */
  const failureFor = useCallback(
    (error: unknown): Failure => {
      if (error instanceof PositionError) {
        const body = {
          permission: t('checkIn.permissionBody'),
          permissionBlocked: t('checkIn.permissionBlocked'),
          servicesOff: t('checkIn.servicesOff'),
          timeout: t('checkIn.timeout'),
        }[error.problem];
        const title = error.problem.startsWith('permission') ? t('checkIn.permissionTitle') : t('checkIn.locationTitle');
        return { title, body, settings: error.problem === 'permissionBlocked' };
      }
      if (error instanceof ApiError) {
        if (error.code === 'outside_geofence') {
          const detail = (error.detail ?? {}) as { distance_meters?: number; office_location?: string };
          return {
            title: t('checkIn.outsideTitle'),
            body: t('checkIn.outsideBody', {
              distance: formatDistance(detail.distance_meters ?? 0),
              office: detail.office_location ?? '',
            }),
          };
        }
        if (error.code === 'face_verification_required') {
          return { title: t('checkIn.faceFailedTitle'), body: t('checkIn.faceFailedBody') };
        }
        if (error.code === 'no_open_attendance') {
          return { title: t('checkIn.noOpenTitle'), body: error.message };
        }
        if (error.code === 'invalid_location') {
          return { title: t('checkIn.locationTitle'), body: error.message };
        }
      }
      return { title: t('checkIn.failedTitle'), body: errorMessage(error, t) };
    },
    [t],
  );

  const finish = useCallback(
    (result: MarkResult) => {
      // Home and History show the new status at once.
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setStep({ kind: 'success', result });
    },
    [queryClient],
  );

  // Location first; then check-out is saved straight away, and check-in
  // opens the live face check. A retry runs everything again.
  useEffect(() => {
    if (action === 'checkin' && (!livenessAvailable || !permission?.granted)) {
      return;
    }
    let active = true;

    (async () => {
      const position = await getPosition();
      if (!active) return;

      if (action === 'checkout') {
        setStep({ kind: 'working', label: t('checkIn.saving') });
        const result = await markAttendance({ action, ...position, isMocked: position.mocked });
        if (active) finish(result);
        return;
      }

      setStep({ kind: 'working', label: t('checkIn.starting') });
      const [session, credentials] = await Promise.all([createLivenessSession(), getLivenessCredentials()]);
      if (active) {
        setStep({
          kind: 'face',
          sessionId: session.session_id,
          region: session.region || 'ap-south-1',
          credentials,
          position,
        });
      }
    })().catch((error) => active && setStep({ kind: 'failure', failure: failureFor(error) }));

    return () => {
      active = false;
    };
  }, [action, permission?.granted, attempt, t, finish, failureFor]);

  async function afterFace(sessionId: string, position: Position) {
    setStep({ kind: 'working', label: t('checkIn.verifying') });
    try {
      const profile = await queryClient.fetchQuery({ queryKey: ['profile'], queryFn: getMyProfile });
      const { faceToken, reason } = await verifyCheckInFace(sessionId, profile.mobile_number);
      if (!faceToken) {
        setStep({
          kind: 'failure',
          failure: { title: t('checkIn.faceFailedTitle'), body: reason || t('checkIn.faceFailedBody') },
        });
        return;
      }
      setStep({ kind: 'working', label: t('checkIn.saving') });
      const result = await markAttendance({
        action: 'checkin',
        ...position,
        faceToken,
        isMocked: position.mocked,
        deviceId: await getDeviceId(),
      });
      finish(result);
    } catch (error) {
      setStep({ kind: 'failure', failure: failureFor(error) });
    }
  }

  const onFaceError = useCallback(
    () => setStep({ kind: 'failure', failure: { title: t('checkIn.faceFailedTitle'), body: t('checkIn.faceFailedBody') } }),
    [t],
  );

  function retry() {
    setStep({ kind: 'working', label: t('checkIn.locating') });
    setAttempt((n) => n + 1);
  }

  const close = () => router.back();

  if (action === 'checkin' && !livenessAvailable) {
    return (
      <Result
        icon="alert-circle"
        tone="bad"
        title={t('face.unavailableTitle')}
        lines={[t('face.unavailableBody')]}
        primary={{ label: t('checkIn.done'), onPress: close }}
      />
    );
  }

  if (action === 'checkin' && !permission?.granted) {
    return (
      <CameraPermissionRequest
        permission={permission}
        requestPermission={requestPermission}
        onCancel={close}
        cancelLabel={t('checkIn.cancel')}
      />
    );
  }

  if (step.kind === 'face') {
    return (
      <View style={styles.fill}>
        <LivenessDetector
          sessionId={step.sessionId}
          region={step.region}
          credentials={step.credentials}
          onComplete={() => afterFace(step.sessionId, step.position)}
          onError={onFaceError}
        />
      </View>
    );
  }

  if (step.kind === 'success') {
    const r = step.result;
    const checkedOut = r.action === 'checkout';
    const lines = checkedOut
      ? [t('checkIn.hoursLine', { hours: formatHours(r.hours_worked ?? 0) })]
      : [
          r.distance_meters != null && r.location_name
            ? t('checkIn.distanceLine', { office: r.location_name, distance: formatDistance(r.distance_meters) })
            : '',
          t('checkIn.faceLine'),
        ].filter(Boolean);
    return (
      <Result
        icon="checkmark-circle"
        tone="good"
        title={
          checkedOut
            ? t('checkIn.checkedOutTitle', { time: formatTime(r.check_out ?? new Date().toISOString()) })
            : t('checkIn.checkedInTitle', { time: formatTime(r.check_in) })
        }
        lines={lines}
        primary={{ label: t('checkIn.done'), onPress: close }}
      />
    );
  }

  if (step.kind === 'failure') {
    const f = step.failure;
    return (
      <Result
        icon="alert-circle"
        tone="bad"
        title={f.title}
        lines={[f.body]}
        primary={
          f.settings
            ? { label: t('checkIn.openSettings'), onPress: () => Linking.openSettings() }
            : { label: t('checkIn.tryAgain'), onPress: retry }
        }
        secondary={{ label: t('checkIn.cancel'), onPress: close }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={text.muted}>{step.label}</Text>
      <Button variant="link" label={t('checkIn.cancel')} onPress={close} />
    </SafeAreaView>
  );
}

type ResultProps = {
  icon: 'checkmark-circle' | 'alert-circle';
  tone: 'good' | 'bad';
  title: string;
  lines: string[];
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
};

/** The full-screen result: a big icon, what happened, and what to do next. */
function Result({ icon, tone, title, lines, primary, secondary }: ResultProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = tone === 'good' ? colors.successText : colors.danger;
  return (
    <SafeAreaView style={styles.result}>
      <GlowBackground />
      <View style={styles.resultBody}>
        <View style={styles.iconWrap}>
          {tone === 'good' ? <Burst color={color} /> : null}
          <Animated.View entering={ZoomIn.springify().damping(12)}>
            <Ionicons name={icon} size={96} color={color} />
          </Animated.View>
        </View>
        <FadeIn index={2}>
          <Text style={styles.resultTitle} accessibilityRole="header">
            {title}
          </Text>
        </FadeIn>
        {lines.map((line, i) => (
          <FadeIn key={line} index={3 + i}>
            <Text style={styles.resultLine}>{line}</Text>
          </FadeIn>
        ))}
      </View>
      <FadeIn index={5} style={styles.actions}>
        <Button label={primary.label} onPress={primary.onPress} />
        {secondary ? <Button variant="link" label={secondary.label} onPress={secondary.onPress} /> : null}
      </FadeIn>
    </SafeAreaView>
  );
}

/** A ring that bursts outward once behind the success tick. */
function Burst({ color }: { color: string }) {
  const styles = useStyles();
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: 900, easing: easeOut }));
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - p.get()),
    transform: [{ scale: 0.6 + p.get() * 1.2 }],
  }));
  return <Animated.View style={[styles.burst, { borderColor: color }, style]} pointerEvents="none" />;
}

const useStyles = makeStyles(({ colors, text }) => ({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  result: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  resultBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burst: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  resultTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  resultLine: {
    ...text.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: spacing.sm,
  },
}));

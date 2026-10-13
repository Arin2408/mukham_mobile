import * as Location from 'expo-location';

export type Position = {
  latitude: number;
  longitude: number;
  accuracy: number;
  /** Android: a GPS-faking app supplied this position. */
  mocked: boolean;
};

export type PositionProblem = 'permission' | 'permissionBlocked' | 'servicesOff' | 'timeout';

export class PositionError extends Error {
  constructor(readonly problem: PositionProblem) {
    super(problem);
    this.name = 'PositionError';
  }
}

const TIMEOUT_MS = 20_000;

/**
 * Asks for location permission if needed, then gets one precise GPS fix.
 * Throws PositionError with the reason the app should explain.
 */
export async function getPosition(): Promise<Position> {
  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) {
    permission = await Location.requestForegroundPermissionsAsync();
  }
  if (!permission.granted) {
    throw new PositionError(permission.canAskAgain ? 'permission' : 'permissionBlocked');
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    throw new PositionError('servicesOff');
  }

  const fix = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new PositionError('timeout')), TIMEOUT_MS)),
  ]);

  return {
    latitude: fix.coords.latitude,
    longitude: fix.coords.longitude,
    accuracy: fix.coords.accuracy ?? 0,
    mocked: fix.mocked === true,
  };
}

import { ApiError } from '@/api/errors';

jest.mock('expo', () => ({ requireOptionalNativeModule: () => ({}) }));

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => mockStore.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void mockStore.set(k, v),
  deleteItemAsync: async (k: string) => void mockStore.delete(k),
}));

// The task Android runs on a geofence event, kept so a test can fire it.
let mockTask: ((body: { data: unknown; error: unknown }) => Promise<void>) | null = null;
jest.mock('expo-task-manager', () => ({
  isTaskDefined: () => mockTask !== null,
  defineTask: (_: string, task: typeof mockTask) => {
    mockTask = task;
  },
}));

const mockLocation = {
  GeofencingEventType: { Enter: 1, Exit: 2 },
  getBackgroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  hasStartedGeofencingAsync: jest.fn(),
  startGeofencingAsync: jest.fn(async () => {}),
  stopGeofencingAsync: jest.fn(async () => {}),
  getLastKnownPositionAsync: jest.fn(),
};
jest.mock('expo-location', () => mockLocation);

const mockNotify = jest.fn();
jest.mock('@/features/notifications/push', () => ({
  CHANNEL_ID: 'reminders',
  notifications: () => ({
    getPermissionsAsync: async () => ({ status: 'granted' }),
    scheduleNotificationAsync: (...a: unknown[]) => mockNotify(...a),
  }),
}));

const mockRegion = jest.fn();
const mockSend = jest.fn();
jest.mock('@/api/presence', () => ({
  getPresenceRegion: () => mockRegion(),
  sendPresenceEvent: (...a: unknown[]) => mockSend(...a),
}));

const OFFICE = { attendance_id: 7, latitude: 28.6139, longitude: 77.209, radius_meters: 150 };

// eslint-disable-next-line @typescript-eslint/no-require-imports
const presence = require('@/features/presence/presence') as typeof import('@/features/presence/presence');

const sentEvents = () => mockSend.mock.calls.map(([event]) => event);

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.clear();
  mockSend.mockResolvedValue({ recorded: true });
  mockRegion.mockResolvedValue(OFFICE);
  mockLocation.getBackgroundPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
  mockLocation.hasStartedGeofencingAsync.mockResolvedValue(false);
  mockLocation.getLastKnownPositionAsync.mockResolvedValue(null);
});

describe('office-area tracking', () => {
  it('watches the office after check-in, once', async () => {
    await presence.syncPresence();

    expect(mockLocation.startGeofencingAsync).toHaveBeenCalledWith('mukham.office-presence', [
      expect.objectContaining({ latitude: 28.6139, longitude: 77.209, radius: 150 }),
    ]);
    expect(sentEvents()).toEqual(['on']);

    mockLocation.hasStartedGeofencingAsync.mockResolvedValue(true);
    await presence.syncPresence();
    expect(mockLocation.startGeofencingAsync).toHaveBeenCalledTimes(1);
  });

  it('reports tracking off when "Allow all the time" is refused', async () => {
    mockLocation.getBackgroundPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    await presence.syncPresence();

    expect(mockLocation.startGeofencingAsync).not.toHaveBeenCalled();
    expect(sentEvents()).toEqual(['off']);
  });

  it('stops watching when not checked in', async () => {
    mockRegion.mockResolvedValue(null);
    mockLocation.hasStartedGeofencingAsync.mockResolvedValue(true);
    await presence.syncPresence();

    expect(mockLocation.stopGeofencingAsync).toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('sends a leave once, with a notification, and the return', async () => {
    await presence.syncPresence();
    mockSend.mockClear();

    await mockTask!({ data: { eventType: 2, region: {} }, error: null });
    await mockTask!({ data: { eventType: 2, region: {} }, error: null }); // Android repeats itself
    await mockTask!({ data: { eventType: 1, region: {} }, error: null });

    expect(sentEvents()).toEqual(['exit', 'enter']);
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify.mock.calls[0][0].content.title).toBe('You left the office area');
  });

  it('keeps a leave without signal and sends it later with its own time', async () => {
    await presence.syncPresence();
    mockSend.mockClear();
    mockSend.mockRejectedValueOnce(ApiError.network());

    await mockTask!({ data: { eventType: 2, region: {} }, error: null });
    const [, leftAt] = mockSend.mock.calls[0];

    mockSend.mockClear();
    await presence.flushPresence();
    expect(mockSend).toHaveBeenCalledWith('exit', leftAt);

    mockSend.mockClear();
    await presence.flushPresence(); // nothing left waiting
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('catches a leave missed while the app was closed', async () => {
    await presence.syncPresence();
    mockSend.mockClear();
    mockLocation.hasStartedGeofencingAsync.mockResolvedValue(true);
    // About 1.1 km north of the office, 3 minutes ago.
    const seenAt = Date.now() - 3 * 60_000;
    mockLocation.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 28.6239, longitude: 77.209 },
      timestamp: seenAt,
    });

    await presence.syncPresence();
    expect(mockSend).toHaveBeenCalledWith('exit', new Date(seenAt).toISOString());
  });
});

import { api } from './client';

/** The office area to watch while checked in. */
export type PresenceRegion = {
  attendance_id: number;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

/** exit / enter the office area; on / off: whether tracking could run. */
export type PresenceEvent = 'exit' | 'enter' | 'on' | 'off';

/** null when not checked in at an office. */
export function getPresenceRegion() {
  return api<PresenceRegion | null>('/attendance/presence');
}

export function sendPresenceEvent(event: PresenceEvent, occurredAt: string) {
  return api<{ recorded: boolean }>('/attendance/presence', {
    method: 'POST',
    body: { event, occurred_at: occurredAt },
  });
}

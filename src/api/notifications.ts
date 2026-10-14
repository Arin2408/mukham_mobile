import { api } from './client';

export type NotificationPreferences = { shift_start: boolean; check_out: boolean; new_task: boolean };

/** Tells the server this phone's push address, for the signed-in person. */
export function registerPushDevice(token: string, platform: 'android' | 'ios') {
  return api<null>('/devices', { method: 'POST', body: { token, platform } });
}

/** At sign-out: this phone gets nothing more for this person. */
export function removePushDevice(token: string) {
  return api<null>('/devices/remove', { method: 'POST', body: { token } });
}

export function getNotificationPreferences() {
  return api<NotificationPreferences>('/notifications/preferences');
}

export function setNotificationPreferences(changes: Partial<NotificationPreferences>) {
  return api<NotificationPreferences>('/notifications/preferences', { method: 'PUT', body: changes });
}

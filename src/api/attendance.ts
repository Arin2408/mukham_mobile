import { api } from './client';

export type OfficeLocation = {
  location_id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

export type EmployeeProfile = {
  user_id: number;
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string | null;
  shift_name: string | null;
  shift_start_time: string | null; // "09:00:00"
  shift_end_time: string | null;
  location_name: string | null;
  office_location: OfficeLocation | null;
  department_name: string | null;
  designation_name: string | null;
  photo: string | null;
};

export type AttendanceRecord = {
  id: number;
  check_in: string;
  check_out: string | null;
  status: string;
  hours_worked: number | null;
};

/** One attendance record as History shows it. */
export type HistoryRecord = AttendanceRecord & {
  location_status: string;
  face_status: string;
  source: string;
  check_in_distance: number | null;
};

export type MarkResult = {
  action: 'checkin' | 'checkout';
  status: string;
  check_in: string;
  check_out: string | null;
  hours_worked: number | null;
  distance_meters: number | null;
  location_name: string | null;
};

export function getMyProfile() {
  return api<EmployeeProfile>('/employee-details');
}

/** The latest attendance record (history is newest first). */
export async function getLatestAttendance(): Promise<AttendanceRecord | null> {
  const records = await api<AttendanceRecord[]>('/attendance/history?limit=1');
  return records[0] ?? null;
}

/** The employee's own records between two dates (inclusive), newest first. */
export function getAttendanceHistory(from: string, to: string) {
  const query = new URLSearchParams({ from, to, limit: '1000' });
  return api<HistoryRecord[]>(`/attendance/history?${query}`);
}

/**
 * After a live face check at check-in, the server compares the face with
 * the saved one and returns a 5-minute face token. Returns the token, or
 * null with the reason when the face didn't match.
 */
export async function verifyCheckInFace(
  sessionId: string,
  mobile: string,
): Promise<{ faceToken: string | null; reason: string }> {
  const data = await api<{ status?: string; verified?: boolean; face_token?: string; message?: string }>(
    '/face/liveness/result',
    { method: 'POST', body: { session_id: sessionId, mobile_number: mobile, mode: 'verify' } },
  );
  const passed = data.status === 'SUCCEEDED' && data.verified === true && !!data.face_token;
  return { faceToken: passed ? data.face_token! : null, reason: data.message ?? '' };
}

export type MarkInput = {
  action: 'checkin' | 'checkout';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  faceToken?: string;
  isMocked?: boolean;
  deviceId?: string | null;
};

export function markAttendance(input: MarkInput) {
  return api<MarkResult>('/attendance/mark', {
    method: 'POST',
    body: {
      action: input.action,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      face_token: input.faceToken,
      is_mocked: input.isMocked,
      device_id: input.deviceId ?? undefined,
    },
  });
}

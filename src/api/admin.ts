import type { HistoryRecord } from './attendance';
import { api } from './client';

export type DashboardSummary = {
  total_employees: number;
  active_shifts: number;
  office_locations: number;
  /** Average department punctuality, 0-100. */
  attendance_score: number;
  /** Employees per designation, most common first. */
  roles: { name: string; count: number }[];
  /** The last 7 days, oldest first, today last. */
  weekly_attendance: { date: string; present: number; percent: number }[];
  /** Most punctual department first. */
  leaderboard: { department_id: number; department_name: string; punctuality_score: number; total_attendances: number }[];
};

export type OrgEmployee = {
  employee_id: number;
  first_name: string;
  last_name: string;
  mobile_number: string;
  department_name: string | null;
  designation_name: string | null;
  shift_name: string | null;
  photo: string | null;
};

/** A record in the organisation's history, with whose it is. */
export type OrgRecord = HistoryRecord & { employee_id: number; employee_name: string | null };

export function getDashboardSummary() {
  return api<DashboardSummary>('/dashboard/summary');
}

export function getOrgEmployees() {
  return api<OrgEmployee[]>('/attendance/list');
}

/** Every employee's records between two dates, or one employee's. */
export function getOrgHistory(from: string, to: string, employeeId?: number) {
  const query = new URLSearchParams({ from, to, limit: '1000' });
  if (employeeId != null) {
    query.set('employee_id', String(employeeId));
  }
  return api<OrgRecord[]>(`/attendance/history?${query}`);
}

/** Check an employee in or out at the current time ("Added by admin"). */
export function markManually(employeeId: number, action: 'checkin' | 'checkout') {
  return api<{ action: string; status: string }>('/attendance/manual', {
    method: 'POST',
    body: { employee_id: employeeId, action },
  });
}

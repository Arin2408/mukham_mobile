import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { Alert } from 'react-native';

import '@/i18n';

import AdminAttendanceScreen from '@/app/(admin)/(tabs)/attendance/index';
import AdminDashboardScreen from '@/app/(admin)/(tabs)/dashboard';
import EmployeeAttendanceScreen from '@/app/(admin)/(tabs)/attendance/[id]';
import { ApiError } from '@/api/errors';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => ({ id: '4' }),
  Stack: { Screen: () => null },
}));

const mockSummary = jest.fn();
const mockEmployees = jest.fn();
const mockHistory = jest.fn();
const mockMark = jest.fn();
jest.mock('@/api/admin', () => ({
  getDashboardSummary: () => mockSummary(),
  getOrgEmployees: () => mockEmployees(),
  getOrgHistory: (...args: unknown[]) => mockHistory(...args),
  markManually: (...args: unknown[]) => mockMark(...args),
}));

async function show(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return await render(ui, { wrapper });
}

const today = (h: number, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const EMPLOYEES = [
  { employee_id: 2, first_name: 'Ravi', last_name: 'Sharma', mobile_number: '9000000302', department_name: 'Sales', designation_name: null, shift_name: 'Day', photo: null },
  { employee_id: 4, first_name: 'Imran', last_name: 'Khan', mobile_number: '9000000304', department_name: 'Stores', designation_name: null, shift_name: 'Day', photo: null },
  { employee_id: 5, first_name: 'Asha', last_name: 'Rao', mobile_number: '9000000305', department_name: 'Sales', designation_name: null, shift_name: 'Day', photo: null },
];

const record = (id: number, employeeId: number, checkIn: string, checkOut: string | null, extra = {}) => ({
  id,
  employee_id: employeeId,
  employee_name: null,
  check_in: checkIn,
  check_out: checkOut,
  hours_worked: checkOut ? 9 : null,
  status: 'On Time',
  source: 'mobile',
  location_status: 'inside',
  face_status: 'verified',
  check_in_distance: 5,
  ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockEmployees.mockResolvedValue(EMPLOYEES);
});

describe('admin dashboard', () => {
  it('shows the totals, the 7-day chart, the leaderboard and roles', async () => {
    mockSummary.mockResolvedValue({
      total_employees: 3,
      active_shifts: 2,
      office_locations: 1,
      attendance_score: 86,
      roles: [
        { name: 'Dev', count: 2 },
        { name: 'Unassigned', count: 1 },
      ],
      weekly_attendance: [
        { date: '2026-10-07', present: 0, percent: 0 },
        { date: '2026-10-08', present: 1, percent: 33.3 },
        { date: '2026-10-09', present: 3, percent: 100 },
        { date: '2026-10-10', present: 0, percent: 0 },
        { date: '2026-10-11', present: 0, percent: 0 },
        { date: '2026-10-12', present: 2, percent: 66.7 },
        { date: '2026-10-13', present: 2, percent: 66.7 },
      ],
      leaderboard: [{ department_id: 1, department_name: 'Sales', punctuality_score: 93.6, total_attendances: 40 }],
    });

    await show(<AdminDashboardScreen />);

    expect(await screen.findByText('86%')).toBeTruthy();
    expect(screen.getByText('Office locations')).toBeTruthy();
    expect(screen.getByText('Today 2 of 3')).toBeTruthy();
    expect(screen.getByLabelText('Tue: 67%')).toBeTruthy(); // 13 Oct 2026 is a Tuesday
    expect(screen.getByText('1. Sales')).toBeTruthy();
    expect(screen.getByText('94%')).toBeTruthy();
    expect(screen.getByText('No designation')).toBeTruthy();
  });

  const NEW_ORG = {
    total_employees: 0,
    active_shifts: 0,
    office_locations: 1,
    attendance_score: 0,
    roles: [],
    weekly_attendance: [],
    leaderboard: [],
    setup: { locations: 1, departments: 1, designations: 0, shifts: 0, employees: 0, faces: 0 },
  };

  it('shows the setup checklist, each step opening its screen', async () => {
    mockSummary.mockResolvedValue(NEW_ORG);
    await show(<AdminDashboardScreen />);

    expect(await screen.findByText('Finish setting up Mukham')).toBeTruthy();
    expect(screen.getByText('2 of 6 done')).toBeTruthy();
    fireEvent.press(screen.getByText('Add a designation'));
    expect(mockPush).toHaveBeenCalledWith('/setup/designations');
    expect(screen.getByText('Add your first employee')).toBeTruthy();
  });

  it('hides the setup checklist once every step is done', async () => {
    mockSummary.mockResolvedValue({
      ...NEW_ORG,
      setup: { locations: 1, departments: 1, designations: 1, shifts: 1, employees: 1, faces: 1 },
    });
    await show(<AdminDashboardScreen />);

    expect(await screen.findByText('Office locations')).toBeTruthy();
    expect(screen.queryByText('Finish setting up Mukham')).toBeNull();
  });

  it('says so when offline', async () => {
    mockSummary.mockRejectedValue(ApiError.network());
    await show(<AdminDashboardScreen />);
    expect(await screen.findByText("You're offline")).toBeTruthy();
  });
});

describe('admin attendance', () => {
  beforeEach(() => {
    mockHistory.mockResolvedValue([
      record(1, 2, today(9, 2), null),
      record(2, 5, today(9), today(18)),
    ]);
  });

  it("lists everyone with today's status and counts", async () => {
    await show(<AdminAttendanceScreen />);

    expect(await screen.findByText('Ravi Sharma')).toBeTruthy();
    expect(screen.getByText('In since 09:02')).toBeTruthy();
    expect(screen.getByText('Checked out at 18:00 · 9.0 h')).toBeTruthy();
    expect(screen.getByText('Not in yet')).toBeTruthy();
    expect(screen.getByText('Today: 1 in, 1 checked out, 1 not in')).toBeTruthy();
  });

  it('finds an employee by name or mobile, and opens them', async () => {
    await show(<AdminAttendanceScreen />);
    await screen.findByText('Ravi Sharma');

    await fireEvent.changeText(screen.getByLabelText('Search by name or mobile'), 'imr');
    expect(screen.getByText('Imran Khan')).toBeTruthy();
    expect(screen.queryByText('Ravi Sharma')).toBeNull();

    await fireEvent.changeText(screen.getByLabelText('Search by name or mobile'), '0305');
    expect(screen.getByText('Asha Rao')).toBeTruthy();
    expect(screen.queryByText('Imran Khan')).toBeNull();

    await fireEvent.press(screen.getByText('Asha Rao'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/attendance/[id]', params: { id: '5' } });

    await fireEvent.changeText(screen.getByLabelText('Search by name or mobile'), 'nobody');
    expect(screen.getByText('No employee matches your search.')).toBeTruthy();
  });
});

describe('one employee', () => {
  it('checks them in by hand after a confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _body, buttons) => buttons?.[1]?.onPress?.());
    mockHistory.mockResolvedValueOnce([]).mockResolvedValue([record(9, 4, today(10), null, { source: 'manual', location_status: 'manual' })]);
    mockMark.mockResolvedValue({ action: 'checkin', status: 'Late' });

    await show(<EmployeeAttendanceScreen />);

    expect(await screen.findByText('Not in yet today')).toBeTruthy();
    expect(screen.getByText('Stores · Day')).toBeTruthy();
    expect(mockHistory).toHaveBeenCalledWith(expect.any(String), expect.any(String), 4);

    await fireEvent.press(screen.getByText('Check in now'));
    expect(alert).toHaveBeenCalledWith('Check in Imran Khan?', expect.any(String), expect.any(Array));
    await waitFor(() => expect(mockMark).toHaveBeenCalledWith(4, 'checkin'));

    // The list reloads: now in, with the manual entry marked.
    expect(await screen.findByText('In since 10:00')).toBeTruthy();
    expect(screen.getByText('Added by admin')).toBeTruthy();
    expect(screen.getByText('Check out now')).toBeTruthy();
    alert.mockRestore();
  });

  it("shows the server's reason when a manual entry is refused", async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _b, buttons) => buttons?.[1]?.onPress?.());
    mockHistory.mockResolvedValue([]);
    mockMark.mockRejectedValue(new ApiError(400, 'bad_request', 'Employee has no shift assigned'));

    await show(<EmployeeAttendanceScreen />);
    await screen.findByText('Not in yet today');
    await fireEvent.press(screen.getByText('Check in now'));

    expect(await screen.findByText('Employee has no shift assigned')).toBeTruthy();
  });
});

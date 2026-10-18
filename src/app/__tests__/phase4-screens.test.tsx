import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import '@/i18n';

import HistoryScreen from '@/app/(employee)/(tabs)/history';
import TasksScreen from '@/app/(employee)/(tabs)/tasks';
import IdCardScreen from '@/app/(employee)/id-card';
import TaskDetailScreen from '@/app/(employee)/task/[id]';
import { ApiError } from '@/api/errors';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useLocalSearchParams: () => ({ id: '7' }),
  Stack: { Screen: () => null },
}));

const mockHistory = jest.fn();
const mockProfile = jest.fn();
jest.mock('@/api/attendance', () => ({
  getAttendanceHistory: (from: string, to: string) => mockHistory(from, to),
  getMyProfile: () => mockProfile(),
}));

const mockGetTasks = jest.fn();
const mockGetTeamTasks = jest.fn();
const mockGetTask = jest.fn();
const mockSetStatus = jest.fn();
jest.mock('@/api/tasks', () => ({
  getTasks: (status: string) => mockGetTasks(status),
  getTeamTasks: (status: string) => mockGetTeamTasks(status),
  getTask: (id: number) => mockGetTask(id),
  setTaskStatus: (id: number, status: string) => mockSetStatus(id, status),
}));

jest.mock('@/api/id-card', () => ({
  getIdCard: async (id: number) => ({
    employee_id: id,
    card_code: `${id}-AbC_d1`,
    first_name: 'Asha',
    last_name: 'Rao',
    designation_name: 'Engineer',
    department_name: 'Field',
    organisation_name: 'Acme',
    photo: null,
  }),
  verifyUrl: (code: string) => `https://app.mukham.test/verify/${code}`,
}));

async function show(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return await render(ui, { wrapper });
}

const TASK = {
  task_id: 7,
  employee_id: 42, // the signed-in employee (getMyProfile)
  title: 'Visit the Noida site',
  description: 'Check the new gate.',
  priority: 'high',
  status: 'pending',
  assigned_date: '2026-10-10',
  due_date: '2026-10-12',
  completed_date: null,
  is_overdue: true,
  completed_late: false,
  updated_at: '2026-10-10T05:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockProfile.mockResolvedValue({ user_id: 42, first_name: 'Asha', last_name: 'Rao', team_size: 0 });
});

describe('History', () => {
  it('lists the days with times, hours and status, and charts this week', async () => {
    const today = new Date();
    today.setHours(9, 2, 0, 0);
    const out = new Date(today);
    out.setHours(18, 0);
    mockHistory.mockResolvedValue([
      {
        id: 1,
        check_in: today.toISOString(),
        check_out: out.toISOString(),
        hours_worked: 8.97,
        status: 'Late',
        source: 'mobile',
        location_status: 'inside',
        face_status: 'verified',
        check_in_distance: 5,
      },
    ]);

    await show(<HistoryScreen />);

    expect(await screen.findByText('09:02 – 18:00')).toBeTruthy();
    expect(screen.getByText('Late')).toBeTruthy();
    expect(screen.getAllByText('9.0 h').length).toBe(2); // the row and the week total
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByText(/· 1 record$/)).toBeTruthy();
  });

  it('asks for the month when Month is chosen', async () => {
    mockHistory.mockResolvedValue([]);
    await show(<HistoryScreen />);
    expect(await screen.findByText('No check-ins in this period.')).toBeTruthy();

    await fireEvent.press(screen.getByText('Month'));

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    const from = `${firstOfMonth.getFullYear()}-${String(firstOfMonth.getMonth() + 1).padStart(2, '0')}-01`;
    await waitFor(() => expect(mockHistory).toHaveBeenCalledWith(from, expect.any(String)));
  });

  it('says so when offline, and tries again', async () => {
    mockHistory.mockRejectedValue(ApiError.network());
    await show(<HistoryScreen />);

    expect(await screen.findByText("You're offline")).toBeTruthy();
    mockHistory.mockResolvedValue([]);
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('No check-ins in this period.')).toBeTruthy();
  });
});

describe('Tasks', () => {
  it('shows pending tasks first, with due date and flags, and opens one', async () => {
    mockGetTasks.mockResolvedValue([TASK]);
    await show(<TasksScreen />);

    expect(await screen.findByText('Visit the Noida site')).toBeTruthy();
    expect(mockGetTasks).toHaveBeenCalledWith('pending');
    expect(screen.getByText('Due 12 Oct 2026')).toBeTruthy();
    expect(screen.getByText('High priority')).toBeTruthy();
    expect(screen.getByText('Overdue')).toBeTruthy();

    await fireEvent.press(screen.getByText('Visit the Noida site'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/task/[id]', params: { id: '7' } });
  });

  it('lets a manager see their team\'s tasks, assign one, and edit the ones they assigned', async () => {
    mockProfile.mockResolvedValue({ user_id: 42, first_name: 'Asha', last_name: 'Rao', team_size: 2 });
    mockGetTasks.mockResolvedValue([]);
    mockGetTeamTasks.mockResolvedValue([
      { ...TASK, task_id: 9, employee_id: 43, employee_name: 'Ravi Sharma', created_by_id: 42 },
    ]);
    await show(<TasksScreen />);
    await screen.findByText('No pending tasks.');
    expect(screen.queryByRole('button', { name: 'Assign task' })).toBeNull();

    await fireEvent.press(screen.getByText('My team'));
    expect(await screen.findByText('For Ravi Sharma')).toBeTruthy();
    expect(mockGetTeamTasks).toHaveBeenCalledWith('pending');

    await fireEvent.press(screen.getByText('Visit the Noida site'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/team-task', params: { id: '9' } });
  });

  it('shows no team switch to someone nobody reports to', async () => {
    mockGetTasks.mockResolvedValue([]);
    await show(<TasksScreen />);
    await screen.findByText('No pending tasks.');
    expect(screen.queryByText('My team')).toBeNull();
  });

  it('switches filter and explains an empty list', async () => {
    mockGetTasks.mockResolvedValue([]);
    await show(<TasksScreen />);
    await screen.findByText('No pending tasks.');

    await fireEvent.press(screen.getByText('Completed'));
    expect(await screen.findByText('No completed tasks yet.')).toBeTruthy();
    expect(mockGetTasks).toHaveBeenLastCalledWith('completed');
  });

  it('changes a task status from its detail screen', async () => {
    mockGetTask.mockResolvedValue(TASK);
    mockSetStatus.mockResolvedValue({ ...TASK, status: 'in_progress' });
    await show(<TaskDetailScreen />);

    expect(await screen.findByText('Check the new gate.')).toBeTruthy();
    expect(screen.getByText('10 Oct 2026')).toBeTruthy();

    await fireEvent.press(screen.getByText('In progress'));
    await waitFor(() => expect(mockSetStatus).toHaveBeenCalledWith(7, 'in_progress'));
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'In progress' })).toBeSelected(),
    );
  });

  it("shows a team member's task, assigned by the admin, without status buttons", async () => {
    mockGetTask.mockResolvedValue({ ...TASK, employee_id: 43, created_by_id: 1, assigned_by_name: 'Acme' });
    await show(<TaskDetailScreen />);

    expect(await screen.findByText('Assigned by Acme')).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'In progress' })).toBeNull();
    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it("shows the server's reason when a status change is refused", async () => {
    mockGetTask.mockResolvedValue(TASK);
    mockSetStatus.mockRejectedValue(new ApiError(400, 'bad_request', 'Completed date cannot be before the assigned date'));
    await show(<TaskDetailScreen />);
    await screen.findByText('Check the new gate.');

    await fireEvent.press(screen.getByText('Completed'));
    expect(await screen.findByText('Completed date cannot be before the assigned date')).toBeTruthy();
  });
});

describe('ID card', () => {
  it('shows the front, and the QR code after Flip', async () => {
    await show(<IdCardScreen />);
    expect(await screen.findByText('Asha Rao')).toBeTruthy();
    expect(screen.getByText('#42')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();

    await fireEvent.press(screen.getByText('Flip'));
    expect(screen.getByText('Scan to verify')).toBeTruthy();
    expect(screen.getByText('Acme')).toBeTruthy(); // Validated by
    expect(screen.getByLabelText('QR code: https://app.mukham.test/verify/42-AbC_d1')).toBeTruthy();
  });
});

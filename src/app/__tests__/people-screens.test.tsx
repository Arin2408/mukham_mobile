import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { Alert } from 'react-native';

import '@/i18n';

import PersonFormScreen from '@/app/(admin)/person/form';
import PersonScreen from '@/app/(admin)/person/[id]';
import TaskFormScreen from '@/app/(admin)/task-form';
import { ApiError } from '@/api/errors';
import { EmployeesView } from '@/features/people/employees-view';
import { OrgChartView } from '@/features/people/org-chart-view';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: () => null },
}));

const mockShare = jest.fn();
jest.mock('@/features/people/share-csv', () => ({ shareEmployeesCsv: (...a: unknown[]) => mockShare(...a) }));

const mock = {
  getEmployees: jest.fn(),
  getFormOptions: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
  getHierarchy: jest.fn(),
  setManager: jest.fn(),
  getTask: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  setTaskStatus: jest.fn(),
};
jest.mock('@/api/people', () => ({
  getEmployees: () => mock.getEmployees(),
  getFormOptions: () => mock.getFormOptions(),
  createEmployee: (i: unknown) => mock.createEmployee(i),
  updateEmployee: (...a: unknown[]) => mock.updateEmployee(...a),
  deleteEmployee: (id: number) => mock.deleteEmployee(id),
  getHierarchy: () => mock.getHierarchy(),
  setManager: (...a: unknown[]) => mock.setManager(...a),
}));
jest.mock('@/api/tasks', () => ({
  getTask: (id: number) => mock.getTask(id),
  createTask: (i: unknown) => mock.createTask(i),
  updateTask: (...a: unknown[]) => mock.updateTask(...a),
  deleteTask: (id: number) => mock.deleteTask(id),
  setTaskStatus: (...a: unknown[]) => mock.setTaskStatus(...a),
}));

async function show(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return await render(ui, { wrapper });
}

const person = (id: number, first: string, last: string, extra = {}) => ({
  employee_id: id,
  first_name: first,
  last_name: last,
  mobile_number: `90000000${id.toString().padStart(2, '0')}`,
  email: `${first.toLowerCase()}@example.com`,
  department_id: 1,
  department_name: 'Sales',
  designation_id: 1,
  designation_name: 'Executive',
  shift_id: null,
  shift_name: 'N/A',
  office_location_id: null,
  location_name: 'N/A',
  photo: null,
  is_member_registered: true,
  manager_id: null,
  manager_name: null,
  ...extra,
});

const PEOPLE = [
  person(2, 'Meena', 'Iyer'),
  person(4, 'Ravi', 'Sharma', { manager_id: 2, manager_name: 'Meena Iyer' }),
  person(5, 'Neha', 'Joshi', { is_member_registered: false, manager_id: 2, manager_name: 'Meena Iyer' }),
];

const OPTIONS = {
  departments: [{ id: 1, name: 'Sales' }],
  designations: [{ id: 1, name: 'Executive' }],
  shifts: [{ id: 1, name: 'Day (09:00 - 18:00)' }],
  locations: [{ id: 1, name: 'HQ' }],
};

const pressAlertButton = (label: string) =>
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.find((b) => b.text === label)?.onPress?.());

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  for (const key of Object.keys(mockParams)) delete mockParams[key];
  mock.getEmployees.mockResolvedValue(PEOPLE);
  mock.getFormOptions.mockResolvedValue(OPTIONS);
});

describe('People › Employees', () => {
  it('lists everyone, flags who has not signed in, and searches by department or name', async () => {
    await show(<EmployeesView />);
    expect(await screen.findByText('Ravi Sharma')).toBeTruthy();
    expect(screen.getByText('3 employees')).toBeTruthy();
    expect(screen.getByText('Not signed in yet')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Search name, mobile, department'), 'nEHa');
    expect(screen.getByText('Neha Joshi')).toBeTruthy();
    expect(screen.queryByText('Ravi Sharma')).toBeNull();
  });

  it('exports the list through the share menu, and opens the add form', async () => {
    mockShare.mockResolvedValue(true);
    await show(<EmployeesView />);
    await screen.findByText('Ravi Sharma');

    await fireEvent.press(screen.getByText('Export CSV'));
    await waitFor(() => expect(mockShare).toHaveBeenCalledWith(PEOPLE, 'Share the employee list'));

    await fireEvent.press(screen.getByLabelText('Add'));
    expect(mockPush).toHaveBeenCalledWith('/person/form');
  });
});

describe('adding and editing an employee', () => {
  it('checks the form, saves, and shows the first password once', async () => {
    const alert = pressAlertButton('Done');
    mock.createEmployee.mockResolvedValue({ ...person(9, 'Arjun', 'Das'), member_password: 'secret-1' });
    await show(<PersonFormScreen />);
    await screen.findByLabelText('First name');

    await fireEvent.press(screen.getByText('Save'));
    expect(screen.getByText('Enter a first name.')).toBeTruthy();
    expect(mock.createEmployee).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('First name'), 'Arjun');
    await fireEvent.changeText(screen.getByLabelText('Last name'), 'Das');
    await fireEvent.changeText(screen.getByLabelText('Mobile number'), '98765 43210');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'arjun@example.com');
    // Reports to: Meena
    await fireEvent.press(screen.getByLabelText('Reports to'));
    await fireEvent.press(screen.getByText('Meena Iyer'));
    await fireEvent.press(screen.getByText('Save'));

    await waitFor(() =>
      expect(mock.createEmployee).toHaveBeenCalledWith({
        first_name: 'Arjun',
        last_name: 'Das',
        mobile_number: '9876543210',
        email: 'arjun@example.com',
        department: null,
        designation: null,
        shift: null,
        office_location: null,
        manager: 2,
      }),
    );
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Employee added', expect.stringContaining('secret-1'), expect.any(Array)));
    expect(mockBack).toHaveBeenCalled();
  });

  it('edits an existing employee and shows server refusals', async () => {
    mockParams.id = '4';
    mock.updateEmployee.mockRejectedValue(new ApiError(409, 'conflict', 'Email already exists'));
    await show(<PersonFormScreen />);

    expect(await screen.findByDisplayValue('Ravi')).toBeTruthy();
    await fireEvent.press(screen.getByText('Save'));
    expect(await screen.findByText('Email already exists')).toBeTruthy();
    expect(mock.updateEmployee).toHaveBeenCalledWith(4, expect.objectContaining({ first_name: 'Ravi', manager: 2 }));
  });
});

describe("an employee's page", () => {
  it('shows the details and removes after confirmation', async () => {
    mockParams.id = '4';
    pressAlertButton('Remove employee');
    mock.deleteEmployee.mockResolvedValue({});
    await show(<PersonScreen />);

    expect(await screen.findByText('Meena Iyer')).toBeTruthy(); // reports to
    await fireEvent.press(screen.getByText('Show ID card'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/person/card', params: { id: '4' } });

    await fireEvent.press(screen.getByText('Remove employee'));
    await waitFor(() => expect(mock.deleteEmployee).toHaveBeenCalledWith(4));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});

describe('the org chart', () => {
  beforeEach(() => {
    mock.getHierarchy.mockResolvedValue({
      organisation_id: 1,
      organisation_name: 'Acme',
      employees: PEOPLE.map((p) => ({ ...p, direct_reports: p.employee_id === 2 ? 2 : 0 })),
    });
  });

  it('opens one level at a time and goes back up through the path', async () => {
    await show(<OrgChartView />);
    expect(await screen.findByText('1 person reports to the organisation')).toBeTruthy();
    expect(screen.queryByText('Ravi Sharma')).toBeNull();

    await fireEvent.press(screen.getByText('Meena Iyer'));
    expect(screen.getByText('Ravi Sharma')).toBeTruthy();
    expect(screen.getByText('Neha Joshi')).toBeTruthy();

    await fireEvent.press(screen.getByText('Acme'));
    expect(screen.queryByText('Ravi Sharma')).toBeNull();
  });

  it('changes a manager from the person menu', async () => {
    pressAlertButton('Change manager');
    mock.setManager.mockResolvedValue({});
    await show(<OrgChartView />);
    await fireEvent.press(await screen.findByText('Meena Iyer'));

    await fireEvent.press(screen.getByLabelText('More for Ravi Sharma'));
    expect(screen.getByText('Who does Ravi Sharma report to?')).toBeTruthy();
    // Move Ravi to report to Neha.
    await fireEvent.press(screen.getAllByText('Neha Joshi').at(-1)!);
    await waitFor(() => expect(mock.setManager).toHaveBeenCalledWith(4, 5));
  });
});

describe('the task form', () => {
  it('assigns a task to an employee on the chosen day', async () => {
    mockParams.date = '2026-10-15';
    mock.createTask.mockResolvedValue({});
    await show(<TaskFormScreen />);
    await screen.findByLabelText('Employee');

    await fireEvent.press(screen.getByText('Save'));
    expect(screen.getByText('Choose who the task is for.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Employee'));
    await fireEvent.press(screen.getByText('Ravi Sharma'));
    await fireEvent.changeText(screen.getByLabelText('Title'), '  Count the stock  ');
    await fireEvent.press(screen.getByText('High'));
    expect(screen.getByText('Thu, 15 Oct')).toBeTruthy();
    await fireEvent.press(screen.getByText('Save'));

    await waitFor(() =>
      expect(mock.createTask).toHaveBeenCalledWith({
        employee_id: 4,
        title: 'Count the stock',
        description: null,
        priority: 'high',
        assigned_date: '2026-10-15',
        due_date: null,
      }),
    );
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('edits a task, changes its status, and can delete it', async () => {
    mockParams.id = '11';
    const task = {
      task_id: 11,
      employee_id: 5,
      employee_name: 'Neha Joshi',
      title: 'Call supplier',
      description: null,
      priority: 'low',
      status: 'pending',
      assigned_date: '2026-10-10',
      due_date: null,
      completed_date: null,
      is_overdue: false,
      completed_late: false,
      updated_at: '',
    };
    mock.getTask.mockResolvedValue(task);
    mock.updateTask.mockResolvedValue(task);
    mock.setTaskStatus.mockResolvedValue({ ...task, status: 'completed' });
    await show(<TaskFormScreen />);

    expect(await screen.findByDisplayValue('Call supplier')).toBeTruthy();
    await fireEvent.press(screen.getAllByText('Completed').at(-1)!);
    await fireEvent.press(screen.getByText('Save'));
    await waitFor(() => expect(mock.updateTask).toHaveBeenCalledWith(11, expect.objectContaining({ employee_id: 5, title: 'Call supplier' })));
    await waitFor(() => expect(mock.setTaskStatus).toHaveBeenCalledWith(11, 'completed'));

    pressAlertButton('Delete task');
    mock.deleteTask.mockResolvedValue({});
    await fireEvent.press(screen.getByText('Delete task'));
    await waitFor(() => expect(mock.deleteTask).toHaveBeenCalledWith(11));
  });
});

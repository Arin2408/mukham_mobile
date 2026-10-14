import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { Alert } from 'react-native';

import '@/i18n';

import DepartmentScreen from '@/app/(admin)/setup/department';
import DesignationsScreen from '@/app/(admin)/setup/designations';
import OfficeScreen from '@/app/(admin)/setup/office';
import ShiftScreen from '@/app/(admin)/setup/shift';
import { ApiError } from '@/api/errors';

const mockBack = jest.fn();
const mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: () => null },
}));

// The map is a web view; here it just records what the screen tells it.
const mockMoveTo = jest.fn();
jest.mock('@/features/map/office-map', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { forwardRef, useImperativeHandle } = require('react');
  return {
    OfficeMap: forwardRef(function Map(_props: unknown, ref: unknown) {
      useImperativeHandle(ref, () => ({ moveTo: mockMoveTo, setRadius: jest.fn(), setSatellite: jest.fn() }));
      return null;
    }),
  };
});
jest.mock('@/features/location/get-position', () => ({
  getPosition: jest.fn(),
  PositionError: class extends Error {},
}));

const mockApi = {
  addDesignation: jest.fn(),
  getDepartments: jest.fn(),
  getDesignations: jest.fn(),
  getOffices: jest.fn(),
  getShifts: jest.fn(),
  addShift: jest.fn(),
  updateShift: jest.fn(),
  deleteShift: jest.fn(),
  assignShiftToDepartment: jest.fn(),
  deleteDepartment: jest.fn(),
  searchPlaces: jest.fn(),
  addOffice: jest.fn(),
};
jest.mock('@/api/setup', () => ({
  getDepartments: () => mockApi.getDepartments(),
  getDesignations: () => mockApi.getDesignations(),
  getOffices: () => mockApi.getOffices(),
  getShifts: () => mockApi.getShifts(),
  addShift: (i: unknown) => mockApi.addShift(i),
  updateShift: (...a: unknown[]) => mockApi.updateShift(...a),
  deleteShift: (id: number) => mockApi.deleteShift(id),
  assignShiftToDepartment: (...a: unknown[]) => mockApi.assignShiftToDepartment(...a),
  deleteDepartment: (id: number) => mockApi.deleteDepartment(id),
  searchPlaces: (q: string) => mockApi.searchPlaces(q),
  addOffice: (i: unknown) => mockApi.addOffice(i),
  addDepartment: jest.fn(),
  updateDepartment: jest.fn(),
  addDesignation: (...a: unknown[]) => mockApi.addDesignation(...a),
  updateDesignation: jest.fn(),
  deleteDesignation: jest.fn(),
  updateOffice: jest.fn(),
  deleteOffice: jest.fn(),
}));

async function show(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return await render(ui, { wrapper });
}

const NIGHT = {
  shift_id: 3,
  shift_name: 'Night',
  shift_start_time: '20:00',
  shift_end_time: '04:00',
  department_id: 2,
  is_overnight: true,
  duration_minutes: 480,
  employee_count: 6,
};

const pressAlert = (label: string) =>
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.find((b) => b.text === label)?.onPress?.());

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  for (const key of Object.keys(mockParams)) delete mockParams[key];
  mockApi.getDepartments.mockResolvedValue([
    { department_id: 1, details: 'Sales', location_id: 1 },
    { department_id: 2, details: 'Stores', location_id: 1 },
  ]);
  mockApi.getDesignations.mockResolvedValue([{ designation_id: 9, department_id: 1, details: 'Executive' }]);
  mockApi.getOffices.mockResolvedValue([
    { location_id: 1, location_name: 'HQ', latitude: '13.0', longitude: '80.2', radius_meters: 100 },
    { location_id: 2, location_name: 'Pune', latitude: '18.5', longitude: '73.8', radius_meters: 100 },
  ]);
  mockApi.getShifts.mockResolvedValue([NIGHT]);
});

describe('a shift', () => {
  it('adds a shift, and explains an overnight one', async () => {
    mockApi.addShift.mockResolvedValue({});
    await show(<ShiftScreen />);
    await fireEvent.changeText(await screen.findByLabelText('Shift name'), 'Late');
    await fireEvent.press(screen.getByLabelText('Department'));
    await fireEvent.press(screen.getByText('Stores · HQ'));

    // 09:00 - 18:00 to begin with; set the start to 22:30.
    await fireEvent.press(screen.getByLabelText('Starts'));
    await fireEvent.press(screen.getByText('22'));
    await fireEvent.press(screen.getByText('30'));
    await fireEvent.press(screen.getByText('Set time'));
    expect(screen.getByText('Overnight: ends the next day. 19 h 30 min.')).toBeTruthy();

    await fireEvent.press(screen.getByText('Save'));
    await waitFor(() =>
      expect(mockApi.addShift).toHaveBeenCalledWith({
        shift_name: 'Late',
        shift_start_time: '22:30',
        shift_end_time: '18:00',
        department: 2,
      }),
    );
  });

  it('gives a shift to the whole department, and warns before deleting', async () => {
    mockParams.id = '3';
    const alert = pressAlert('Give to all');
    mockApi.assignShiftToDepartment.mockResolvedValue({ updated_count: 6 });
    await show(<ShiftScreen />);

    expect(await screen.findByText('Overnight: ends the next day. 8 h.')).toBeTruthy();
    expect(screen.getByText('6 people have this shift and will be left without one.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Give to everyone in Stores · HQ'));
    await waitFor(() => expect(mockApi.assignShiftToDepartment).toHaveBeenCalledWith(2, 3));
    await waitFor(() => expect(alert).toHaveBeenLastCalledWith('Shift given', '6 people now have Night.'));
  });
});

describe('a department', () => {
  it("shows the server's reason when it can't be deleted", async () => {
    mockParams.id = '1';
    pressAlert('Delete');
    mockApi.deleteDepartment.mockRejectedValue(
      new ApiError(409, 'conflict', 'Sales still has 2 employees and 1 designation. Move or remove them first.'),
    );
    await show(<DepartmentScreen />);
    expect(await screen.findByText('Executive')).toBeTruthy();

    await fireEvent.press(screen.getByText('Delete department'));
    expect(await screen.findByText('Sales still has 2 employees and 1 designation. Move or remove them first.')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});

describe('an office', () => {
  it('finds an address, places the pin there, and saves with the radius', async () => {
    mockApi.searchPlaces.mockResolvedValue([{ name: 'Marina Beach, Chennai', latitude: 13.0532752, longitude: 80.2833106 }]);
    mockApi.addOffice.mockResolvedValue({});
    await show(<OfficeScreen />);

    await fireEvent.changeText(await screen.findByLabelText('Office name'), 'Beach office');
    await fireEvent.press(screen.getByText('Save office'));
    expect(screen.getByText('Place the office on the map: search, tap the map or use your location.')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Search an address'), 'Marina Beach');
    await fireEvent.press(screen.getByText('Search'));
    await fireEvent.press(await screen.findByText('Marina Beach, Chennai'));
    expect(mockMoveTo).toHaveBeenCalledWith({ latitude: 13.0532752, longitude: 80.2833106 });
    expect(mockApi.searchPlaces).toHaveBeenCalledWith('Marina Beach');

    await fireEvent.press(screen.getByLabelText('Bigger radius'));
    expect(screen.getByText('110 m')).toBeTruthy();
    await fireEvent.press(screen.getByText('Save office'));
    await waitFor(() =>
      expect(mockApi.addOffice).toHaveBeenCalledWith({
        location_name: 'Beach office',
        latitude: 13.053275,
        longitude: 80.283311,
        radius_meters: 110,
      }),
    );
  });
});

describe('designations', () => {
  it('lists them by department and office, and adds one to the chosen department', async () => {
    mockApi.getDepartments.mockResolvedValue([
      { department_id: 1, details: 'Sales', location_id: 1 },
      { department_id: 5, details: 'Sales', location_id: 2 },
    ]);
    mockApi.addDesignation.mockResolvedValue({});
    await show(<DesignationsScreen />);

    expect(await screen.findByText('Sales · HQ')).toBeTruthy();
    expect(screen.getByText('Sales · Pune')).toBeTruthy();
    expect(screen.getByText('Executive')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Designation name'), 'Manager');
    await fireEvent.press(screen.getByLabelText('Department'));
    // The picker's option comes before the list's heading of the same name.
    await fireEvent.press(screen.getAllByText('Sales · Pune')[0]);
    await fireEvent.press(screen.getByText('Add'));
    await waitFor(() => expect(mockApi.addDesignation).toHaveBeenCalledWith(5, 'Manager'));
  });
});

describe('shift labels', () => {
  it('shows the office with the department, so same-named departments differ', async () => {
    mockParams.id = '3';
    mockApi.getDepartments.mockResolvedValue([
      { department_id: 2, details: 'Stores', location_id: 1 },
      { department_id: 4, details: 'Stores', location_id: 2 },
    ]);
    await show(<ShiftScreen />);
    expect(await screen.findByText('Stores · HQ')).toBeTruthy();
  });
});

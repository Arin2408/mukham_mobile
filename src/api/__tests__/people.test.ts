import { api } from '@/api/client';
import { employeesCsv, getFormOptions, setManager, type Employee } from '@/api/people';

jest.mock('@/api/client', () => ({ api: jest.fn() }));
const apiMock = api as jest.Mock;

const EMP: Employee = {
  employee_id: 7,
  first_name: 'Ravi',
  last_name: 'Sharma, Jr',
  mobile_number: '9876543210',
  email: 'ravi@example.com',
  department_id: 1,
  department_name: 'Sales',
  designation_id: 1,
  designation_name: 'Executive "A"',
  shift_id: 1,
  shift_name: 'Day',
  office_location_id: 1,
  location_name: 'HQ',
  photo: null,
  is_member_registered: false,
  manager_id: null,
  manager_name: null,
};

describe('employee CSV', () => {
  it('has a header row, quotes commas and quotes, and a BOM for Excel', () => {
    const csv = employeesCsv([EMP]);
    expect(csv.startsWith('﻿Employee ID,First name,Last name,Mobile,Email,')).toBe(true);
    const row = csv.split('\r\n')[1];
    expect(row).toBe('7,Ravi,"Sharma, Jr",9876543210,ravi@example.com,Sales,"Executive ""A""",Day,HQ,,No');
  });

  it('never lets a cell run as a spreadsheet formula', () => {
    const csv = employeesCsv([{ ...EMP, first_name: '=HYPERLINK("http://x")', last_name: '+1', email: '@x' }]);
    const row = csv.split('\r\n')[1];
    expect(row).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(row).toContain(",'+1,");
    expect(row).toContain(",'@x,");
  });
});

describe('people server calls', () => {
  beforeEach(() => apiMock.mockReset());

  it('moves someone to the top of the org chart with a null manager', async () => {
    apiMock.mockResolvedValue({});
    await setManager(5, null);
    expect(apiMock).toHaveBeenCalledWith('/employees/5/manager', { method: 'PUT', body: { manager_id: null } });
  });

  it('names each choice with where it belongs, so same-named ones can be told apart', async () => {
    apiMock.mockImplementation(async (path: string) => {
      if (path === '/departments')
        return [
          { department_id: 1, details: 'Sales', location_id: 4 },
          { department_id: 2, details: 'Sales', location_id: 5 },
        ];
      if (path === '/designations') return [{ designation_id: 7, department_id: 2, details: 'Manager' }];
      if (path === '/shifts')
        return [
          { shift_id: 3, shift_name: 'Night', shift_start_time: '20:00', shift_end_time: '04:00', department_id: 1 },
          { shift_id: 6, shift_name: 'Night', shift_start_time: '20:00', shift_end_time: '04:00', department_id: 2 },
        ];
      return [
        { location_id: 4, location_name: 'HQ' },
        { location_id: 5, location_name: 'Pune' },
      ];
    });
    const options = await getFormOptions();
    expect(options.departments).toEqual([
      { id: 1, name: 'Sales · HQ' },
      { id: 2, name: 'Sales · Pune' },
    ]);
    expect(options.designations).toEqual([{ id: 7, name: 'Manager · Sales · Pune' }]);
    expect(options.shifts).toEqual([
      { id: 3, name: 'Night 20:00 - 04:00 · Sales · HQ' },
      { id: 6, name: 'Night 20:00 - 04:00 · Sales · Pune' },
    ]);
  });
});

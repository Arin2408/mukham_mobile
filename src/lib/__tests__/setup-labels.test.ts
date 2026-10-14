import { departmentLabel, designationLabel, shiftLabel } from '@/lib/setup-labels';

const offices = [
  { location_id: 1, location_name: 'HQ' },
  { location_id: 2, location_name: 'Pune' },
];
const departments = [
  { department_id: 10, details: 'Sales', location_id: 1 },
  { department_id: 11, details: 'Sales', location_id: 2 },
];

describe('setup labels', () => {
  it('adds the office to a department, and the department to a designation', () => {
    expect(departmentLabel(departments[1], offices)).toBe('Sales · Pune');
    expect(designationLabel({ designation_id: 1, department_id: 10, details: 'Manager' }, departments, offices)).toBe(
      'Manager · Sales · HQ',
    );
  });

  it('tells two identical shifts in different offices apart', () => {
    const night = { shift_id: 1, shift_name: 'Night', shift_start_time: '20:00:00', shift_end_time: '04:00:00' };
    expect(shiftLabel({ ...night, department_id: 10 }, departments, offices)).toBe('Night 20:00 - 04:00 · Sales · HQ');
    expect(shiftLabel({ ...night, department_id: 11 }, departments, offices)).toBe('Night 20:00 - 04:00 · Sales · Pune');
  });

  it("still names things whose department or office isn't loaded", () => {
    expect(departmentLabel({ department_id: 9, details: 'Ops', location_id: 99 }, offices)).toBe('Ops');
  });
});

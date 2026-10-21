import { departmentLabel, designationLabel, shiftLabel } from '@/lib/setup-labels';

import { api } from './client';

/** An employee as the admin sees them (GET /employees). */
export type Employee = {
  employee_id: number;
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
  department_id: number | null;
  department_name: string;
  designation_id: number | null;
  designation_name: string;
  shift_id: number | null;
  shift_name: string;
  office_location_id: number | null;
  location_name: string;
  photo: string | null;
  /** False until the employee's first sign-in (face enrolled). */
  is_member_registered: boolean;
  manager_id: number | null;
  manager_name: string | null;
  /** The phone they check in from; "pending" = a new phone awaits approval. Null while the phone lock is off. */
  phone_status?: 'none' | 'registered' | 'pending' | null;
  phone_registered_at?: string | null;
};

/** What the add and edit forms send. `manager: null` = reports to the organisation. */
export type EmployeeInput = {
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
  department: number | null;
  designation: number | null;
  shift: number | null;
  office_location: number | null;
  manager: number | null;
};

export type HierarchyPerson = {
  employee_id: number;
  first_name: string;
  last_name: string;
  designation_name: string | null;
  department_id: number | null;
  department_name: string | null;
  photo: string | null;
  manager_id: number | null;
  direct_reports: number;
};

export type Hierarchy = {
  organisation_id: number;
  organisation_name: string;
  employees: HierarchyPerson[];
};

export type Option = { id: number; name: string };

export function getEmployees() {
  return api<Employee[]>('/employees');
}

/** Adds an employee; the response carries their first password, shown once. */
export function createEmployee(input: EmployeeInput) {
  return api<Employee & { member_password: string | null }>('/employees', { method: 'POST', body: input });
}

export function updateEmployee(id: number, input: EmployeeInput) {
  return api<Employee>(`/employees/${id}`, { method: 'PUT', body: input });
}

export function deleteEmployee(id: number) {
  return api<unknown>(`/employees/${id}`, { method: 'DELETE' });
}

/** Lets the new phone that tried to check in replace the old one. */
export function approvePhone(id: number) {
  return api<Employee>(`/employees/${id}/phone/approve`, { method: 'POST' });
}

/** Forgets the phone; the next check-in from the app registers one. */
export function resetPhone(id: number) {
  return api<Employee>(`/employees/${id}/phone`, { method: 'DELETE' });
}

export function getHierarchy() {
  return api<Hierarchy>('/employee-hierarchy');
}

/** `managerId: null` = reports directly to the organisation. */
export function setManager(id: number, managerId: number | null) {
  return api<unknown>(`/employees/${id}/manager`, { method: 'PUT', body: { manager_id: managerId } });
}

/** Choices for the form's pickers, as id + name, each named with where it belongs. */
export async function getFormOptions() {
  const [departments, designations, shifts, locations] = await Promise.all([
    api<{ department_id: number; details: string; location_id: number }[]>('/departments'),
    api<{ designation_id: number; department_id: number; details: string }[]>('/designations'),
    api<
      { shift_id: number; shift_name: string; shift_start_time: string; shift_end_time: string; department_id: number }[]
    >('/shifts'),
    api<{ location_id: number; location_name: string }[]>('/locations'),
  ]);
  // Each designation and shift remembers its department, so the employee
  // form offers only those of the chosen department; each department its office.
  return {
    departments: departments.map((d) => ({ id: d.department_id, name: departmentLabel(d, locations), locationId: d.location_id })),
    designations: designations.map((d) => ({
      id: d.designation_id,
      name: designationLabel(d, departments, locations),
      departmentId: d.department_id,
    })),
    shifts: shifts.map((s) => ({ id: s.shift_id, name: shiftLabel(s, departments, locations), departmentId: s.department_id })),
    locations: locations.map((l): Option => ({ id: l.location_id, name: l.location_name })),
  };
}

export type FormOptions = Awaited<ReturnType<typeof getFormOptions>>;

const CSV_COLUMNS: [string, (e: Employee) => string][] = [
  ['Employee ID', (e) => String(e.employee_id)],
  ['First name', (e) => e.first_name],
  ['Last name', (e) => e.last_name],
  ['Mobile', (e) => e.mobile_number],
  ['Email', (e) => e.email],
  ['Department', (e) => e.department_name],
  ['Designation', (e) => e.designation_name],
  ['Shift', (e) => e.shift_name],
  ['Office', (e) => e.location_name],
  ['Reports to', (e) => e.manager_name ?? ''],
  ['Signed in', (e) => (e.is_member_registered ? 'Yes' : 'No')],
];

/** One cell: quoted when needed, and never read as a formula by Sheets or Excel. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** The employee list as CSV. Starts with a BOM so Excel reads names in any script. */
export function employeesCsv(employees: Employee[]): string {
  const lines = [CSV_COLUMNS.map(([title]) => title), ...employees.map((e) => CSV_COLUMNS.map(([, get]) => get(e)))];
  return '﻿' + lines.map((cells) => cells.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

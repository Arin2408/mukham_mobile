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

export function getHierarchy() {
  return api<Hierarchy>('/employee-hierarchy');
}

/** `managerId: null` = reports directly to the organisation. */
export function setManager(id: number, managerId: number | null) {
  return api<unknown>(`/employees/${id}/manager`, { method: 'PUT', body: { manager_id: managerId } });
}

/** Choices for the form's pickers, as id + name. */
export async function getFormOptions() {
  const [departments, designations, shifts, locations] = await Promise.all([
    api<{ department_id: number; details: string }[]>('/departments'),
    api<{ designation_id: number; details: string }[]>('/designations'),
    api<{ shift_id: number; shift_name: string; shift_start_time: string; shift_end_time: string }[]>('/shifts'),
    api<{ location_id: number; location_name: string }[]>('/locations'),
  ]);
  return {
    departments: departments.map((d): Option => ({ id: d.department_id, name: d.details })),
    designations: designations.map((d): Option => ({ id: d.designation_id, name: d.details })),
    shifts: shifts.map((s): Option => ({
      id: s.shift_id,
      name: `${s.shift_name} (${s.shift_start_time.slice(0, 5)} - ${s.shift_end_time.slice(0, 5)})`,
    })),
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

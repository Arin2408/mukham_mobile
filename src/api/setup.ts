import { api } from './client';

export type Department = { department_id: number; details: string; location_id: number };
export type Designation = { designation_id: number; department_id: number; details: string };
export type Shift = {
  shift_id: number;
  shift_name: string;
  shift_start_time: string; // "20:00"
  shift_end_time: string;
  department_id: number;
  is_overnight: boolean;
  duration_minutes: number;
  employee_count: number;
};
export type Office = {
  location_id: number;
  location_name: string;
  latitude: string | number;
  longitude: string | number;
  radius_meters: number;
};
export type OrgProfile = { name: string; email: string; details: string | null; mobile_number: string | null };
export type Place = { name: string; latitude: number; longitude: number };

// ---- departments and designations ----
export const getDepartments = () => api<Department[]>('/departments');
export const addDepartment = (details: string, location: number) =>
  api<Department>('/departments/add', { method: 'POST', body: { details, location } });
export const updateDepartment = (id: number, details: string, location: number) =>
  api<Department>(`/departments/update/${id}`, { method: 'PUT', body: { details, location } });
export const deleteDepartment = (id: number) => api<null>(`/departments/delete/${id}`, { method: 'DELETE' });

export const getDesignations = () => api<Designation[]>('/designations');
export const addDesignation = (department: number, details: string) =>
  api<Designation>('/designations/add', { method: 'POST', body: { department, details } });
export const updateDesignation = (id: number, details: string) =>
  api<Designation>(`/designations/update/${id}`, { method: 'PUT', body: { details } });
export const deleteDesignation = (id: number) => api<null>(`/designations/delete/${id}`, { method: 'DELETE' });

// ---- shifts ----
export type ShiftInput = { shift_name: string; shift_start_time: string; shift_end_time: string; department: number };
export const getShifts = () => api<Shift[]>('/shifts');
export const addShift = (input: ShiftInput) => api<Shift>('/add-shift', { method: 'POST', body: input });
export const updateShift = (id: number, input: ShiftInput) =>
  api<Shift>(`/shifts/update/${id}`, { method: 'PUT', body: input });
/** Employees on the shift are left with no shift; the answer says how many. */
export const deleteShift = (id: number) =>
  api<{ message: string; unassigned_employees: number }>(`/shifts/delete/${id}`, { method: 'DELETE' });
/** Gives the shift to everyone in its department. */
export const assignShiftToDepartment = (departmentId: number, shiftId: number) =>
  api<{ message: string; updated_count: number }>('/bulk-assign', {
    method: 'POST',
    body: { department_id: departmentId, shift_id: shiftId },
  });

// ---- offices ----
export type OfficeInput = { location_name: string; latitude: number; longitude: number; radius_meters: number };
export const getOffices = () => api<Office[]>('/locations');
export const addOffice = (input: OfficeInput) => api<Office>('/locations', { method: 'POST', body: input });
export const updateOffice = (id: number, input: OfficeInput) =>
  api<Office>(`/locations/${id}`, { method: 'PUT', body: input });
export const deleteOffice = (id: number) => api<null>(`/locations/${id}`, { method: 'DELETE' });
/** Address search through our backend (which follows OpenStreetMap's rules). */
export const searchPlaces = (q: string) => api<Place[]>(`/geocode/search?${new URLSearchParams({ q })}`);

// ---- organisation profile ----
async function orgId(): Promise<number> {
  const me = await api<{ org_id: number }>('/auth/verify');
  return me.org_id;
}
export async function getOrgProfile() {
  const id = await orgId();
  return { id, ...(await api<OrgProfile>(`/organisations/${id}`)) };
}
export const updateOrgProfile = (id: number, input: { name: string; email: string; details: string | null }) =>
  api<OrgProfile>(`/profile/${id}`, { method: 'PUT', body: input });

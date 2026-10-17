import { api } from './client';
import { WEB_BASE_URL } from './config';

/** What the ID card shows; the same public data its QR code's web page shows. */
export type IdCard = {
  employee_id: number;
  first_name: string;
  last_name: string;
  designation_name: string | null;
  department_name: string | null;
  organisation_name: string | null;
  photo: string | null;
  /** Private code for the QR link; the server signs it so ids can't be guessed. */
  card_code: string;
};

/** The admin's employee, or the signed-in employee's own card. */
export function getIdCard(employeeId: number) {
  return api<IdCard>(`/employees/${employeeId}/card`);
}

/** The web page the QR code opens: "Verified" with the card's details. */
export function verifyUrl(cardCode: string): string {
  return `${WEB_BASE_URL}/verify/${encodeURIComponent(cardCode)}`;
}

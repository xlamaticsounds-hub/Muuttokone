// Partiosivun client-komponenteille välitettävät rakenteet (päivämäärät ISO-merkkijonoina). Ei hintoja.

export type CrewWorker = { id: string; name: string; active: boolean };

export type CrewEntryDto = {
  id: string;
  leadId: string | null;
  jobLabel: string;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  breakMinutes: number;
  crewSize: number;
  workerIds: string[];
  notes: string | null;
  /** Partionjohtaja saa korjata (CREW_EDIT_DAYS) */
  editable: boolean;
};

export type CrewStartOption = { id: string; label: string; today: boolean };

export type CrewBoxTask = {
  id: string;
  leadId: string;
  kind: 'delivery' | 'pickup';
  dateKey: string;
  overdue: boolean;
  customer: string;
  phone: string | null;
  address: string | null;
  quantity: number;
  status: 'RESERVED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
  notes: string | null;
};

export type WorkerHoursDto = { workerId: string; name: string; minutes: number; entries: number };

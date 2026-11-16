export type Role = "employee" | "supervisor";

export type PositionId = "operator" | "process-technician" | "shift-supervisor";

export type ShiftId = "1st" | "2nd";

export type PressSize = "small" | "large";

export type MachineScope = "all" | "small" | "large";

export type SlotStatus = "not_started" | "in_training" | "pending" | "signed_off";

export type AuditAction = "started" | "requested" | "signed_off" | "returned";

export type NoticeKind = "request" | "approved" | "returned";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  role: Role;
  position: PositionId | null;
  title: string;
  email: string;
  shift: ShiftId;
  hired: string;
  supervisorId: string | null;
}

export interface Press {
  id: string;
  name: string;
  size: PressSize;
  detail?: string;
}

export interface TrainingItem {
  id: string;
  position: PositionId;
  name: string;
  summary: string;
  machine: MachineScope | null;
  prerequisite?: boolean;
}

export interface AuditEvent {
  id: string;
  at: string;
  actorId: string;
  action: AuditAction;
  note?: string;
}

export interface Slot {
  status: SlotStatus;
  employeeNote?: string;
  supervisorComment?: string;
  requestedAt?: string;
  signedOffAt?: string;
  signedOffBy?: string;
  startedAt?: string;
  history: AuditEvent[];
}

export interface Notice {
  id: string;
  kind: NoticeKind;
  toId: string;
  fromId: string;
  employeeId: string;
  itemId: string;
  pressId: string | null;
  subject: string;
  preview: string;
  note?: string;
  createdAt: string;
  read: boolean;
  resolved?: "approved" | "returned";
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface PlanMeta {
  risks: "yes" | "no";
  riskNote: string;
  actions: string;
}

export interface DemoState {
  slots: Record<string, Slot>;
  notices: Notice[];
  plan: PlanMeta;
}

export interface Session {
  userId: string;
}

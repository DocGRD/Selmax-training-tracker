import { ITEMS, planPositions, pressIdsFor, slotKey } from "./catalog";
import type { Person, PositionId, Slot, SlotStatus } from "./types";

export interface Tally {
  total: number;
  signed: number;
  training: number;
  pending: number;
  returned: number;
  notStarted: number;
  pct: number;
}

export function isReturned(slot: Slot | undefined) {
  if (!slot || slot.status !== "in_training") return false;
  return slot.history[slot.history.length - 1]?.action === "returned";
}

export function emptySlot(): Slot {
  return { status: "not_started", history: [] };
}

export function readSlot(
  slots: Record<string, Slot>,
  employeeId: string,
  itemId: string,
  pressId: string | null,
): Slot {
  return slots[slotKey(employeeId, itemId, pressId)] ?? emptySlot();
}

export function tally(
  person: Person,
  slots: Record<string, Slot>,
  position?: PositionId,
): Tally {
  const positions = position ? [position] : person.position ? planPositions(person.position) : [];
  const items = ITEMS.filter((item) => positions.includes(item.position));
  const counts = { signed: 0, training: 0, pending: 0, returned: 0, notStarted: 0 };
  for (const item of items) {
    for (const pressId of pressIdsFor(item)) {
      const slot = slots[slotKey(person.id, item.id, pressId)];
      if (!slot || slot.status === "not_started") counts.notStarted += 1;
      else if (slot.status === "signed_off") counts.signed += 1;
      else if (slot.status === "pending") counts.pending += 1;
      else if (isReturned(slot)) counts.returned += 1;
      else counts.training += 1;
    }
  }
  const total = counts.signed + counts.training + counts.pending + counts.returned + counts.notStarted;
  const pct = total === 0 ? 0 : Math.round((counts.signed / total) * 100);
  return { total, pct, ...counts };
}

export interface Rollup {
  inPlan: boolean;
  total: number;
  signed: number;
  pending: number;
  training: number;
  returned: number;
  notStarted: number;
  single: SlotStatus | "returned";
}

export function rollupItem(
  person: Person,
  itemId: string,
  slots: Record<string, Slot>,
): Rollup {
  const item = ITEMS.find((entry) => entry.id === itemId)!;
  const inPlan = Boolean(person.position && planPositions(person.position).includes(item.position));
  const counts = { signed: 0, pending: 0, training: 0, returned: 0, notStarted: 0 };
  let single: SlotStatus | "returned" = "not_started";
  const presses = pressIdsFor(item);
  for (const pressId of presses) {
    const slot = inPlan ? slots[slotKey(person.id, item.id, pressId)] : undefined;
    if (!slot || slot.status === "not_started") counts.notStarted += 1;
    else if (slot.status === "signed_off") counts.signed += 1;
    else if (slot.status === "pending") counts.pending += 1;
    else if (isReturned(slot)) counts.returned += 1;
    else counts.training += 1;
    if (presses.length === 1) {
      single = !slot ? "not_started" : isReturned(slot) ? "returned" : slot.status;
    }
  }
  return { inPlan, total: presses.length, single, ...counts };
}

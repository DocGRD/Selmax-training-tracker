import {
  getItem,
  getPerson,
  ITEMS,
  LARGE_PRESS_IDS,
  pressIdsFor,
  slotKey,
  SMALL_PRESS_IDS,
} from "./catalog";
import type { AuditEvent, DemoState, Notice, Slot } from "./types";

type CellSpec =
  | { kind: "not_started" }
  | { kind: "signed"; on: string; note?: string }
  | { kind: "training"; on: string }
  | { kind: "pending"; on: string; note: string }
  | { kind: "returned"; on: string; note: string; comment: string };

interface PersonSeed {
  id: string;
  complete?: { position: "operator" | "process-technician" | "shift-supervisor"; from: string; to: string }[];
  completeItems?: { ids: string[]; from: string; to: string };
  cells?: Record<string, CellSpec>;
}

const NOTES = [
  "Ran it on shift without a coach.",
  "Matched the item sheet on the last job.",
  "Trainer watched a full cycle.",
  "Did the startup and the shutdown.",
  "Checklist is in the shift folder.",
];

function noteFor(key: string) {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return NOTES[hash % NOTES.length];
}

function day(isoDate: string, delta: number) {
  const date = new Date(`${isoDate}T15:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString();
}

function spread(start: string, end: string, index: number, total: number) {
  const a = new Date(`${start}T15:00:00Z`).getTime();
  const b = new Date(`${end}T15:00:00Z`).getTime();
  const t = a + ((b - a) * (index + 1)) / (total + 1);
  return new Date(t).toISOString().slice(0, 10);
}

let eventCounter = 0;
function event(partial: Omit<AuditEvent, "id">): AuditEvent {
  eventCounter += 1;
  return { id: `evt-${eventCounter}`, ...partial };
}

function buildSlot(employeeId: string, signerId: string, spec: CellSpec, key: string): Slot | null {
  if (spec.kind === "not_started") return null;
  if (spec.kind === "training") {
    const startedAt = day(spec.on, 0);
    return {
      status: "in_training",
      startedAt,
      history: [event({ at: startedAt, actorId: employeeId, action: "started" })],
    };
  }
  if (spec.kind === "pending") {
    const startedAt = day(spec.on, -12);
    const requestedAt = day(spec.on, 0);
    return {
      status: "pending",
      startedAt,
      requestedAt,
      employeeNote: spec.note,
      history: [
        event({ at: startedAt, actorId: employeeId, action: "started" }),
        event({ at: requestedAt, actorId: employeeId, action: "requested", note: spec.note }),
      ],
    };
  }
  if (spec.kind === "returned") {
    const startedAt = day(spec.on, -16);
    const requestedAt = day(spec.on, -3);
    const returnedAt = day(spec.on, 0);
    return {
      status: "in_training",
      startedAt,
      requestedAt,
      employeeNote: spec.note,
      supervisorComment: spec.comment,
      history: [
        event({ at: startedAt, actorId: employeeId, action: "started" }),
        event({ at: requestedAt, actorId: employeeId, action: "requested", note: spec.note }),
        event({ at: returnedAt, actorId: signerId, action: "returned", note: spec.comment }),
      ],
    };
  }
  const note = spec.note ?? noteFor(key);
  const startedAt = day(spec.on, -18);
  const requestedAt = day(spec.on, -2);
  const signedOffAt = day(spec.on, 0);
  return {
    status: "signed_off",
    startedAt,
    requestedAt,
    signedOffAt,
    signedOffBy: signerId,
    employeeNote: note,
    history: [
      event({ at: startedAt, actorId: employeeId, action: "started" }),
      event({ at: requestedAt, actorId: employeeId, action: "requested", note }),
      event({ at: signedOffAt, actorId: signerId, action: "signed_off" }),
    ],
  };
}

function signedPresses(itemId: string, pressIds: string[], start: string, step = 12): Record<string, CellSpec> {
  const cells: Record<string, CellSpec> = {};
  pressIds.forEach((pressId, index) => {
    const date = new Date(`${start}T15:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index * step);
    cells[`${itemId}@${pressId}`] = { kind: "signed", on: date.toISOString().slice(0, 10) };
  });
  return cells;
}

function trainingPresses(itemId: string, pressIds: string[], on: string): Record<string, CellSpec> {
  return Object.fromEntries(pressIds.map((pressId) => [`${itemId}@${pressId}`, { kind: "training", on }]));
}

const SEEDS: PersonSeed[] = [
  {
    id: "riley",
    cells: {
      housekeeping: {
        kind: "signed",
        on: "2026-09-02",
        note: "End-of-shift sweep and the press-side wipe-down, a full week without a reminder.",
      },
      "waste-recycling": {
        kind: "signed",
        on: "2026-09-08",
        note: "Sorted runners and rejects into the right gaylords.",
      },
      "raw-basic": {
        kind: "signed",
        on: "2026-09-22",
        note: "Staged material at the 140s and checked the dryer before the shift.",
      },
      "part-trimming": {
        kind: "signed",
        on: "2026-10-06",
        note: "Trimmed the gate to the item sheet on the housing job.",
      },
      "part-assembly": { kind: "training", on: "2026-10-20" },
      "item-sheets": { kind: "training", on: "2026-10-28" },
      "basic-machine@45": { kind: "training", on: "2026-11-03" },
      "basic-machine@140S": { kind: "training", on: "2026-11-10" },
    },
  },
  {
    id: "avery",
    completeItems: {
      ids: [
        "multi-machine",
        "part-trimming",
        "part-assembly",
        "part-inspection",
        "part-packaging",
        "item-sheets",
        "qc-sheets",
        "operator-form",
        "chameleon-form",
        "housekeeping",
        "waste-recycling",
        "raw-basic",
        "slow-down",
      ],
      from: "2026-02-02",
      to: "2026-08-20",
    },
    cells: {
      ...signedPresses("basic-machine", ["45", "140S", "140T", "140K", "250", "360", "390-11"], "2026-03-02"),
      "basic-machine@390-14": { kind: "training", on: "2026-10-22" },
      "basic-machine@450": {
        kind: "pending",
        on: "2026-11-14",
        note: "Ran a full shift on the 450 yesterday. Startup, purge, and a steady run on the 8-cavity tool. Ready for sign-off.",
      },
      ...signedPresses("chameleon-small", ["45", "140S", "140T"], "2026-05-04"),
      "chameleon-small@140K": { kind: "training", on: "2026-10-28" },
      "chameleon-large@360": { kind: "training", on: "2026-11-02" },
      ...signedPresses("purging", SMALL_PRESS_IDS, "2026-04-06"),
      "purging@360": { kind: "training", on: "2026-10-30" },
      ...signedPresses("color-maguire", SMALL_PRESS_IDS, "2026-06-08"),
      ...signedPresses("color-hand", ["45", "140S"], "2026-07-01"),
      spectro: { kind: "training", on: "2026-10-15" },
    },
  },
  {
    id: "jordan",
    complete: [{ position: "operator", from: "2025-03-20", to: "2026-09-15" }],
    cells: {
      "color-maguire@360": {
        kind: "pending",
        on: "2026-11-15",
        note: "White to Selmax blue on the 360. Spectrophotometer held under 0.8 ΔE on three plaques.",
      },
      "color-maguire@390-11": { kind: "training", on: "2026-11-01" },
      "color-maguire@390-14": { kind: "not_started" },
      "color-maguire@450": { kind: "not_started" },
      "color-hand@390-14": {
        kind: "returned",
        on: "2026-11-11",
        note: "Hand-mixed the blue concentrate for the 390-14 housing.",
        comment:
          "Second plaque read 1.8 ΔE. Stay with the lot card, rerun the hand mix, and call me when the spectrophotometer is inside 1.0.",
      },
      "color-hand@450": { kind: "training", on: "2026-11-05" },
      "shift-inspector": { kind: "training", on: "2026-10-20" },
    },
  },
  {
    id: "samira",
    complete: [{ position: "operator", from: "2024-07-15", to: "2025-01-20" }],
    cells: {
      "pt-operator-training": {
        kind: "signed",
        on: "2025-02-11",
        note: "Trained a new operator on the 140T through trimming, inspection, and the operator form.",
      },
      ...signedPresses("mold-no-return", [...SMALL_PRESS_IDS, "360", "390-11"], "2025-04-02", 20),
      "mold-no-return@390-14": { kind: "training", on: "2026-10-08" },
      "mold-positive@45": { kind: "training", on: "2026-10-27" },
      "mold-positive@140S": { kind: "training", on: "2026-11-03" },
      "raw-advanced": {
        kind: "signed",
        on: "2025-11-04",
        note: "Set dryer times and a regrind ratio on a nylon job without a reminder.",
      },
      forklift: {
        kind: "pending",
        on: "2026-11-13",
        note: "Yard practice is done. I stacked the cage row and backed the trailer without a spotter correction. Ready for sign-off.",
      },
      ...trainingPresses("mold-trouble", SMALL_PRESS_IDS, "2026-09-15"),
      "press-trouble@140T": { kind: "training", on: "2026-10-06" },
    },
  },
  {
    id: "casey",
    complete: [
      { position: "operator", from: "2023-10-02", to: "2024-06-28" },
      { position: "process-technician", from: "2024-07-15", to: "2026-08-20" },
    ],
    cells: {
      "mold-positive@450": { kind: "training", on: "2026-10-16" },
      ...trainingPresses("mold-trouble", LARGE_PRESS_IDS, "2026-09-22"),
      "press-trouble@390-11": {
        kind: "pending",
        on: "2026-11-12",
        note: "Short shot on the 390-11 traced to a cold slug in the nozzle. Cleared it, confirmed cushion, and held the shot weight. Want sign-off on this press.",
      },
      "press-trouble@390-14": { kind: "training", on: "2026-10-21" },
      "press-trouble@450": { kind: "training", on: "2026-11-04" },
      ...trainingPresses("aux-trouble", LARGE_PRESS_IDS, "2026-09-29"),
    },
  },
  {
    id: "quinn",
    complete: [
      { position: "operator", from: "2022-03-01", to: "2023-11-15" },
      { position: "process-technician", from: "2023-12-01", to: "2025-05-20" },
    ],
    cells: {
      "ss-operator-training": {
        kind: "signed",
        on: "2025-06-02",
        note: "Ran operator training for the 1st shift through the summer hires.",
      },
      "ss-tech-training": {
        kind: "signed",
        on: "2026-01-15",
        note: "Coached a technician through mold changes on the small presses.",
      },
      "facility-startup": {
        kind: "pending",
        on: "2026-11-15",
        note: "Opened the plant three mornings this week. Compressors, chillers, dryers, and the press lineup were up before the crew clocked in.",
      },
      "facility-shutdown": { kind: "training", on: "2026-10-20" },
      "assignment-planning": {
        kind: "signed",
        on: "2026-04-09",
        note: "Built the lineup and moved two operators mid-shift when a mold change ran long.",
      },
      "ss-documents": { kind: "training", on: "2026-10-06" },
      "mold-qual": { kind: "training", on: "2026-09-01" },
      "process-tuning": {
        kind: "signed",
        on: "2026-07-22",
        note: "Tuned the 360 housing job down on cycle without giving up the dimension.",
      },
    },
  },
];

function subjectFor(itemName: string, pressId: string | null, kind: Notice["kind"]) {
  const where = pressId ? ` · Press ${pressId}` : "";
  if (kind === "request") return `Sign-off requested — ${itemName}${where}`;
  if (kind === "approved") return `Signed off — ${itemName}${where}`;
  return `Sent back — ${itemName}${where}`;
}

function applyCells(state: DemoState, employeeId: string, cells: Record<string, CellSpec>) {
  const person = getPerson(employeeId);
  if (!person?.supervisorId) return;
  for (const [rawKey, spec] of Object.entries(cells)) {
    const [itemId, pressId] = rawKey.split("@");
    const item = getItem(itemId);
    if (!item) throw new Error(`Unknown training item: ${itemId}`);
    const allowed = pressIdsFor(item);
    const normalizedPress = pressId ?? null;
    if (item.machine && !allowed.includes(normalizedPress)) {
      throw new Error(`Press ${pressId} is not valid for ${itemId}`);
    }
    if (!item.machine && pressId) throw new Error(`${itemId} is not signed off per press`);
    const key = slotKey(employeeId, itemId, item.machine ? normalizedPress : null);
    const slot = buildSlot(employeeId, person.supervisorId, spec, key);
    if (!slot) delete state.slots[key];
    else state.slots[key] = slot;
  }
}

function applyRange(
  state: DemoState,
  employeeId: string,
  signerId: string,
  itemIds: string[],
  from: string,
  to: string,
) {
  const atoms: { itemId: string; pressId: string | null }[] = [];
  for (const itemId of itemIds) {
    const item = getItem(itemId);
    if (!item) throw new Error(`Unknown training item: ${itemId}`);
    for (const pressId of pressIdsFor(item)) atoms.push({ itemId, pressId });
  }
  atoms.forEach((atom, index) => {
    const key = slotKey(employeeId, atom.itemId, atom.pressId);
    if (state.slots[key]) return;
    const on = spread(from, to, index, atoms.length);
    const slot = buildSlot(employeeId, signerId, { kind: "signed", on }, key);
    if (slot) state.slots[key] = slot;
  });
}

export function seedState(): DemoState {
  eventCounter = 0;
  const state: DemoState = {
    slots: {},
    notices: [],
    plan: {
      risks: "no",
      riskNote: "",
      actions:
        "Sign Avery Brooks off on the 450 before large-press overtime in December. Get Samira Nguyen’s forklift sign-off done this week so mold changes on the 390s are not waiting on a driver. Jordan Patel still owes a clean hand-mix on the 390-14 after the color came back high.",
    },
  };

  for (const seed of SEEDS) {
    const person = getPerson(seed.id);
    if (!person?.supervisorId) throw new Error(`Missing supervisor for ${seed.id}`);
    for (const block of seed.complete ?? []) {
      const itemIds = ITEMS.filter((item) => item.position === block.position).map((item) => item.id);
      applyRange(state, seed.id, person.supervisorId, itemIds, block.from, block.to);
    }
    if (seed.completeItems) {
      applyRange(state, seed.id, person.supervisorId, seed.completeItems.ids, seed.completeItems.from, seed.completeItems.to);
    }
    if (seed.cells) applyCells(state, seed.id, seed.cells);
  }

  for (const [key, slot] of Object.entries(state.slots)) {
    const [employeeId, itemId, pressIdRaw] = key.split("|");
    const pressId = pressIdRaw || null;
    const person = getPerson(employeeId);
    const item = getItem(itemId);
    if (!person?.supervisorId || !item) continue;
    const last = slot.history[slot.history.length - 1];
    if (slot.status === "pending") {
      state.notices.push({
        id: `ntc:${key}:request`,
        kind: "request",
        toId: person.supervisorId,
        fromId: employeeId,
        employeeId,
        itemId,
        pressId,
        subject: subjectFor(item.name, pressId, "request"),
        preview: slot.employeeNote ?? `${person.name} says this is ready for sign-off.`,
        note: slot.employeeNote,
        createdAt: slot.requestedAt ?? last.at,
        read: false,
      });
    }
    if (last?.action === "returned") {
      state.notices.push({
        id: `ntc:${key}:request`,
        kind: "request",
        toId: person.supervisorId,
        fromId: employeeId,
        employeeId,
        itemId,
        pressId,
        subject: subjectFor(item.name, pressId, "request"),
        preview: slot.employeeNote ?? "",
        note: slot.employeeNote,
        createdAt: slot.requestedAt ?? last.at,
        read: true,
        resolved: "returned",
        resolvedAt: last.at,
        resolvedBy: person.supervisorId,
        resolutionNote: slot.supervisorComment,
      });
      state.notices.push({
        id: `ntc:${key}:returned`,
        kind: "returned",
        toId: employeeId,
        fromId: person.supervisorId,
        employeeId,
        itemId,
        pressId,
        subject: subjectFor(item.name, pressId, "returned"),
        preview: slot.supervisorComment ?? "Sent back.",
        note: slot.supervisorComment,
        createdAt: last.at,
        read: false,
      });
    }
  }

  state.notices.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return state;
}

import type { Person, PositionId, Press, TrainingItem } from "./types";

export const REVISION = "12";

export const PLANT = {
  name: "Selmax Corporation",
  street: "599 South High Street",
  city: "Selinsgrove, PA 17870",
  phone: "570-374-2833",
  iso: "ISO 9001:2015",
  belief: "People · Process · Product",
  since: "1971",
};

export const POSITIONS: { id: PositionId; label: string; short: string; department: string }[] = [
  { id: "operator", label: "Operator", short: "OP", department: "Production" },
  {
    id: "process-technician",
    label: "Process Technician",
    short: "PT",
    department: "Process Technician",
  },
  {
    id: "shift-supervisor",
    label: "Shift Supervisor",
    short: "SS",
    department: "Shift Supervisor",
  },
];

export const PRESSES: Press[] = [
  { id: "45", name: "45", size: "small" },
  { id: "140S", name: "140S", size: "small" },
  { id: "140T", name: "140T", size: "small" },
  { id: "140K", name: "140K", size: "small" },
  { id: "250", name: "250", size: "small" },
  { id: "360", name: "360", size: "large" },
  { id: "390-11", name: "390-11", size: "large", detail: "Toshiba EC390SX · 2011" },
  { id: "390-14", name: "390-14", size: "large", detail: "Toshiba EC390SX · 2014" },
  { id: "450", name: "450", size: "large", detail: "Kawaguchi KM450" },
];

export const SMALL_PRESS_IDS = PRESSES.filter((press) => press.size === "small").map((press) => press.id);
export const LARGE_PRESS_IDS = PRESSES.filter((press) => press.size === "large").map((press) => press.id);

const operator = "operator" as const;
const tech = "process-technician" as const;
const lead = "shift-supervisor" as const;

export const ITEMS: TrainingItem[] = [
  {
    id: "basic-machine",
    position: operator,
    name: "Basic Machine Operation for Production",
    summary: "Run this press in production: startup, a steady cycle, and parts that match the item sheet.",
    machine: "all",
  },
  {
    id: "multi-machine",
    position: operator,
    name: "Multi-Machine Operation for Production",
    summary: "Keep more than one press in the assigned group running to the standard through a shift.",
    machine: null,
  },
  {
    id: "part-trimming",
    position: operator,
    name: "Part Trimming",
    summary: "Trim gates and flash to the item sheet without nicking the part.",
    machine: null,
  },
  {
    id: "part-assembly",
    position: operator,
    name: "Part Assembly",
    summary: "Assemble the part the way the item sheet shows, including the checks at the bench.",
    machine: null,
  },
  {
    id: "part-inspection",
    position: operator,
    name: "Part Inspection",
    summary: "Inspect to the item sheet and pull anything that does not meet it.",
    machine: null,
  },
  {
    id: "part-packaging",
    position: operator,
    name: "Part Packaging",
    summary: "Pack, label, and count the way the job calls for, with the right carton and liner.",
    machine: null,
  },
  {
    id: "item-sheets",
    position: operator,
    name: "Understand Item Sheets",
    summary: "Read an item sheet and run the job from it, including critical dimensions and pack-out.",
    machine: null,
  },
  {
    id: "qc-sheets",
    position: operator,
    name: "Understand QC Sheets",
    summary: "Use the QC sheet: what to check, how often, and where the record goes.",
    machine: null,
  },
  {
    id: "operator-form",
    position: operator,
    name: "Operator Form",
    summary: "Fill out the operator form completely during the shift.",
    machine: null,
  },
  {
    id: "chameleon-small",
    position: operator,
    name: "Chameleon Processing (small machines)",
    summary: "Set up and run Chameleon processing on a small press, and record it on the Chameleon form.",
    machine: "small",
  },
  {
    id: "chameleon-large",
    position: operator,
    name: "Chameleon Processing (large machines)",
    summary: "Set up and run Chameleon processing on a large press, and record it on the Chameleon form.",
    machine: "large",
  },
  {
    id: "chameleon-form",
    position: operator,
    name: "Chameleon Form",
    summary: "Complete the Chameleon form so the next shift can see what was run and what changed.",
    machine: null,
  },
  {
    id: "housekeeping",
    position: operator,
    name: "Workstation & Plant Housekeeping",
    summary: "Keep the press-side and the aisle clear, swept, and ready for the next shift.",
    machine: null,
  },
  {
    id: "waste-recycling",
    position: operator,
    name: "Material Waste/Reject Recycling",
    summary: "Sort runners, purgings, and rejects into the right gaylords. Nothing good goes in the scrap.",
    machine: null,
  },
  {
    id: "raw-basic",
    position: operator,
    name: "Raw material handling (basic)",
    summary: "Stage the right material and color at the press and check the dryer before the run.",
    machine: null,
  },
  {
    id: "purging",
    position: operator,
    name: "Machine Purging (Startup & Shutdown)",
    summary: "Purge this press on startup and shutdown so the next color and the next job start clean.",
    machine: "all",
  },
  {
    id: "color-maguire",
    position: operator,
    name: "Color Changes (Maguire Blender)",
    summary: "Change color on this press with the Maguire blender and hold the color to the standard.",
    machine: "all",
  },
  {
    id: "color-hand",
    position: operator,
    name: "Color Changes (Hand Mixing)",
    summary: "Hand-mix a color change on this press from the lot card and confirm it on the spectrophotometer.",
    machine: "all",
  },
  {
    id: "spectro",
    position: operator,
    name: "Spectrophotometer Color Testing",
    summary: "Read a plaque on the spectrophotometer and know when the color is in, and when to stop the press.",
    machine: null,
  },
  {
    id: "slow-down",
    position: operator,
    name: "Slow Time & Down Time Tasks",
    summary: "Use slow time and down time on the list: housekeeping, prep, and the checks that do not wait for a breakdown.",
    machine: null,
  },
  {
    id: "shift-inspector",
    position: operator,
    name: "Shift Inspector Assignment",
    summary: "Take the shift inspector assignment: samples, records, and when to call the supervisor.",
    machine: null,
  },
  {
    id: "pt-operator-training",
    position: tech,
    name: "Operator Training",
    summary: "Prerequisite. Train an operator on their press and sit with the supervisor when that skill is signed off.",
    machine: null,
    prerequisite: true,
  },
  {
    id: "mold-no-return",
    position: tech,
    name: "Mold Changes (no positive return)",
    summary: "Change a mold that does not use positive ejector return, and bring the press back to a good part.",
    machine: "all",
  },
  {
    id: "mold-positive",
    position: tech,
    name: "Mold Changes (positive return)",
    summary: "Change a mold with positive ejector return, including the return checks before the first shot.",
    machine: "all",
  },
  {
    id: "raw-advanced",
    position: tech,
    name: "Raw material handling (Advanced)",
    summary: "Handle drying, blends, and regrind the way the job and the material call for.",
    machine: null,
  },
  {
    id: "forklift",
    position: tech,
    name: "Forklift Operation",
    summary: "Move molds, gaylords, and skids with the forklift, including the yard and the trailer.",
    machine: null,
  },
  {
    id: "mold-trouble",
    position: tech,
    name: "Mold Troubleshooting (Basic)",
    summary: "Find and correct a basic mold problem on this press: flash, short, sticking, or a water leak at the tool.",
    machine: "all",
  },
  {
    id: "press-trouble",
    position: tech,
    name: "Injection Press Troubleshooting (Basic)",
    summary: "Trace a basic press problem on this machine, from a cold slug to a process drift, and get back to a good part.",
    machine: "all",
  },
  {
    id: "aux-trouble",
    position: tech,
    name: "Auxiliary Equipment Troubleshooting (Basic)",
    summary: "Troubleshoot the dryer, loader, blender, or thermolator on this press and get the cell running again.",
    machine: "all",
  },
  {
    id: "ss-operator-training",
    position: lead,
    name: "Operator Training",
    summary: "Own operator training for the shift: who is learning what, and when they are ready for the supervisor’s sign-off.",
    machine: null,
  },
  {
    id: "ss-tech-training",
    position: lead,
    name: "Process Technician Training",
    summary: "Coach a process technician through the tech plan and judge when the skill is really there.",
    machine: null,
  },
  {
    id: "facility-startup",
    position: lead,
    name: "Shift/Facility Startup",
    summary: "Open the plant: compressors, chillers, dryers, and the press lineup before the crew is on the clock.",
    machine: null,
  },
  {
    id: "facility-shutdown",
    position: lead,
    name: "Shift/Facility Shutdown",
    summary: "Shut the shift down clean: presses, auxiliaries, and the building, with the next shift able to start.",
    machine: null,
  },
  {
    id: "assignment-planning",
    position: lead,
    name: "Shift Operator Assignment Planning & Execution",
    summary: "Plan who runs which press, and change the plan when a job, a call-out, or a mold change hits.",
    machine: null,
  },
  {
    id: "ss-documents",
    position: lead,
    name: "Shift Supervisor Documents",
    summary: "Run the shift from the documents: lineup, item sheets, and the hold and scrap calls a supervisor owns.",
    machine: null,
  },
  {
    id: "ss-records",
    position: lead,
    name: "Shift Supervisor Records",
    summary: "Close the shift records on time, including downtime, scrap, and training notes.",
    machine: null,
  },
  {
    id: "mold-qual",
    position: lead,
    name: "Mold Qualification Testing & Sampling",
    summary: "Qualify a mold: samples, dimensions, and the call that the tool is ready for production.",
    machine: null,
  },
  {
    id: "process-tuning",
    position: lead,
    name: "Process Tuning & Optimization",
    summary: "Tune a process for a stable part, cycle, and color, and leave the setup sheet better than you found it.",
    machine: null,
  },
];

export const PEOPLE: Person[] = [
  {
    id: "dana",
    firstName: "Dana",
    lastName: "Okonkwo",
    name: "Dana Okonkwo",
    role: "supervisor",
    position: null,
    title: "Employee Supervisor",
    email: "dana.okonkwo@selmax.example",
    shift: "1st",
    hired: "2016-04-11",
    supervisorId: null,
  },
  {
    id: "marcus",
    firstName: "Marcus",
    lastName: "Hale",
    name: "Marcus Hale",
    role: "supervisor",
    position: null,
    title: "Employee Supervisor",
    email: "marcus.hale@selmax.example",
    shift: "2nd",
    hired: "2018-09-04",
    supervisorId: null,
  },
  {
    id: "riley",
    firstName: "Riley",
    lastName: "Chen",
    name: "Riley Chen",
    role: "employee",
    position: "operator",
    title: "Operator",
    email: "riley.chen@selmax.example",
    shift: "1st",
    hired: "2026-08-17",
    supervisorId: "dana",
  },
  {
    id: "avery",
    firstName: "Avery",
    lastName: "Brooks",
    name: "Avery Brooks",
    role: "employee",
    position: "operator",
    title: "Operator",
    email: "avery.brooks@selmax.example",
    shift: "1st",
    hired: "2026-01-12",
    supervisorId: "dana",
  },
  {
    id: "jordan",
    firstName: "Jordan",
    lastName: "Patel",
    name: "Jordan Patel",
    role: "employee",
    position: "operator",
    title: "Operator",
    email: "jordan.patel@selmax.example",
    shift: "2nd",
    hired: "2025-03-03",
    supervisorId: "marcus",
  },
  {
    id: "samira",
    firstName: "Samira",
    lastName: "Nguyen",
    name: "Samira Nguyen",
    role: "employee",
    position: "process-technician",
    title: "Process Technician",
    email: "samira.nguyen@selmax.example",
    shift: "1st",
    hired: "2024-06-24",
    supervisorId: "dana",
  },
  {
    id: "casey",
    firstName: "Casey",
    lastName: "Alvarez",
    name: "Casey Alvarez",
    role: "employee",
    position: "process-technician",
    title: "Process Technician",
    email: "casey.alvarez@selmax.example",
    shift: "2nd",
    hired: "2023-09-18",
    supervisorId: "marcus",
  },
  {
    id: "quinn",
    firstName: "Quinn",
    lastName: "Morales",
    name: "Quinn Morales",
    role: "employee",
    position: "shift-supervisor",
    title: "Shift Supervisor",
    email: "quinn.morales@selmax.example",
    shift: "1st",
    hired: "2022-02-07",
    supervisorId: "dana",
  },
];

export const EMPLOYEES = PEOPLE.filter((person) => person.role === "employee");
export const SUPERVISORS = PEOPLE.filter((person) => person.role === "supervisor");

export function getPerson(id: string) {
  return PEOPLE.find((person) => person.id === id);
}

export function getItem(id: string) {
  return ITEMS.find((item) => item.id === id);
}

export function getPress(id: string) {
  return PRESSES.find((press) => press.id === id);
}

export function positionMeta(id: PositionId) {
  return POSITIONS.find((position) => position.id === id)!;
}

export function planPositions(position: PositionId): PositionId[] {
  const ids = POSITIONS.map((entry) => entry.id);
  return ids.slice(0, ids.indexOf(position) + 1);
}

export function pressesFor(item: TrainingItem): Press[] {
  if (item.machine === "all") return PRESSES;
  if (item.machine === "small" || item.machine === "large") {
    return PRESSES.filter((press) => press.size === item.machine);
  }
  return [];
}

export function pressIdsFor(item: TrainingItem): (string | null)[] {
  const presses = pressesFor(item);
  return presses.length ? presses.map((press) => press.id) : [null];
}

export function slotKey(employeeId: string, itemId: string, pressId: string | null) {
  return `${employeeId}|${itemId}|${pressId ?? ""}`;
}

export function scopeLabel(item: TrainingItem) {
  if (item.machine === "small") return "Each small press";
  if (item.machine === "large") return "Each large press";
  if (item.machine === "all") return "Each press";
  return "One sign-off";
}

export function shiftLabel(shift: Person["shift"]) {
  return shift === "1st" ? "1st shift" : "2nd shift";
}

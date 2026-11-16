"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { Logo } from "@/components/logo";
import { Textarea } from "@/components/ui/textarea";
import { ItemSheet } from "@/components/item-sheet";
import { Meter } from "@/components/status-pill";
import { EMPLOYEES, ITEMS, PLANT, POSITIONS, REVISION, positionMeta, shiftLabel } from "@/lib/catalog";
import { rollupItem, tally } from "@/lib/progress";
import { useStore } from "@/lib/store";
import type { Person, PositionId } from "@/lib/types";

type Roll = ReturnType<typeof rollupItem>;

export function MatrixView() {
  const { slots, plan, updatePlan, notices } = useStore();
  const [position, setPosition] = useState<PositionId | "all">("all");
  const [selection, setSelection] = useState<{ employeeId: string; itemId: string } | null>(null);
  const waiting = notices.filter((notice) => notice.kind === "request" && !notice.resolved).length;
  const crew = EMPLOYEES.map((person) => ({ person, stats: tally(person, slots) }));
  const signed = crew.reduce((sum, entry) => sum + entry.stats.signed, 0);
  const total = crew.reduce((sum, entry) => sum + entry.stats.total, 0);
  const pct = total ? Math.round((signed / total) * 100) : 0;
  const groups = POSITIONS.filter((entry) => position === "all" || entry.id === position);

  return (
    <div data-testid="matrix">
      <div className="rounded-t-2xl border border-b-0 border-[#e2dcd2] bg-white px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Logo className="h-8" />
            <h1 className="mt-3 font-display text-3xl tracking-wide uppercase">Training Plan</h1>
          </div>
          <p className="text-right text-sm text-[#5e584f]">
            Revision Level {REVISION}
            <span className="block">Draft in work · On the job</span>
          </p>
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-[#8a847a]">Department or Functional Group</dt>
            <dd>
              {position === "all" ? (
                "All crews"
              ) : (
                <span className="bg-[#f6e27a] px-1">{positionMeta(position).department}</span>
              )}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[#8a847a]">Responsible Manager</dt>
            <dd>Employee Supervisor</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm">
          {crew.length} people · {waiting} waiting on sign-off · {pct}% of required skills signed off
        </p>
        <div className="mt-3 flex gap-1.5 overflow-x-auto">
          <FilterChip active={position === "all"} onClick={() => setPosition("all")}>
            All
          </FilterChip>
          {POSITIONS.map((entry) => (
            <FilterChip key={entry.id} active={position === entry.id} onClick={() => setPosition(entry.id)}>
              {entry.label}
            </FilterChip>
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#5e584f]">
          <li className="flex items-center gap-1"><span className="size-3 border border-[#cfc8bc] bg-white" /> Not started</li>
          <li className="flex items-center gap-1"><span className="size-3 bg-[#fff4e0]" /> In training</li>
          <li className="flex items-center gap-1"><span className="size-3 bg-[#e7f0fa]" /> Employee says ready</li>
          <li className="flex items-center gap-1"><span className="size-3 bg-[#e5f4ec]" /> Signed off</li>
          <li className="flex items-center gap-1"><span className="size-3 bg-[#fde8ee]" /> Sent back</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2 border-x border-[#e2dcd2] bg-[#faf8f5] p-3 sm:grid-cols-3 lg:grid-cols-6">
        {crew.map(({ person, stats }) => (
          <div key={person.id} className="rounded-lg border border-[#e2dcd2] bg-white p-2">
            <p className="truncate text-sm font-medium">{person.lastName}</p>
            <p className="truncate text-[11px] text-[#5e584f]">
              {person.firstName} · {positionMeta(person.position!).short}
            </p>
            <Meter pct={stats.pct} className="mt-1.5" />
            <p className="mt-1 text-[11px] text-[#5e584f]">{stats.pct}%</p>
          </div>
        ))}
      </div>

      <p className="border-x border-[#e2dcd2] bg-white px-3 py-2 text-xs text-[#8a847a] md:hidden">
        Swipe sideways. The names stay put.
      </p>
      <div className="max-h-[68vh] overflow-auto border border-[#e2dcd2] bg-white">
        <table className="w-max min-w-full border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-20 bg-white">
            <tr>
              <th className="sticky left-0 z-30 min-w-52 border-r border-b border-[#e2dcd2] bg-white px-3 py-2 text-[11px] font-medium tracking-wide text-[#8a847a] uppercase">
                Operation / Process / Equipment
              </th>
              {crew.map(({ person, stats }) => (
                <th key={person.id} className="min-w-28 border-b border-[#e2dcd2] px-2 py-2 align-bottom">
                  <div className="font-display text-sm leading-none tracking-wide">{person.lastName}</div>
                  <div className="text-[11px] font-normal text-[#5e584f]">{person.firstName}</div>
                  <div className="text-[10px] font-normal tracking-wide text-[#8a847a] uppercase">
                    {positionMeta(person.position!).short} · {shiftLabel(person.shift).replace(" shift", "")}
                  </div>
                  <Meter pct={stats.pct} className="mt-1" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Group
                key={group.id}
                group={group}
                crew={crew.map((entry) => entry.person)}
                onOpen={(employeeId, itemId) => setSelection({ employeeId, itemId })}
              />
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-b-2xl border border-t-0 border-[#e2dcd2] bg-white p-4">
        <p className="text-sm font-medium">Are there any risks related to training that need to be addressed?</p>
        <div className="mt-2 flex gap-4 text-sm">
          <RiskBox checked={plan.risks === "yes"} onClick={() => updatePlan({ risks: "yes" })} label="Yes" />
          <RiskBox checked={plan.risks === "no"} onClick={() => updatePlan({ risks: "no" })} label="No" />
        </div>
        <label className="mt-4 block text-sm font-medium" htmlFor="risk-note">
          If yes, describe
        </label>
        <Textarea
          id="risk-note"
          value={plan.riskNote}
          onChange={(event) => updatePlan({ riskNote: event.target.value })}
          disabled={plan.risks !== "yes"}
          placeholder={plan.risks === "yes" ? "What has to be fixed before training continues?" : "Marked no."}
          className="mt-1 min-h-16 bg-white"
        />
        <label className="mt-4 block text-sm font-medium" htmlFor="actions">
          Actions needed to achieve the training plan
        </label>
        <Textarea
          id="actions"
          data-testid="plan-actions"
          value={plan.actions}
          onChange={(event) => updatePlan({ actions: event.target.value })}
          className="mt-1 min-h-24 bg-white"
        />
        <p className="mt-4 text-[11px] leading-relaxed text-[#8a847a]">
          {PLANT.name} · {PLANT.street}, {PLANT.city} · {PLANT.iso}. Digital draft of Training Plan, Revision Level {REVISION}.
          The Employee Supervisor still decides when the expected skill is met. Sample people only.
        </p>
      </section>

      <ItemSheet
        open={Boolean(selection)}
        onOpenChange={(next) => {
          if (!next) setSelection(null);
        }}
        employeeId={selection?.employeeId ?? ""}
        itemId={selection?.itemId ?? null}
        pressId={null}
        mode="supervisor"
      />
    </div>
  );
}

function Group({
  group,
  crew,
  onOpen,
}: {
  group: (typeof POSITIONS)[number];
  crew: Person[];
  onOpen: (employeeId: string, itemId: string) => void;
}) {
  const { slots } = useStore();
  const items = ITEMS.filter((item) => item.position === group.id);
  return (
    <>
      <tr>
        <th
          colSpan={1 + crew.length}
          className="sticky left-0 bg-[#1a1a1a] px-3 py-1.5 text-left font-display text-sm tracking-[0.16em] text-white"
        >
          {group.label.toUpperCase()}
          <span className="ml-2 font-sans text-[11px] font-normal tracking-normal text-white/60">{items.length} items</span>
        </th>
      </tr>
      {items.map((item) => (
        <tr key={item.id}>
          <th className="sticky left-0 z-10 border-r border-b border-[#eeeae3] bg-white px-3 py-2 text-left text-[13px] font-medium">
            {item.name}
            {item.machine && (
              <span className="mt-0.5 block text-[10px] font-normal tracking-wide text-[#8a847a] uppercase">
                {item.machine === "small" ? "Small presses" : item.machine === "large" ? "Large presses" : "Per press"}
              </span>
            )}
          </th>
          {crew.map((person) => {
            const roll = rollupItem(person, item.id, slots);
            return (
              <td key={person.id} className="border-b border-[#eeeae3] p-1">
                <button
                  type="button"
                  data-testid={`cell-${person.id}-${item.id}`}
                  disabled={!roll.inPlan}
                  onClick={() => onOpen(person.id, item.id)}
                  className={cn(
                    "flex h-11 w-full items-center justify-center rounded-md text-[11px] font-semibold",
                    cellClass(roll),
                  )}
                  title={`${person.name} · ${item.name}`}
                >
                  <CellLabel roll={roll} />
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function CellLabel({ roll }: { roll: Roll }) {
  if (!roll.inPlan) return <span className="text-[#d5cfc4]">—</span>;
  if (roll.total === 1) {
    if (roll.single === "signed_off") return <Check className="size-4" />;
    if (roll.single === "pending") return <span>Ready</span>;
    if (roll.single === "returned") return <RotateCcw className="size-3.5" />;
    if (roll.single === "in_training") return <span>Train</span>;
    return <span className="size-3.5 rounded-sm border border-[#cfc8bc]" />;
  }
  if (roll.signed === roll.total) return <Check className="size-4" />;
  return (
    <span>
      {roll.signed}/{roll.total}
    </span>
  );
}

function cellClass(roll: Roll) {
  if (!roll.inPlan) return "bg-[#faf8f5] text-[#d5cfc4]";
  if (roll.signed === roll.total && roll.total > 0) return "bg-[#e5f4ec] text-[#1f7a4d]";
  if (roll.pending > 0) return "bg-[#e7f0fa] text-[#1d4e89]";
  if (roll.returned > 0) return "bg-[#fde8ee] text-[#9f1239]";
  if (roll.training > 0 || roll.signed > 0) return "bg-[#fff4e0] text-[#8a5a00]";
  return "bg-white text-[#cfc8bc]";
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 shrink-0 rounded-full border px-3 text-sm",
        active ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e2dcd2] bg-white",
      )}
    >
      {children}
    </button>
  );
}

function RiskBox({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2">
      <span className="grid size-5 place-items-center border border-[#1a1a1a] text-xs font-semibold">{checked ? "X" : ""}</span>
      {label}
    </button>
  );
}

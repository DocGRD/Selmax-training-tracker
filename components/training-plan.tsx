"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ItemSheet } from "@/components/item-sheet";
import { Meter, StatusPill } from "@/components/status-pill";
import {
  getItem,
  getPerson,
  ITEMS,
  planPositions,
  positionMeta,
  pressesFor,
  scopeLabel,
  shiftLabel,
} from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { isReturned, readSlot, rollupItem, tally } from "@/lib/progress";
import { useStore } from "@/lib/store";
import type { TrainingItem } from "@/lib/types";

type Filter = "all" | "open" | "waiting" | "signed";

export function TrainingPlan({ employeeId, mode }: { employeeId: string; mode: "self" | "supervisor" }) {
  const { slots, notices, startTraining } = useStore();
  const person = getPerson(employeeId);
  const [filter, setFilter] = useState<Filter>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selection, setSelection] = useState<{ itemId: string; pressId: string | null } | null>(null);

  if (!person?.position) return null;
  const supervisor = person.supervisorId ? getPerson(person.supervisorId) : undefined;
  const positions = [...planPositions(person.position)].reverse();
  const whole = tally(person, slots);
  const returns = notices.filter((notice) => notice.toId === person.id && notice.kind === "returned" && !notice.read);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "waiting", label: "Waiting" },
    { id: "signed", label: "Signed off" },
  ];

  return (
    <div className="space-y-4" data-testid="training-plan">
      <section className="rounded-2xl border border-[#e2dcd2] bg-white p-4">
        <p className="text-[11px] font-medium tracking-[0.16em] text-[#8a847a] uppercase">
          {positionMeta(person.position).department}
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-wide uppercase">{person.name}</h1>
        <p className="text-sm text-[#5e584f]">
          {person.title} · {shiftLabel(person.shift)}
          {supervisor ? ` · Reports to ${supervisor.name}` : ""}
        </p>
        <div className="mt-4">
          <div className="flex items-end justify-between gap-3">
            <p className="font-display text-4xl leading-none">{whole.pct}%</p>
            <p className="text-right text-xs text-[#5e584f]">
              {whole.signed} of {whole.total} signed off
              <span className="block">
                {whole.training} in training
                {whole.pending ? ` · ${whole.pending} waiting` : ""}
                {whole.returned ? ` · ${whole.returned} sent back` : ""}
              </span>
            </p>
          </div>
          <Meter pct={whole.pct} className="mt-2 h-2" />
        </div>
      </section>

      {person.id === "riley" && mode === "self" && readSlot(slots, person.id, "part-inspection", null).status === "not_started" && (
        <button
          type="button"
          className="block w-full rounded-xl border border-[#f0d7a4] bg-[#fff8ea] px-3 py-3 text-left"
          onClick={() => setSelection({ itemId: "part-inspection", pressId: null })}
        >
          <span className="text-[11px] font-medium tracking-[0.14em] text-[#8a5a00] uppercase">Walkthrough</span>
          <span className="mt-0.5 block text-sm">Open Part Inspection and tap I know this. Dana will see it in the inbox.</span>
        </button>
      )}

      {returns.map((notice) => {
        const item = getItem(notice.itemId);
        return (
          <button
            key={notice.id}
            type="button"
            className="block w-full rounded-xl border border-[#f3c2ce] bg-[#fde8ee] px-3 py-3 text-left"
            onClick={() => setSelection({ itemId: notice.itemId, pressId: notice.pressId })}
          >
            <span className="text-[11px] font-medium tracking-[0.14em] text-[#9f1239] uppercase">Sent back</span>
            <span className="mt-0.5 block text-sm font-medium">{item?.name}</span>
            <span className="mt-1 block text-sm">{notice.note}</span>
          </button>
        );
      })}

      <div className="sticky top-[60px] z-30 -mx-3 flex gap-1.5 overflow-x-auto bg-[#f3f0ea]/95 px-3 py-2 backdrop-blur sm:-mx-5 sm:px-5">
        {filters.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setFilter(entry.id)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3 text-sm",
              filter === entry.id ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e2dcd2] bg-white",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {positions.map((position) => {
        const section = tally(person, slots, position);
        const current = position === person.position;
        const closed = collapsed[position] ?? (!current && section.pct === 100);
        const items = ITEMS.filter((item) => item.position === position).filter((item) =>
          matches(rollupItem(person, item.id, slots), filter),
        );
        return (
          <section key={position}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 py-1 text-left"
              onClick={() => setCollapsed((prev) => ({ ...prev, [position]: !closed }))}
            >
              <span>
                <span className="font-display text-xl tracking-wide uppercase">{positionMeta(position).label}</span>
                <span className="ml-2 text-xs text-[#5e584f]">
                  {current ? "Current plan" : "Prerequisite"} · {section.signed}/{section.total}
                </span>
              </span>
              <span className="text-xs text-[#5e584f]">{closed ? "Show" : "Hide"}</span>
            </button>
            {!closed &&
              (items.length === 0 ? (
                <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-[#8a847a]">
                  Nothing in this pile.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {items.map((item) => (
                    <SkillCard
                      key={item.id}
                      item={item}
                      employeeId={person.id}
                      mode={mode}
                      onOpen={(pressId) => setSelection({ itemId: item.id, pressId })}
                      onStart={(pressId) => {
                        startTraining(person.id, item.id, pressId);
                        toast("Marked in training.");
                      }}
                    />
                  ))}
                </div>
              ))}
          </section>
        );
      })}

      <ItemSheet
        open={Boolean(selection)}
        onOpenChange={(next) => {
          if (!next) setSelection(null);
        }}
        employeeId={employeeId}
        itemId={selection?.itemId ?? null}
        pressId={selection?.pressId ?? null}
        mode={mode}
      />
    </div>
  );
}

function matches(roll: ReturnType<typeof rollupItem>, filter: Filter) {
  if (!roll.inPlan) return false;
  if (filter === "all") return true;
  if (filter === "waiting") return roll.pending > 0;
  if (filter === "signed") return roll.signed === roll.total;
  return roll.signed < roll.total;
}

function SkillCard({
  item,
  employeeId,
  mode,
  onOpen,
  onStart,
}: {
  item: TrainingItem;
  employeeId: string;
  mode: "self" | "supervisor";
  onOpen: (pressId: string | null) => void;
  onStart: (pressId: string | null) => void;
}) {
  const { slots } = useStore();
  const person = getPerson(employeeId)!;
  const supervisor = person.supervisorId ? getPerson(person.supervisorId) : undefined;
  const roll = rollupItem(person, item.id, slots);
  const presses = pressesFor(item);
  const focus = useMemo(() => bestPress(employeeId, item, slots), [employeeId, item, slots]);
  const single = presses.length === 0 ? readSlot(slots, employeeId, item.id, null) : null;
  const singleReturned = single ? isReturned(single) : false;
  const singleStatus = single ? (singleReturned ? "returned" : single.status) : roll.pending ? "pending" : "in_training";
  const signedBy = single?.signedOffBy ? getPerson(single.signedOffBy) : undefined;

  return (
    <article
      data-testid={`skill-${item.id}`}
      className="rounded-xl border border-[#e2dcd2] bg-white p-3"
    >
      <button type="button" className="block w-full text-left" onClick={() => onOpen(focus)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="leading-snug font-medium">{item.name}</h3>
            <p className="mt-0.5 text-xs text-[#8a847a]">
              {scopeLabel(item)}
              {presses.length > 0 ? ` · ${roll.signed} of ${roll.total} presses` : ""}
            </p>
          </div>
          {presses.length === 0 && <StatusPill status={singleStatus} />}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-[#5e584f]">{item.summary}</p>
      </button>

      {presses.length > 0 && (
        <div className="mt-3 space-y-2">
          {(["small", "large"] as const)
            .filter((size) => presses.some((press) => press.size === size))
            .map((size) => (
              <div key={size} className="flex flex-wrap items-center gap-1.5">
                {item.machine === "all" && (
                  <span className="w-12 text-[10px] font-medium tracking-wide text-[#8a847a] uppercase">
                    {size === "small" ? "Small" : "Large"}
                  </span>
                )}
                {presses
                  .filter((press) => press.size === size)
                  .map((press) => {
                    const slot = readSlot(slots, employeeId, item.id, press.id);
                    const returned = isReturned(slot);
                    return (
                      <button
                        key={press.id}
                        type="button"
                        data-testid={`press-${item.id}-${press.id}`}
                        onClick={() => onOpen(press.id)}
                        className={cn(
                          "h-10 min-w-12 rounded-md border px-2 text-xs font-semibold",
                          chipClass(slot.status, returned),
                        )}
                      >
                        {press.name}
                      </button>
                    );
                  })}
              </div>
            ))}
        </div>
      )}

      {single?.status === "signed_off" && single.signedOffAt && (
        <p className="mt-2 text-sm text-[#1f7a4d]">
          Signed off {formatDate(single.signedOffAt)}
          {signedBy ? ` · ${signedBy.name}` : ""}
        </p>
      )}
      {single?.status === "pending" && (
        <p className="mt-2 text-sm text-[#1d4e89]">Waiting on {supervisor?.name ?? "supervisor"}.</p>
      )}
      {singleReturned && single?.supervisorComment && (
        <p className="mt-2 text-sm text-[#9f1239]">{single.supervisorComment}</p>
      )}

      {mode === "self" && single && single.status !== "signed_off" && single.status !== "pending" && (
        <div className="mt-3 flex gap-2">
          <Button data-testid={`know-${item.id}`} className="h-11" onClick={() => onOpen(null)}>
            I know this
          </Button>
          {single.status === "not_started" && (
            <Button variant="outline" className="h-11" onClick={() => onStart(null)}>
              Start training
            </Button>
          )}
        </div>
      )}
      {mode === "self" && presses.some((press) => {
        const slot = readSlot(slots, employeeId, item.id, press.id);
        return slot.status === "not_started" || (slot.status === "in_training" && !isReturned(slot)) || isReturned(slot);
      }) && (
        <div className="mt-3">
          <Button data-testid={`know-${item.id}`} className="h-11" onClick={() => onOpen(focus)}>
            I know this
          </Button>
        </div>
      )}
    </article>
  );
}

function bestPress(employeeId: string, item: TrainingItem, slots: Record<string, import("@/lib/types").Slot>) {
  const presses = pressesFor(item);
  if (!presses.length) return null;
  const rank = (pressId: string) => {
    const slot = readSlot(slots, employeeId, item.id, pressId);
    if (isReturned(slot)) return 0;
    if (slot.status === "in_training") return 1;
    if (slot.status === "not_started") return 2;
    if (slot.status === "pending") return 3;
    return 4;
  };
  return [...presses].sort((a, b) => rank(a.id) - rank(b.id))[0]?.id ?? null;
}

function chipClass(status: string, returned: boolean) {
  if (returned) return "border-[#f3c2ce] bg-[#fde8ee] text-[#9f1239]";
  if (status === "signed_off") return "border-[#b7dfc8] bg-[#e5f4ec] text-[#1f7a4d]";
  if (status === "pending") return "border-[#c5d7ee] bg-[#e7f0fa] text-[#1d4e89]";
  if (status === "in_training") return "border-[#f0d7a4] bg-[#fff4e0] text-[#8a5a00]";
  return "border-[#e2dcd2] bg-white text-[#5e584f]";
}

"use client";

import Link from "next/link";
import { Meter } from "@/components/status-pill";
import { EMPLOYEES, planPositions, positionMeta, shiftLabel } from "@/lib/catalog";
import { getPerson } from "@/lib/catalog";
import { tally } from "@/lib/progress";
import { useStore } from "@/lib/store";

export function TeamView() {
  const { slots } = useStore();
  return (
    <div data-testid="team">
      <p className="text-[11px] font-medium tracking-[0.16em] text-[#8a847a] uppercase">The floor</p>
      <h1 className="font-display text-3xl tracking-wide uppercase">Crew</h1>
      <p className="mb-4 text-sm text-[#5e584f]">
        Operator, then process technician, then shift supervisor. Open a person to see every skill, including each press.
      </p>
      <div className="grid gap-2">
        {EMPLOYEES.map((person) => {
          const stats = tally(person, slots);
          const supervisor = person.supervisorId ? getPerson(person.supervisorId) : undefined;
          return (
            <Link
              key={person.id}
              href={`/team/${person.id}`}
              className="rounded-xl border border-[#e2dcd2] bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{person.name}</h2>
                  <p className="text-xs text-[#5e584f]">
                    {person.title} · {shiftLabel(person.shift)}
                    {supervisor ? ` · ${supervisor.name}` : ""}
                  </p>
                </div>
                <p className="font-display text-2xl leading-none">{stats.pct}%</p>
              </div>
              <div className="mt-3 space-y-1.5">
                {planPositions(person.position!).map((position) => {
                  const section = tally(person, slots, position);
                  return (
                    <div key={position} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-[11px]">
                      <span className="text-[#5e584f]">{positionMeta(position).label}</span>
                      <Meter pct={section.pct} />
                      <span className="text-right text-[#5e584f]">
                        {section.signed}/{section.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

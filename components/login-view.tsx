"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/status-pill";
import { Walkthrough } from "@/components/walkthrough";
import { BrandLoading } from "@/components/shell";
import { EMPLOYEES, PLANT, REVISION, SUPERVISORS, shiftLabel } from "@/lib/catalog";
import { initials } from "@/lib/format";
import { tally } from "@/lib/progress";
import { useStore } from "@/lib/store";

export function LoginView() {
  const { ready, user, slots, notices, signIn } = useStore();
  const router = useRouter();
  const [guide, setGuide] = useState(false);

  if (!ready) return <BrandLoading />;

  async function enter(personId: string, role: "employee" | "supervisor") {
    await signIn(personId);
    router.push(role === "employee" ? "/train" : "/inbox");
  }

  return (
    <div className="min-h-dvh bg-[#f3f0ea]">
      <div className="h-1 bg-selmax" />
      <div className="mx-auto grid max-w-6xl lg:min-h-[calc(100dvh-4px)] lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        <aside className="border-[#e2dcd2] bg-white px-5 py-8 sm:px-10 lg:border-r lg:py-12">
          <Logo className="h-11" priority />
          <p className="mt-10 font-display text-[2.6rem] leading-[0.9] tracking-wide uppercase sm:text-6xl">
            Training
            <span className="block">sign-off</span>
          </p>
          <p className="mt-4 text-sm text-[#5e584f]">
            Revision Level {REVISION} · On the job · {PLANT.city}
          </p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#3f3a34]">
            The Employee Supervisor still decides when someone has the skill. This is the paper training plan, with a name and a date on every sign-off — including each press.
          </p>
          <Button className="mt-6 h-11" onClick={() => setGuide(true)}>
            How to show this
          </Button>
          {user && (
            <button
              type="button"
              className="mt-3 block text-sm underline underline-offset-4"
              onClick={() => enter(user.id, user.role)}
            >
              Continue as {user.name}
            </button>
          )}
          <p className="mt-10 max-w-sm text-xs leading-relaxed text-[#8a847a]">
            Sample crew only. These are not real employees. {PLANT.iso} · {PLANT.belief} · Since {PLANT.since}. {PLANT.street}.
          </p>
        </aside>
        <section className="px-4 py-6 sm:px-8 sm:py-10">
          <h2 className="text-[11px] font-medium tracking-[0.16em] text-[#8a847a] uppercase">Employees</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {EMPLOYEES.map((person) => {
              const stats = tally(person, slots);
              return (
                <button
                  key={person.id}
                  type="button"
                  data-testid={`sign-in-${person.id}`}
                  onClick={() => enter(person.id, "employee")}
                  className="flex items-center gap-3 rounded-xl border border-[#e2dcd2] bg-white p-3 text-left transition hover:border-[#1a1a1a]"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#1a1a1a] font-display text-lg text-white">
                    {initials(person.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{person.name}</span>
                    <span className="block text-xs text-[#5e584f]">
                      {person.title} · {shiftLabel(person.shift)}
                    </span>
                    <Meter pct={stats.pct} className="mt-2" />
                    <span className="mt-1 block text-[11px] text-[#5e584f]">
                      {stats.signed} of {stats.total} signed off
                      {stats.pending ? ` · ${stats.pending} waiting` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <h2 className="mt-6 text-[11px] font-medium tracking-[0.16em] text-[#8a847a] uppercase">Employee Supervisors</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {SUPERVISORS.map((person) => {
              const waiting = notices.filter(
                (notice) => notice.toId === person.id && notice.kind === "request" && !notice.resolved,
              ).length;
              return (
                <button
                  key={person.id}
                  type="button"
                  data-testid={`sign-in-${person.id}`}
                  onClick={() => enter(person.id, "supervisor")}
                  className="flex items-center gap-3 rounded-xl border border-[#e2dcd2] bg-white p-3 text-left transition hover:border-[#1a1a1a]"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-selmax font-display text-lg text-white">
                    {initials(person.name)}
                  </span>
                  <span>
                    <span className="block font-medium">{person.name}</span>
                    <span className="block text-xs text-[#5e584f]">
                      {person.title} · {shiftLabel(person.shift)}
                    </span>
                    <span className="mt-1 block text-[11px] text-[#5e584f]">
                      {waiting === 0 ? "Inbox is clear" : `${waiting} sign-off${waiting === 1 ? "" : "s"} waiting`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-5 text-xs text-[#8a847a]">Demo sign-in. No password. A real login can replace this picker.</p>
        </section>
      </div>
      <Walkthrough open={guide} onOpenChange={setGuide} />
    </div>
  );
}

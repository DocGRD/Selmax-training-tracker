"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardList, Inbox, LayoutGrid, LogOut, Mail, RefreshCcw, Users } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo, Mark } from "@/components/logo";
import { Walkthrough } from "@/components/walkthrough";
import { EMPLOYEES, REVISION, SUPERVISORS, shiftLabel } from "@/lib/catalog";
import { initials } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const EMPLOYEE_NAV = [
  { href: "/train", label: "My plan", icon: ClipboardList },
  { href: "/updates", label: "Updates", icon: Mail },
];

const SUPERVISOR_NAV = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/matrix", label: "Matrix", icon: LayoutGrid },
  { href: "/team", label: "Crew", icon: Users },
];

export function Shell({ allow, children }: { allow: Role; children: React.ReactNode }) {
  const { ready, user, notices } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/");
    else if (user.role !== allow) router.replace(user.role === "employee" ? "/train" : "/inbox");
  }, [ready, user, allow, router]);

  if (!ready || !user || user.role !== allow) {
    return <BrandLoading />;
  }

  const nav = user.role === "employee" ? EMPLOYEE_NAV : SUPERVISOR_NAV;
  const inboxCount = notices.filter((notice) => notice.toId === user.id && notice.kind === "request" && !notice.resolved).length;
  const updateCount = notices.filter((notice) => notice.toId === user.id && notice.kind !== "request" && !notice.read).length;

  function badge(href: string) {
    if (href === "/inbox") return inboxCount;
    if (href === "/updates") return updateCount;
    return 0;
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-[#e2dcd2] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3 sm:px-5">
          <Link href={user.role === "employee" ? "/train" : "/inbox"} className="flex items-center gap-2">
            <Mark className="sm:hidden" />
            <Logo className="hidden sm:block" />
          </Link>
          <div className="min-w-0 leading-none">
            <div className="font-display text-[15px] tracking-wide text-[#1a1a1a] sm:text-lg">TRAINING SIGN-OFF</div>
            <div className="text-[11px] text-[#5e584f]">Revision {REVISION} · On the job</div>
          </div>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
        <div className="h-1 bg-selmax" />
      </header>
      <main className="mx-auto w-full max-w-6xl px-3 py-4 pb-28 sm:px-5 sm:pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e2dcd2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const count = badge(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                  active ? "text-[#1a1a1a]" : "text-[#8a847a]",
                )}
              >
                <Icon className="size-5" />
                {item.label}
                {count > 0 && (
                  <span className="absolute top-1.5 ml-7 rounded-full bg-selmax px-1.5 text-[10px] leading-4 text-white">
                    {count}
                  </span>
                )}
                {active && <span className="absolute inset-x-6 top-0 h-0.5 bg-selmax" />}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}

function UserMenu() {
  const { user, signIn, signOut, reset } = useStore();
  const router = useRouter();
  const [guide, setGuide] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [resetting, setResetting] = useState(false);
  if (!user) return null;

  async function go(personId: string, role: Role) {
    await signIn(personId);
    setSwitching(false);
    router.push(role === "employee" ? "/train" : "/inbox");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-10 items-center gap-2 rounded-full border border-[#e2dcd2] bg-white pr-3 pl-1">
          <span
            className={cn(
              "grid size-8 place-items-center rounded-full font-display text-sm text-white",
              user.role === "supervisor" ? "bg-selmax" : "bg-[#1a1a1a]",
            )}
          >
            {initials(user.name)}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm leading-none font-medium">{user.firstName}</span>
            <span className="text-[11px] text-[#5e584f]">{user.title}</span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60!">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {user.name}
              <span className="mt-0.5 block text-xs font-normal text-[#5e584f]">
                {user.title} · {shiftLabel(user.shift)}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setGuide(true)}>How to show this</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSwitching(true)}>Switch person</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResetting(true)}>
              <RefreshCcw />
              Reset demo data
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Walkthrough open={guide} onOpenChange={setGuide} />
      <Dialog open={switching} onOpenChange={setSwitching}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch person</DialogTitle>
            <DialogDescription>Same browser, same sample plant. Pick who you are walking through as.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {[...EMPLOYEES, ...SUPERVISORS].map((person) => (
              <button
                key={person.id}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[#f6f3ee]"
                onClick={() => go(person.id, person.role)}
              >
                <span className="w-28 text-sm font-medium">{person.name}</span>
                <span className="text-xs text-[#5e584f]">
                  {person.title} · {shiftLabel(person.shift)}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={resetting} onOpenChange={setResetting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset the demo?</DialogTitle>
            <DialogDescription>
              Puts every sign-off, note, and inbox message back to the sample crew. You stay signed in as {user.firstName}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetting(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                reset();
                setResetting(false);
              }}
            >
              Reset demo data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BrandLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f3f0ea]">
      <div className="text-center">
        <Logo className="mx-auto h-10" priority />
        <p className="mt-3 text-sm text-[#5e584f]">Opening the training plan…</p>
      </div>
    </div>
  );
}

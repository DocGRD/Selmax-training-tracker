import { cn } from "cn";
import type { SlotStatus } from "@/lib/types";

export type StatusKey = SlotStatus | "returned" | "out";

const META: Record<StatusKey, { label: string; className: string }> = {
  not_started: {
    label: "Not started",
    className: "border-[#e2dcd2] bg-[#f6f3ee] text-[#5e584f]",
  },
  in_training: {
    label: "In training",
    className: "border-[#f0d7a4] bg-[#fff4e0] text-[#8a5a00]",
  },
  pending: {
    label: "Employee says ready",
    className: "border-[#c5d7ee] bg-[#e7f0fa] text-[#1d4e89]",
  },
  signed_off: {
    label: "Signed off",
    className: "border-[#b7dfc8] bg-[#e5f4ec] text-[#1f7a4d]",
  },
  returned: {
    label: "Sent back",
    className: "border-[#f3c2ce] bg-[#fde8ee] text-[#9f1239]",
  },
  out: {
    label: "Not on this plan",
    className: "border-transparent bg-transparent text-[#b0a89c]",
  },
};

export function statusMeta(status: StatusKey) {
  return META[status];
}

export function StatusPill({ status, className }: { status: StatusKey; className?: string }) {
  const meta = META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function Meter({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-[#e7e1d6]", className)}>
      <div className="h-full rounded-full bg-[#1f7a4d]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getItem, getPerson, shiftLabel } from "@/lib/catalog";
import { formatDateTime, formatRelative, pressLine } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Notice } from "@/lib/types";

export function InboxView() {
  const { user, notices, approve, sendBack, markNoticeRead } = useStore();
  const [tab, setTab] = useState<"waiting" | "handled">("waiting");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  const waiting = notices.filter((notice) => notice.toId === user.id && notice.kind === "request" && !notice.resolved);
  const handled = notices.filter((notice) => notice.toId === user.id && notice.kind === "request" && notice.resolved);
  const list = tab === "waiting" ? waiting : handled;
  const selected = list.find((notice) => notice.id === selectedId) ?? list[0] ?? null;

  function open(notice: Notice) {
    setSelectedId(notice.id);
    setMobileOpen(true);
    if (!notice.read) markNoticeRead(notice.id);
  }

  return (
    <div data-testid="inbox">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#8a847a] uppercase">Training desk</p>
          <h1 className="font-display text-3xl tracking-wide uppercase">Inbox</h1>
          <p className="text-sm text-[#5e584f]">
            {waiting.length === 0
              ? "Nothing is waiting on you."
              : `${waiting.length} sign-off${waiting.length === 1 ? "" : "s"} waiting on ${user.firstName}.`}
          </p>
        </div>
      </div>
      <p className="mb-3 rounded-lg border border-dashed border-[#e2dcd2] bg-white px-3 py-2 text-xs text-[#5e584f]">
        Simulated email. In the real plant this is a message to {user.email}. Here it stays in the inbox.
      </p>
      <div className="mb-3 flex gap-1.5">
        {(
          [
            ["waiting", `Waiting (${waiting.length})`],
            ["handled", `Handled (${handled.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-9 rounded-full border px-3 text-sm",
              tab === id ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e2dcd2] bg-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          {list.length === 0 && (
            <div className="rounded-xl border border-dashed px-3 py-10 text-center text-sm text-[#8a847a]">
              {tab === "waiting" ? "The inbox is clear." : "Nothing has been decided yet."}
            </div>
          )}
          {list.map((notice) => (
            <button
              key={notice.id}
              type="button"
              data-testid={`inbox-${notice.employeeId}-${notice.itemId}-${notice.pressId ?? "one"}`}
              onClick={() => open(notice)}
              className={cn(
                "block w-full rounded-xl border bg-white p-3 text-left",
                selected?.id === notice.id ? "border-[#1a1a1a]" : "border-[#e2dcd2]",
              )}
            >
              <div className="flex items-center gap-2">
                {!notice.read && !notice.resolved && <span className="size-2 rounded-full bg-selmax" />}
                <span className="text-xs text-[#8a847a]">{formatRelative(notice.createdAt)}</span>
                {notice.resolved && (
                  <span className="text-[11px] font-medium tracking-wide text-[#5e584f] uppercase">
                    {notice.resolved === "approved" ? "Signed off" : "Sent back"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium">{notice.subject}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-[#5e584f]">{notice.preview}</p>
            </button>
          ))}
        </div>
        <div className={cn("md:block", mobileOpen ? "block" : "hidden")}>
          {selected ? (
            <MailDetail
              key={selected.id}
              notice={selected}
              onApprove={() => {
                approve(selected.employeeId, selected.itemId, selected.pressId);
                const person = getPerson(selected.employeeId);
                toast.success(`Signed off for ${person?.firstName ?? "them"}.`);
                const next = waiting.find((notice) => notice.id !== selected.id);
                setSelectedId(next?.id ?? null);
              }}
              onSendBack={(comment) => {
                sendBack(selected.employeeId, selected.itemId, selected.pressId, comment);
                const person = getPerson(selected.employeeId);
                toast.success(`Sent back to ${person?.firstName ?? "them"}.`);
                const next = waiting.find((notice) => notice.id !== selected.id);
                setSelectedId(next?.id ?? null);
              }}
            />
          ) : (
            <div className="hidden rounded-xl border border-dashed px-3 py-16 text-center text-sm text-[#8a847a] md:block">
              Select a message.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UpdatesView() {
  const { user, notices, markNoticeRead } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!user) return null;
  const mine = notices.filter((notice) => notice.toId === user.id && notice.kind !== "request");
  const selected = mine.find((notice) => notice.id === selectedId) ?? null;

  return (
    <div data-testid="updates">
      <p className="text-[11px] font-medium tracking-[0.16em] text-[#8a847a] uppercase">From your supervisor</p>
      <h1 className="font-display text-3xl tracking-wide uppercase">Updates</h1>
      <p className="mb-3 text-sm text-[#5e584f]">Sign-offs and send-backs show up here, the way an email would.</p>
      {mine.length === 0 ? (
        <div className="rounded-xl border border-dashed px-3 py-12 text-center text-sm text-[#8a847a]">
          No messages yet. When a supervisor signs off or sends something back, it lands here.
        </div>
      ) : (
        <div className="space-y-2">
          {mine.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => {
                setSelectedId(notice.id);
                if (!notice.read) markNoticeRead(notice.id);
              }}
              className="block w-full rounded-xl border border-[#e2dcd2] bg-white p-3 text-left"
            >
              <div className="flex items-center gap-2">
                {!notice.read && <span className="size-2 rounded-full bg-selmax" />}
                <span className="text-xs text-[#8a847a]">{formatRelative(notice.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{notice.subject}</p>
              <p className="line-clamp-2 text-sm text-[#5e584f]">{notice.preview}</p>
            </button>
          ))}
          {selected && <MailDetail notice={selected} />}
        </div>
      )}
    </div>
  );
}

function MailDetail({
  notice,
  onApprove,
  onSendBack,
}: {
  notice: Notice;
  onApprove?: () => void;
  onSendBack?: (comment: string) => void;
}) {
  const from = getPerson(notice.fromId);
  const to = getPerson(notice.toId);
  const employee = getPerson(notice.employeeId);
  const item = getItem(notice.itemId);
  const [sendingBack, setSendingBack] = useState(false);
  const [comment, setComment] = useState("");
  const where = pressLine(notice.pressId);

  return (
    <article data-testid="mail" className="overflow-hidden rounded-xl border border-[#e2dcd2] bg-white">
      <div className="flex items-center justify-between bg-[#1a1a1a] px-3 py-2 text-white">
        <p className="font-display tracking-[0.18em]">SELMAX · TRAINING DESK</p>
        <p className="text-[10px] tracking-wide text-white/70 uppercase">Simulated email</p>
      </div>
      <div className="space-y-3 p-4">
        <h2 className="text-lg leading-snug font-medium">{notice.subject}</h2>
        <dl className="space-y-1 text-sm">
          <div className="grid grid-cols-[3.5rem_1fr] gap-2">
            <dt className="text-[#8a847a]">From</dt>
            <dd>
              {from?.name}
              <span className="block text-xs text-[#8a847a]">{from?.email}</span>
            </dd>
          </div>
          <div className="grid grid-cols-[3.5rem_1fr] gap-2">
            <dt className="text-[#8a847a]">To</dt>
            <dd>
              {to?.name}
              <span className="block text-xs text-[#8a847a]">{to?.email}</span>
            </dd>
          </div>
          <div className="grid grid-cols-[3.5rem_1fr] gap-2">
            <dt className="text-[#8a847a]">When</dt>
            <dd>{formatDateTime(notice.createdAt)}</dd>
          </div>
        </dl>
        <div className="border-t pt-3 text-sm leading-relaxed">
          {notice.kind === "request" && (
            <p>
              {employee?.name}, {employee ? employee.title.toLowerCase() : "employee"} on the {employee ? shiftLabel(employee.shift) : "shift"}, says this is ready for sign-off.
            </p>
          )}
          {notice.kind === "approved" && <p>{from?.name} signed this off.</p>}
          {notice.kind === "returned" && <p>{from?.name} sent this back.</p>}
          <p className="mt-3">
            <span className="text-[#8a847a]">Item. </span>
            {item?.name}
          </p>
          {where && (
            <p>
              <span className="text-[#8a847a]">Press. </span>
              {where}
            </p>
          )}
          {notice.note && <blockquote className="mt-3 border-l-2 border-selmax pl-3">“{notice.note}”</blockquote>}
          {notice.resolved && (
            <p className="mt-3 rounded-lg bg-[#f6f3ee] px-3 py-2">
              {notice.resolved === "approved" ? "Signed off" : "Sent back"}
              {notice.resolvedAt ? ` · ${formatDateTime(notice.resolvedAt)}` : ""}
              {notice.resolutionNote ? ` — ${notice.resolutionNote}` : ""}
            </p>
          )}
        </div>
        {notice.kind === "request" && !notice.resolved && onApprove && onSendBack && (
          <div className="border-t pt-3">
            {sendingBack ? (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="inbox-comment">
                  What still needs work?
                </label>
                <Textarea
                  id="inbox-comment"
                  data-testid="inbox-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="They will see this on the skill."
                  className="min-h-20"
                />
                <div className="flex gap-2">
                  <Button
                    data-testid="inbox-send-back"
                    className="h-11 flex-1 bg-selmax text-white hover:bg-[#c4253d]"
                    disabled={!comment.trim()}
                    onClick={() => onSendBack(comment)}
                  >
                    Send back
                  </Button>
                  <Button variant="outline" className="h-11" onClick={() => setSendingBack(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  data-testid="inbox-approve"
                  className="h-11 flex-1 bg-[#1f7a4d] text-white hover:bg-[#19663f]"
                  onClick={onApprove}
                >
                  Sign off
                </Button>
                <Button data-testid="inbox-return" variant="outline" className="h-11" onClick={() => setSendingBack(true)}>
                  Send back
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

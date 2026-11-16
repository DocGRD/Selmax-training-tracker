"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/status-pill";
import { getItem, getPerson, getPress, pressesFor, scopeLabel, shiftLabel } from "@/lib/catalog";
import { formatDate, formatDateTime, pressLine } from "@/lib/format";
import { isReturned, readSlot } from "@/lib/progress";
import { useStore } from "@/lib/store";
import type { Slot, SlotStatus } from "@/lib/types";

export function ItemSheet({
  open,
  onOpenChange,
  employeeId,
  itemId,
  pressId,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  itemId: string | null;
  pressId: string | null;
  mode: "self" | "supervisor";
}) {
  const item = itemId ? getItem(itemId) : undefined;
  const presses = item ? pressesFor(item) : [];
  const [activePress, setActivePress] = useState<string | null>(pressId);
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [sendingBack, setSendingBack] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActivePress(pressId);
    setNote("");
    setComment("");
    setSendingBack(false);
  }, [open, itemId, pressId]);

  const chosenPress = item?.machine ? activePress ?? presses[0]?.id ?? null : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] overflow-y-auto rounded-t-2xl px-0 data-[side=bottom]:h-auto"
      >
        {item && (
          <ItemBody
            employeeId={employeeId}
            itemId={item.id}
            pressId={chosenPress}
            mode={mode}
            note={note}
            setNote={setNote}
            comment={comment}
            setComment={setComment}
            sendingBack={sendingBack}
            setSendingBack={setSendingBack}
            onPress={(id) => {
              setActivePress(id);
              setNote("");
              setComment("");
              setSendingBack(false);
            }}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ItemBody({
  employeeId,
  itemId,
  pressId,
  mode,
  note,
  setNote,
  comment,
  setComment,
  sendingBack,
  setSendingBack,
  onPress,
  onDone,
}: {
  employeeId: string;
  itemId: string;
  pressId: string | null;
  mode: "self" | "supervisor";
  note: string;
  setNote: (value: string) => void;
  comment: string;
  setComment: (value: string) => void;
  sendingBack: boolean;
  setSendingBack: (value: boolean) => void;
  onPress: (pressId: string) => void;
  onDone: () => void;
}) {
  const { slots, user, startTraining, requestSignoff, approve, sendBack } = useStore();
  const item = getItem(itemId)!;
  const employee = getPerson(employeeId)!;
  const supervisor = employee.supervisorId ? getPerson(employee.supervisorId) : undefined;
  const slot = readSlot(slots, employeeId, itemId, pressId);
  const returned = isReturned(slot);
  const status = returned ? "returned" : slot.status;
  const presses = pressesFor(item);
  const press = pressId ? getPress(pressId) : undefined;
  const signedBy = slot.signedOffBy ? getPerson(slot.signedOffBy) : undefined;
  const history = useMemo(() => [...slot.history].reverse(), [slot.history]);
  const self = mode === "self" && user?.id === employeeId;
  const canSupervise = mode === "supervisor" && user?.role === "supervisor";

  return (
    <>
      <SheetHeader className="pr-10">
        <p className="text-[11px] font-medium tracking-[0.14em] text-[#8a847a] uppercase">
          {scopeLabel(item)}
          {item.prerequisite ? " · Prerequisite" : ""}
        </p>
        <SheetTitle className="text-left text-base leading-snug">{item.name}</SheetTitle>
        <SheetDescription className="text-left">
          {employee.name} · {employee.title} · {shiftLabel(employee.shift)}
          {press ? ` · ${pressLine(press.id)}` : ""}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-4 pb-6">
        {presses.length > 0 && (
          <div className="space-y-2">
            {(["small", "large"] as const)
              .filter((size) => presses.some((entry) => entry.size === size))
              .map((size) => (
                <div key={size}>
                  {item.machine === "all" && (
                    <p className="mb-1 text-[11px] font-medium tracking-wide text-[#8a847a] uppercase">
                      {size === "small" ? "Small presses" : "Large presses"}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {presses
                      .filter((entry) => entry.size === size)
                      .map((entry) => {
                        const entrySlot = readSlot(slots, employeeId, itemId, entry.id);
                        const entryReturned = isReturned(entrySlot);
                        const selected = entry.id === pressId;
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => onPress(entry.id)}
                            className={cn(
                              "h-10 min-w-12 rounded-md border px-2 text-xs font-semibold",
                              chipClass(entrySlot.status, entryReturned),
                              selected && "ring-2 ring-[#1a1a1a] ring-offset-1",
                            )}
                          >
                            {entry.name}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
        )}

        <p className="text-sm leading-relaxed text-[#3f3a34]">{item.summary}</p>

        <div className="rounded-xl border bg-[#faf8f5] p-3">
          <StatusPill status={status} />
          {slot.status === "signed_off" && slot.signedOffAt && (
            <p className="mt-2 text-sm">
              Signed off {formatDate(slot.signedOffAt)}
              {signedBy ? ` · ${signedBy.name}` : ""}
            </p>
          )}
          {slot.status === "pending" && (
            <p className="mt-2 text-sm">
              Waiting on {supervisor?.name ?? "the Employee Supervisor"}
              {slot.requestedAt ? ` since ${formatDate(slot.requestedAt)}` : ""}.
            </p>
          )}
          {returned && slot.supervisorComment && (
            <p className="mt-2 text-sm">
              <span className="font-medium">{supervisor?.name} sent this back. </span>
              {slot.supervisorComment}
            </p>
          )}
          {slot.status === "not_started" && <p className="mt-2 text-sm text-[#5e584f]">No one has started this yet.</p>}
          {slot.status === "in_training" && !returned && (
            <p className="mt-2 text-sm text-[#5e584f]">
              In training{slot.startedAt ? ` since ${formatDate(slot.startedAt)}` : ""}.
            </p>
          )}
        </div>

        {self && slot.status !== "signed_off" && slot.status !== "pending" && (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="know-note">
              Note for your supervisor <span className="font-normal text-[#8a847a]">optional</span>
            </label>
            <Textarea
              id="know-note"
              data-testid="know-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What did you run, and who watched?"
              className="min-h-20 bg-white"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                data-testid="know-this"
                className="h-11 flex-1"
                onClick={() => {
                  requestSignoff(employeeId, itemId, pressId, note);
                  toast.success(`Sent to ${supervisor?.name ?? "your supervisor"} for sign-off.`);
                  onDone();
                }}
              >
                I know this
              </Button>
              {slot.status === "not_started" && (
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => {
                    startTraining(employeeId, itemId, pressId);
                    toast("Marked in training.");
                  }}
                >
                  Start training
                </Button>
              )}
            </div>
          </div>
        )}

        {canSupervise && slot.status === "pending" && (
          <div className="space-y-2">
            {slot.employeeNote && (
              <blockquote className="border-l-2 border-selmax pl-3 text-sm leading-relaxed">“{slot.employeeNote}”</blockquote>
            )}
            {sendingBack ? (
              <>
                <label className="text-sm font-medium" htmlFor="send-back">
                  What still needs work?
                </label>
                <Textarea
                  id="send-back"
                  data-testid="send-back-note"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tell them what to redo before you sign off."
                  className="min-h-20 bg-white"
                />
                <div className="flex gap-2">
                  <Button
                    data-testid="confirm-send-back"
                    className="h-11 flex-1 bg-selmax text-white hover:bg-[#c4253d]"
                    disabled={!comment.trim()}
                    onClick={() => {
                      sendBack(employeeId, itemId, pressId, comment);
                      toast.success(`Sent back to ${employee.firstName}.`);
                      onDone();
                    }}
                  >
                    Send back
                  </Button>
                  <Button variant="outline" className="h-11" onClick={() => setSendingBack(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  data-testid="sign-off"
                  className="h-11 flex-1 bg-[#1f7a4d] text-white hover:bg-[#19663f]"
                  onClick={() => {
                    approve(employeeId, itemId, pressId);
                    toast.success(`Signed off for ${employee.firstName}.`);
                    onDone();
                  }}
                >
                  Sign off
                </Button>
                <Button data-testid="send-back" variant="outline" className="h-11" onClick={() => setSendingBack(true)}>
                  Send back
                </Button>
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium">History</h3>
          {history.length === 0 ? (
            <p className="mt-1 text-sm text-[#8a847a]">Nothing recorded yet.</p>
          ) : (
            <ol className="mt-2 space-y-3 border-l border-[#e2dcd2] pl-3" data-testid="history">
              {history.map((entry) => {
                const actor = getPerson(entry.actorId);
                return (
                  <li key={entry.id}>
                    <p className="text-sm font-medium">{actionLabel(entry.action)}</p>
                    <p className="text-xs text-[#5e584f]">
                      {actor?.name ?? "Someone"} · {formatDateTime(entry.at)}
                    </p>
                    {entry.note && <p className="mt-1 text-sm leading-relaxed text-[#3f3a34]">“{entry.note}”</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}

function chipClass(status: SlotStatus, returned: boolean) {
  if (returned) return "border-[#f3c2ce] bg-[#fde8ee] text-[#9f1239]";
  if (status === "signed_off") return "border-[#b7dfc8] bg-[#e5f4ec] text-[#1f7a4d]";
  if (status === "pending") return "border-[#c5d7ee] bg-[#e7f0fa] text-[#1d4e89]";
  if (status === "in_training") return "border-[#f0d7a4] bg-[#fff4e0] text-[#8a5a00]";
  return "border-[#e2dcd2] bg-white text-[#5e584f]";
}

function actionLabel(action: Slot["history"][number]["action"]) {
  if (action === "started") return "Started training";
  if (action === "requested") return "Said they are ready";
  if (action === "signed_off") return "Signed off";
  return "Sent back";
}

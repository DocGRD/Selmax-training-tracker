"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "./auth";
import { getItem, getPerson, slotKey } from "./catalog";
import { seedState } from "./seed";
import type { DemoState, Notice, Person, PlanMeta, Slot } from "./types";

const STATE_KEY = "selmax-training-demo-v1";

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed?.slots || !parsed.notices || !parsed.plan) return seedState();
    return parsed;
  } catch {
    return seedState();
  }
}

function persist(state: DemoState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function targetLabel(itemName: string, pressId: string | null) {
  return pressId ? `${itemName} · Press ${pressId}` : itemName;
}

interface StoreValue {
  ready: boolean;
  user: Person | null;
  slots: Record<string, Slot>;
  notices: Notice[];
  plan: PlanMeta;
  signIn: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
  reset: () => void;
  startTraining: (employeeId: string, itemId: string, pressId: string | null) => void;
  requestSignoff: (employeeId: string, itemId: string, pressId: string | null, note: string) => void;
  approve: (employeeId: string, itemId: string, pressId: string | null) => void;
  sendBack: (employeeId: string, itemId: string, pressId: string | null, comment: string) => void;
  markNoticeRead: (noticeId: string) => void;
  updatePlan: (patch: Partial<PlanMeta>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [state, setState] = useState<DemoState>({ slots: {}, notices: [], plan: { risks: "no", riskNote: "", actions: "" } });

  useEffect(() => {
    setState(loadState());
    setUserId(auth.getSession()?.userId ?? null);
    setReady(true);
  }, []);

  const commit = (next: DemoState) => {
    setState(next);
    persist(next);
  };

  const value = useMemo<StoreValue>(() => {
    const user = userId ? getPerson(userId) ?? null : null;

    const mutateSlot = (
      employeeId: string,
      itemId: string,
      pressId: string | null,
      recipe: (current: Slot | undefined) => { slot: Slot; notice?: Notice; resolve?: Notice["resolved"] } | null,
    ) => {
      const key = slotKey(employeeId, itemId, pressId);
      const result = recipe(state.slots[key]);
      if (!result) return;
      const notices = state.notices.map((notice) => {
        if (
          result.resolve &&
          notice.kind === "request" &&
          !notice.resolved &&
          notice.employeeId === employeeId &&
          notice.itemId === itemId &&
          notice.pressId === pressId
        ) {
          return {
            ...notice,
            read: true,
            resolved: result.resolve,
            resolvedAt: result.slot.history[result.slot.history.length - 1]?.at,
            resolvedBy: user?.id,
            resolutionNote: result.slot.supervisorComment,
          };
        }
        return notice;
      });
      if (result.notice) notices.unshift(result.notice);
      commit({ ...state, slots: { ...state.slots, [key]: result.slot }, notices });
    };

    return {
      ready,
      user,
      slots: state.slots,
      notices: state.notices,
      plan: state.plan,
      async signIn(nextUserId: string) {
        await auth.signIn(nextUserId);
        setUserId(nextUserId);
      },
      async signOut() {
        await auth.signOut();
        setUserId(null);
      },
      reset() {
        const fresh = seedState();
        commit(fresh);
      },
      startTraining(employeeId, itemId, pressId) {
        if (!user || user.id !== employeeId) return;
        const current = state.slots[slotKey(employeeId, itemId, pressId)];
        if (current && current.status !== "not_started") return;
        const at = new Date().toISOString();
        const slot: Slot = {
          status: "in_training",
          startedAt: at,
          history: [...(current?.history ?? []), { id: uid("evt"), at, actorId: user.id, action: "started" }],
        };
        commit({ ...state, slots: { ...state.slots, [slotKey(employeeId, itemId, pressId)]: slot } });
      },
      requestSignoff(employeeId, itemId, pressId, note) {
        if (!user || user.id !== employeeId) return;
        const person = getPerson(employeeId);
        const item = getItem(itemId);
        if (!person?.supervisorId || !item) return;
        const current = state.slots[slotKey(employeeId, itemId, pressId)];
        if (current?.status === "pending" || current?.status === "signed_off") return;
        const at = new Date().toISOString();
        const trimmed = note.trim();
        const slot: Slot = {
          status: "pending",
          startedAt: current?.startedAt ?? at,
          requestedAt: at,
          employeeNote: trimmed || undefined,
          supervisorComment: current?.supervisorComment,
          history: [
            ...(current?.history ?? []),
            ...(current?.startedAt ? [] : [{ id: uid("evt"), at, actorId: user.id, action: "started" as const }]),
            { id: uid("evt"), at, actorId: user.id, action: "requested" as const, note: trimmed || undefined },
          ],
        };
        const where = targetLabel(item.name, pressId);
        const notice: Notice = {
          id: uid("ntc"),
          kind: "request",
          toId: person.supervisorId,
          fromId: user.id,
          employeeId,
          itemId,
          pressId,
          subject: `Sign-off requested — ${where}`,
          preview: trimmed || `${person.name} says this is ready for sign-off.`,
          note: trimmed || undefined,
          createdAt: at,
          read: false,
        };
        commit({
          ...state,
          slots: { ...state.slots, [slotKey(employeeId, itemId, pressId)]: slot },
          notices: [notice, ...state.notices],
        });
      },
      approve(employeeId, itemId, pressId) {
        if (!user || user.role !== "supervisor") return;
        mutateSlot(employeeId, itemId, pressId, (current) => {
          if (!current || current.status !== "pending") return null;
          const item = getItem(itemId);
          const person = getPerson(employeeId);
          if (!item || !person) return null;
          const at = new Date().toISOString();
          const slot: Slot = {
            ...current,
            status: "signed_off",
            signedOffAt: at,
            signedOffBy: user.id,
            history: [...current.history, { id: uid("evt"), at, actorId: user.id, action: "signed_off" }],
          };
          const where = targetLabel(item.name, pressId);
          const notice: Notice = {
            id: uid("ntc"),
            kind: "approved",
            toId: employeeId,
            fromId: user.id,
            employeeId,
            itemId,
            pressId,
            subject: `Signed off — ${where}`,
            preview: `${user.name} signed this off on ${new Date(at).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" })}.`,
            createdAt: at,
            read: false,
          };
          return { slot, notice, resolve: "approved" };
        });
      },
      sendBack(employeeId, itemId, pressId, comment) {
        if (!user || user.role !== "supervisor") return;
        const trimmed = comment.trim();
        if (!trimmed) return;
        mutateSlot(employeeId, itemId, pressId, (current) => {
          if (!current || current.status !== "pending") return null;
          const item = getItem(itemId);
          if (!item) return null;
          const at = new Date().toISOString();
          const slot: Slot = {
            ...current,
            status: "in_training",
            supervisorComment: trimmed,
            signedOffAt: undefined,
            signedOffBy: undefined,
            history: [...current.history, { id: uid("evt"), at, actorId: user.id, action: "returned", note: trimmed }],
          };
          const where = targetLabel(item.name, pressId);
          const notice: Notice = {
            id: uid("ntc"),
            kind: "returned",
            toId: employeeId,
            fromId: user.id,
            employeeId,
            itemId,
            pressId,
            subject: `Sent back — ${where}`,
            preview: trimmed,
            note: trimmed,
            createdAt: at,
            read: false,
          };
          return { slot, notice, resolve: "returned" };
        });
      },
      markNoticeRead(noticeId: string) {
        commit({
          ...state,
          notices: state.notices.map((notice) => (notice.id === noticeId ? { ...notice, read: true } : notice)),
        });
      },
      updatePlan(patch: Partial<PlanMeta>) {
        if (!user || user.role !== "supervisor") return;
        commit({ ...state, plan: { ...state.plan, ...patch } });
      },
    };
  }, [ready, state, userId]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

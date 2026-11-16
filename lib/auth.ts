import { getPerson } from "./catalog";
import type { Session } from "./types";

/**
 * Auth seam for the demo.
 *
 * The app talks to this adapter only. Swap `auth` for `createSupabaseAuthAdapter()`
 * in this file when real sign-in is ready. Training records stay behind the store
 * (`lib/store.tsx`); those writes would move to Supabase tables with the same
 * actions: start, request sign-off, approve, send back.
 */
export interface AuthAdapter {
  getSession(): Session | null;
  signIn(userId: string): Promise<Session>;
  signOut(): Promise<void>;
}

const SESSION_KEY = "selmax-training-session-v1";

export const demoAuth: AuthAdapter = {
  getSession() {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      if (!session.userId || !getPerson(session.userId)) return null;
      return session;
    } catch {
      return null;
    }
  },
  async signIn(userId: string) {
    if (!getPerson(userId)) throw new Error("That person is not in the demo crew.");
    const session = { userId };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
  async signOut() {
    localStorage.removeItem(SESSION_KEY);
  },
};

/**
 * Drop-in shape for Supabase Auth. Not wired, and not called by the demo.
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Suggested tables (row level security on):
 *   profiles        id = auth.users.id, role, position, shift, supervisor_id
 *   training_slots  employee_id, item_id, press_id, status, notes, signed_off_at, signed_off_by
 *   training_events slot key, actor_id, action, note, at
 *   notices         to_id, kind, payload, read_at
 *
 * Policies to aim for:
 *   An employee can read their own slots and can move a slot to "pending".
 *   Their Employee Supervisor can read the team and can sign off or send back.
 *   Nobody else writes a sign-off. The supervisor's name and the date come from the session.
 */
export function createSupabaseAuthAdapter(): AuthAdapter {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return {
    getSession() {
      return null;
    },
    async signIn() {
      throw new Error("Connect supabase.auth.signInWithPassword or the company SSO here.");
    },
    async signOut() {
      throw new Error("Connect supabase.auth.signOut here.");
    },
  };
}

export const auth: AuthAdapter = demoAuth;

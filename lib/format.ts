import { getPress } from "./catalog";
import type { Press } from "./types";

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRelative(iso: string, now = Date.now()) {
  const delta = now - new Date(iso).getTime();
  const min = Math.round(delta / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return hr === 1 ? "1 hr ago" : `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 14) return `${day} days ago`;
  return formatDate(iso);
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function pressLine(pressId: string | null) {
  if (!pressId) return null;
  const press = getPress(pressId);
  if (!press) return pressId;
  return press.detail ? `${press.name} · ${press.detail}` : `Press ${press.name}`;
}

export function pressShort(press: Press) {
  return press.name;
}

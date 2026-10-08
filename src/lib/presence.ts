// A user counts as online only if their app sent a heartbeat recently.
export const ONLINE_WINDOW_MS = 75_000;
export function isActuallyOnline(p?: { is_online?: boolean | null; last_seen?: string | null } | null) {
  if (!p?.is_online || !p.last_seen) return false;
  return Date.now() - new Date(p.last_seen).getTime() < ONLINE_WINDOW_MS;
}

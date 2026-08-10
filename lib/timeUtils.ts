/**
 * The backend stores timestamps with Python's datetime.utcnow(), which
 * produces a naive datetime with NO timezone marker when serialized
 * (e.g. "2026-08-09T19:22:54" instead of "...19:22:54Z"). JavaScript's
 * Date constructor treats a timestamp with no timezone marker as LOCAL
 * time, not UTC — so in Nigeria (UTC+1) every timestamp gets parsed as
 * if it were 1 hour later than it actually is. That's why messages,
 * notifications, and "posted X ago" displays were showing wrong values
 * like a constant "1h ago" even for messages sent seconds earlier.
 *
 * This safely normalizes any timestamp string coming from the backend
 * before handing it to `new Date()`, without touching how the backend
 * stores or sorts dates at all (zero risk to existing data/queries —
 * this is a display-layer-only fix).
 */
export function parseServerDate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  // Already has a timezone marker (Z, or +HH:MM / -HH:MM after the time)?
  // Matches e.g. "...19:22:54Z" or "...19:22:54+01:00" or "...19:22:54-05:00"
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(iso);
  const normalized = hasTimezone ? iso : iso + "Z";
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/** Short relative time for compact UI ("now", "5m", "3h", "2d", or a date for older). */
export function timeAgoShort(iso: string | undefined | null): string {
  const d = parseServerDate(iso);
  if (!d) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  if (mins < 43200) return `${Math.floor(mins / 1440)}d`;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

/** Longer relative time for readable UI ("just now", "5 minutes ago", "3 hours ago", "2 days ago", or a date for older). */
export function timeAgoLong(iso: string | undefined | null): string {
  const d = parseServerDate(iso);
  if (!d) return "";
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 45) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/** Full readable date/time, e.g. "2:30 PM, 9 Aug" — for message bubbles etc. */
export function fmtFullDate(iso: string | undefined | null): string {
  const d = parseServerDate(iso);
  if (!d) return "";
  return d.toLocaleString("en-NG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
}

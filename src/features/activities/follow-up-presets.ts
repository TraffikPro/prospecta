export const FOLLOW_UP_PRESETS = [
  { id: "today-18", label: "Hoje 18:00" },
  { id: "tomorrow-10", label: "Amanhã 10:00" },
  { id: "plus-2d-10", label: "Em 2 dias 10:00" },
] as const;

export type FollowUpPresetId = (typeof FOLLOW_UP_PRESETS)[number]["id"];

function atLocalTime(base: Date, hours: number, minutes: number): Date {
  const next = new Date(base.getTime());
  next.setHours(hours, minutes, 0, 0);
  return next;
}

/** UI-only datetime for the activity form. Does not change follow-up rules. */
export function followUpPresetDate(
  id: FollowUpPresetId,
  now: Date = new Date(),
): Date {
  switch (id) {
    case "today-18":
      return atLocalTime(now, 18, 0);
    case "tomorrow-10": {
      const next = atLocalTime(now, 10, 0);
      next.setDate(next.getDate() + 1);
      return next;
    }
    case "plus-2d-10": {
      const next = atLocalTime(now, 10, 0);
      next.setDate(next.getDate() + 2);
      return next;
    }
  }
}

/**
 * Presentation guard: never silently replace a past "Hoje 18:00" with tomorrow.
 * Callers should disable the control and show an explicit reason.
 */
export function isFollowUpPresetAvailable(
  id: FollowUpPresetId,
  now: Date = new Date(),
): boolean {
  return followUpPresetDate(id, now).getTime() > now.getTime();
}

export function followUpPresetUnavailableReason(
  id: FollowUpPresetId,
  now: Date = new Date(),
): string | null {
  if (isFollowUpPresetAvailable(id, now)) {
    return null;
  }
  if (id === "today-18") {
    return "Horário de hoje já passou";
  }
  return "Horário indisponível";
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

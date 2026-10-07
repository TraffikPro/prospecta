function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function relativeFollowUpLabel(
  value: Date,
  now: Date = new Date(),
): string | null {
  const dayMs = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round(
    (startOfLocalDay(value).getTime() - startOfLocalDay(now).getTime()) /
      dayMs,
  );
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

  if (dayDiff === 0) return `Hoje ${time}`;
  if (dayDiff === 1) return `Amanhã ${time}`;
  if (dayDiff === -1) return `Ontem ${time}`;
  if (dayDiff < 0) {
    const days = Math.abs(dayDiff);
    return days === 1 ? "1 dia atrás" : `${days} dias atrás`;
  }
  if (dayDiff <= 7) {
    return dayDiff === 1 ? "Em 1 dia" : `Em ${dayDiff} dias`;
  }
  return null;
}

export function formatQueueFollowUp(
  value: Date | null,
  now: Date = new Date(),
): string {
  if (!value) {
    return "Sem follow-up";
  }

  const absoluteDate = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(value);
  const relative = relativeFollowUpLabel(value, now);
  if (relative) {
    return `${relative} · ${absoluteDate}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

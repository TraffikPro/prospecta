/** Operational week helpers — wall clock America/Sao_Paulo, storage UTC. */

export const PORTFOLIO_TIME_ZONE = "America/Sao_Paulo";

type SpParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function spParts(date: Date): SpParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: PORTFOLIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Approximate UTC instant for a São Paulo local wall time (handles -03/-02 via probe). */
export function zonedSaoPauloToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  ms?: number;
}): Date {
  const hour = input.hour ?? 0;
  const minute = input.minute ?? 0;
  const second = input.second ?? 0;
  const ms = input.ms ?? 0;
  // First guess: SP is UTC-3
  let utc = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    hour + 3,
    minute,
    second,
    ms,
  );
  for (let i = 0; i < 3; i += 1) {
    const got = spParts(new Date(utc));
    const wantMin =
      input.year * 1e8 +
      input.month * 1e6 +
      input.day * 1e4 +
      hour * 100 +
      minute;
    const gotMin =
      got.year * 1e8 +
      got.month * 1e6 +
      got.day * 1e4 +
      got.hour * 100 +
      got.minute;
    const deltaMin = wantMin - gotMin;
    if (deltaMin === 0 && got.second === second) {
      return new Date(utc);
    }
    utc += deltaMin * 60_000 + (second - got.second) * 1000;
  }
  return new Date(utc);
}

function weekdayMonday0(year: number, month: number, day: number): number {
  // JS: 0=Sun…6=Sat → Monday=0
  const utcNoon = Date.UTC(year, month - 1, day, 12, 0, 0);
  const js = new Date(utcNoon).getUTCDay();
  return (js + 6) % 7;
}

export type OperationalWeek = {
  weekStartAt: Date;
  weekEndAt: Date;
};

export function isOperationalWeekExpired(
  weekEndAt: Date,
  now: Date = new Date(),
): boolean {
  return weekEndAt.getTime() < now.getTime();
}

export function isSameWeekStart(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

/** Monday 00:00:00.000 SP → Sunday 23:59:59.999 SP, as UTC instants. */
export function getOperationalWeek(now: Date = new Date()): OperationalWeek {
  const parts = spParts(now);
  const monOffset = weekdayMonday0(parts.year, parts.month, parts.day);
  const mondayUtcNoon = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day - monOffset,
    12,
    0,
    0,
  );
  const mondaySp = spParts(new Date(mondayUtcNoon));
  const weekStartAt = zonedSaoPauloToUtc({
    year: mondaySp.year,
    month: mondaySp.month,
    day: mondaySp.day,
    hour: 0,
    minute: 0,
    second: 0,
    ms: 0,
  });
  const sundayUtcNoon = mondayUtcNoon + 6 * 24 * 60 * 60 * 1000;
  const sundaySp = spParts(new Date(sundayUtcNoon));
  const weekEndAt = zonedSaoPauloToUtc({
    year: sundaySp.year,
    month: sundaySp.month,
    day: sundaySp.day,
    hour: 23,
    minute: 59,
    second: 59,
    ms: 999,
  });
  return { weekStartAt, weekEndAt };
}

export function formatWeekRangePtBr(week: OperationalWeek): string {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: PORTFOLIO_TIME_ZONE,
    day: "2-digit",
    month: "short",
  });
  return `${fmt.format(week.weekStartAt)} – ${fmt.format(week.weekEndAt)}`;
}

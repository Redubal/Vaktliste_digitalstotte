export type IsoWeek = { year: number; week: number };

const DAY_MS = 86_400_000;

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfIsoWeek(date: Date): Date {
  // Monday = 0..Sunday = 6 shift
  const d = new Date(date.getTime());
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function isoWeek(date: Date): IsoWeek {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Move to the Thursday of the current ISO week — its year is the ISO year.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return { year, week };
}

export function isoWeekToMonday(year: number, week: number): Date {
  // 4th of January is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7; // Monday-based
  const week1Monday = new Date(jan4.getTime() - jan4Dow * DAY_MS);
  return new Date(week1Monday.getTime() + (week - 1) * 7 * DAY_MS);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

export function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7);
}

export function weekdaysMonToFri(monday: Date): Date[] {
  return [0, 1, 2, 3, 4].map((n) => addDays(monday, n));
}

const NB_MONTHS_LONG = [
  "januar",
  "februar",
  "mars",
  "april",
  "mai",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "desember",
];

const NB_MONTHS_SHORT = [
  "jan.",
  "feb.",
  "mars",
  "apr.",
  "mai",
  "juni",
  "juli",
  "aug.",
  "sep.",
  "okt.",
  "nov.",
  "des.",
];

const NB_DAYS_SHORT = ["man.", "tir.", "ons.", "tor.", "fre.", "lør.", "søn."];

export function formatDayShort(date: Date): string {
  const dow = (date.getUTCDay() + 6) % 7; // mon=0
  return NB_DAYS_SHORT[dow];
}

export function formatDayNumber(date: Date): string {
  return `${date.getUTCDate()}. ${NB_MONTHS_SHORT[date.getUTCMonth()]}`;
}

export function formatMonthName(aar: number, maaned: number): string {
  return `${NB_MONTHS_LONG[maaned - 1]} ${aar}`;
}

export function formatWeekRange(monday: Date): string {
  const friday = addDays(monday, 4);
  const sameMonth = monday.getUTCMonth() === friday.getUTCMonth();
  const sameYear = monday.getUTCFullYear() === friday.getUTCFullYear();
  if (sameMonth) {
    return `${monday.getUTCDate()}.–${friday.getUTCDate()}. ${NB_MONTHS_LONG[monday.getUTCMonth()]} ${friday.getUTCFullYear()}`;
  }
  if (sameYear) {
    return `${monday.getUTCDate()}. ${NB_MONTHS_SHORT[monday.getUTCMonth()]} – ${friday.getUTCDate()}. ${NB_MONTHS_SHORT[friday.getUTCMonth()]} ${friday.getUTCFullYear()}`;
  }
  return `${monday.getUTCDate()}. ${NB_MONTHS_SHORT[monday.getUTCMonth()]} ${monday.getUTCFullYear()} – ${friday.getUTCDate()}. ${NB_MONTHS_SHORT[friday.getUTCMonth()]} ${friday.getUTCFullYear()}`;
}

export function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

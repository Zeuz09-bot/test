import { format, subDays, addDays, parseISO, isValid } from 'date-fns';

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getPreviousDayDateString(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return format(subDays(date, 1), 'yyyy-MM-dd');
}

export function getNextDayDateString(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return format(addDays(date, 1), 'yyyy-MM-dd');
}

export function isValidIsoString(isoStr: string): boolean {
  const parsed = parseISO(isoStr);
  return isValid(parsed);
}
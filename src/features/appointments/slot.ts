import { createFormatters } from '../../i18n/format';
import type { PatientAppointment } from '../../types/models';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Explicit formatting context. Pure callers pass it in rather than relying on
 * the machine's locale or zone; omitting it keeps the browser default, which
 * is the documented fallback when no user preference exists. */
export interface SlotFormatOptions {
  locale?: string;
  timeZone?: string;
}

function slotStart(appointment: PatientAppointment): number {
  return new Date(appointment.availabilitySlot.startTime).getTime();
}

/** Slot times come from Postgres as instants; a visit "on the day" is about
 * the local calendar day the patient is living, not a UTC midnight. */
function isSameLocalDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** `YYYY-MM-DD` in `timeZone` (the browser zone when none is given). */
function dayKey(date: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

function isSameDayInZone(a: Date, b: Date, timeZone?: string): boolean {
  const keyA = dayKey(a, timeZone);
  return keyA !== '' && keyA === dayKey(b, timeZone);
}

export function isOnSlotDay(appointment: PatientAppointment, now: Date): boolean {
  const start = slotStart(appointment);
  return !Number.isNaN(start) && isSameLocalDay(start, now.getTime());
}

/** Live updates only make sense for a visit that is happening today and has
 * not already been settled — a past or cancelled appointment must not keep
 * a poll running. */
export function shouldPollQueue(appointment: PatientAppointment, now: Date): boolean {
  return appointment.status === 'scheduled' && isOnSlotDay(appointment, now);
}

/** The hub shows a visit while it is still ahead of you (or happening today);
 * anything older drops out on its own without a server-side filter. */
export function isUpcoming(appointment: PatientAppointment, now: Date): boolean {
  const start = slotStart(appointment);
  if (Number.isNaN(start)) return false;
  return appointment.status === 'scheduled' && (start >= now.getTime() || isSameLocalDay(start, now.getTime()));
}

/** 24-hour start time in the caller's zone, never a made-up one. */
export function formatSlotTime(iso: string, options: SlotFormatOptions = {}): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return createFormatters(options.locale, options.timeZone).formatTime(iso, { hourCycle: 'h23' });
}

export function formatSlotDate(
  iso: string,
  now: Date = new Date(),
  options: SlotFormatOptions = {},
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (isSameDayInZone(date, now, options.timeZone)) return 'today';
  const tomorrow = new Date(now.getTime() + DAY_MS);
  if (isSameDayInZone(date, tomorrow, options.timeZone)) return 'tomorrow';
  return createFormatters(options.locale, options.timeZone).formatDate(iso);
}

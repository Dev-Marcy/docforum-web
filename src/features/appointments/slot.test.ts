import { describe, expect, it } from 'vitest';
import { formatSlotDate, formatSlotTime, isOnSlotDay, isUpcoming, shouldPollQueue } from './slot';
import type { PatientAppointment } from '../../types/models';

/** Local-time builders, so nothing in these assertions depends on the TZ the
 * suite happens to run in. */
function local(dayOffset: number, hour: number, minute = 0): string {
  const base = new Date(2026, 9, 16, 9, 0, 0);
  base.setDate(base.getDate() + dayOffset);
  base.setHours(hour, minute, 0, 0);
  return base.toISOString();
}

const TODAY = new Date(2026, 9, 16, 12, 0, 0);

function appointment(overrides: Partial<PatientAppointment> = {}): PatientAppointment {
  return {
    id: 'apt-1',
    patientProfileId: 'pp-1',
    doctorProfileId: 'dp-1',
    availabilitySlotId: 'slot-1',
    status: 'scheduled',
    origin: 'direct_booking',
    createdAt: local(-3, 9),
    updatedAt: local(-3, 9),
    availabilitySlot: {
      id: 'slot-1',
      doctorProfileId: 'dp-1',
      status: 'booked',
      startTime: local(0, 14, 30),
      endTime: local(0, 15),
      createdAt: local(-10, 9),
      updatedAt: local(-10, 9),
    },
    ...overrides,
  };
}

function withSlot(overrides: Partial<PatientAppointment['availabilitySlot']>): PatientAppointment {
  const base = appointment();
  return { ...base, availabilitySlot: { ...base.availabilitySlot, ...overrides } };
}

describe('slot day maths', () => {
  it('recognises the day of the visit', () => {
    expect(isOnSlotDay(appointment(), TODAY)).toBe(true);
    expect(isOnSlotDay(withSlot({ startTime: local(1, 9) }), TODAY)).toBe(false);
  });

  it('treats a slot near midnight as still being that local day', () => {
    expect(isOnSlotDay(withSlot({ startTime: local(0, 0, 5) }), TODAY)).toBe(true);
    expect(isOnSlotDay(withSlot({ startTime: local(0, 23, 45) }), TODAY)).toBe(true);
  });

  it('polls only a scheduled visit happening today', () => {
    expect(shouldPollQueue(appointment(), TODAY)).toBe(true);
    expect(shouldPollQueue(withSlot({ startTime: local(1, 9) }), TODAY)).toBe(false);
    expect(shouldPollQueue(appointment({ status: 'completed' }), TODAY)).toBe(false);
    expect(shouldPollQueue(appointment({ status: 'cancelled' }), TODAY)).toBe(false);
  });

  it('keeps a future visit upcoming and drops a past one', () => {
    expect(isUpcoming(withSlot({ startTime: local(5, 9) }), TODAY)).toBe(true);
    expect(isUpcoming(appointment(), TODAY)).toBe(true);
    expect(isUpcoming(withSlot({ startTime: local(-1, 9) }), TODAY)).toBe(false);
    expect(isUpcoming(appointment({ status: 'cancelled' }), TODAY)).toBe(false);
  });

  it('labels the day in the words a patient would use', () => {
    expect(formatSlotDate(local(0, 9), TODAY)).toBe('today');
    expect(formatSlotDate(local(1, 9), TODAY)).toBe('tomorrow');
    expect(formatSlotDate(local(4, 9), TODAY)).toMatch(/2026/);
  });

  it('prints a 24-hour start time and never a made-up one', () => {
    expect(formatSlotTime(local(0, 9, 5))).toBe('09:05');
    expect(formatSlotTime('not-a-date')).toBe('not-a-date');
  });
});

describe('slot formatting with explicit context', () => {
  // 23:30 UTC is already the next morning in Tokyo — the case that used to
  // make a shared timestamp depend on the machine's zone.
  const SLOT = '2026-10-16T23:30:00.000Z';

  it('renders the instant in the requested zone', () => {
    expect(formatSlotTime(SLOT, { timeZone: 'UTC' })).toBe('23:30');
    expect(formatSlotTime(SLOT, { timeZone: 'Asia/Tokyo' })).toBe('08:30');
  });

  it('resolves today in the requested zone', () => {
    const now = new Date('2026-10-16T22:00:00.000Z');
    expect(formatSlotDate(SLOT, now, { timeZone: 'UTC', locale: 'en-US' })).toBe('today');

    // Ten hours later the UTC day has moved on, but the visit is still today
    // for a reader in Tokyo — the label must follow the reader's zone.
    const nextMorning = new Date('2026-10-17T10:00:00.000Z');
    expect(formatSlotDate(SLOT, nextMorning, { timeZone: 'UTC', locale: 'en-US' })).toBe(
      'Oct 16, 2026',
    );
    expect(formatSlotDate(SLOT, nextMorning, { timeZone: 'Asia/Tokyo', locale: 'en-US' })).toBe(
      'today',
    );
  });

  it('localizes the fallback date in the selected language', () => {
    const later = new Date('2026-10-01T00:00:00.000Z');
    expect(formatSlotDate(SLOT, later, { timeZone: 'UTC', locale: 'en-US' })).toBe('Oct 16, 2026');
    expect(formatSlotDate(SLOT, later, { timeZone: 'UTC', locale: 'de-DE' })).toContain('Okt');
  });
});

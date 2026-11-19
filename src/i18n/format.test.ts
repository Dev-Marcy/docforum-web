import { describe, expect, it } from 'vitest';
import {
  createFormatters,
  directionFor,
  formatCalendarWeekday,
  isRtlLocale,
  parseIso,
} from './format';

const enUS = createFormatters('en-US', 'UTC');
const enGB = createFormatters('en-GB', 'UTC');
const deDE = createFormatters('de-DE', 'UTC');

describe('locale-aware dates (#88)', () => {
  it('uses an unambiguous month name rather than numeric day/month', () => {
    expect(enUS.formatDate('2026-03-04')).toBe('Mar 4, 2026');
    expect(enGB.formatDate('2026-03-04')).toBe('4 Mar 2026');
    expect(deDE.formatDate('2026-03-04')).toContain('März');
  });

  it('formats the same instant differently per locale', () => {
    const value = '2026-03-04T10:30:00Z';
    expect(enUS.formatDate(value)).not.toBe(enGB.formatDate(value));
  });

  it('never shifts a date-only value across a time zone boundary', () => {
    // Noon UTC anchoring means this stays 4 March even in UTC-12.
    expect(enUS.formatDate('2026-03-04', { timeZone: 'Etc/GMT+12' })).toBe('Mar 4, 2026');
    expect(parseIso('2026-03-04').toISOString()).toBe('2026-03-04T12:00:00.000Z');
  });

  it('always shows an explicit time zone for appointment times', () => {
    const value = '2026-03-04T10:30:00Z';
    expect(enUS.formatAppointmentTime(value, 'UTC')).toMatch(/UTC|GMT/);
    expect(enUS.formatAppointmentTime(value, 'Europe/Berlin')).toMatch(/GMT\+1|UTC\+1|MEZ|CET/);
  });

  it('returns a dash for invalid input instead of "Invalid Date"', () => {
    expect(enUS.formatDate('not-a-date')).toBe('—');
    expect(enUS.formatDateTime('')).toBe('—');
  });

  it('formats relative time', () => {
    const now = new Date('2026-03-04T12:00:00Z');
    expect(enUS.formatRelativeTime('2026-03-03T12:00:00Z', now)).toBe('yesterday');
    expect(enUS.formatRelativeTime('2026-03-04T14:00:00Z', now)).toBe('in 2 hours');
  });
});

describe('locale-aware numbers (#88)', () => {
  it('groups numbers per locale', () => {
    expect(enUS.formatNumber(1234567.8)).toBe('1,234,567.8');
    expect(deDE.formatNumber(1234567.8)).toBe('1.234.567,8');
  });

  it('formats 0–100 rates as localized percentages', () => {
    expect(enUS.formatPercent(86.4)).toBe('86.4%');
    expect(deDE.formatPercent(86.4)).toMatch(/86,4\s*%/);
  });

  it('formats decimal strings without converting through Number', () => {
    expect(enUS.formatDecimalString('1234567.89')).toBe('1,234,567.89');
    expect(deDE.formatDecimalString('1234567.89')).toBe('1.234.567,89');
  });
});

describe('asset amounts (#88)', () => {
  it('formats stroops as XLM without losing precision', () => {
    expect(enUS.formatAssetAmount('1234567890', 'XLM', { decimals: 7 })).toBe('123.456789 XLM');
    expect(enUS.formatAssetAmount('9223372036854775807', 'XLM', { decimals: 7 })).toBe(
      '922,337,203,685.4775807 XLM',
    );
  });

  it('formats cent-denominated assets', () => {
    expect(enUS.formatAssetAmount('123456789', 'USDC', { decimals: 2 })).toBe('1,234,567.89 USDC');
  });

  it('keeps the sign and pads small amounts', () => {
    expect(enUS.formatAssetAmount('-5000000', 'XLM', { decimals: 7 })).toBe('-0.50 XLM');
    expect(enUS.formatAssetAmount('0', 'XLM', { decimals: 7 })).toBe('0.00 XLM');
  });

  it('never silently accepts a non-integer minor-unit string', () => {
    expect(() => enUS.formatAssetAmount('1.5', 'XLM', { decimals: 7 })).toThrow(/minor-unit/);
    expect(() => enUS.formatDecimalString('1,5')).toThrow(/decimal string/);
  });
});

describe('calendar days vs instants (#254/#255)', () => {
  it('formats the same instant in the configured zone', () => {
    const value = '2026-03-04T23:30:00Z';
    expect(enUS.formatDate(value, { timeZone: 'UTC' })).toBe('Mar 4, 2026');
    expect(enUS.formatDate(value, { timeZone: 'Asia/Tokyo' })).toBe('Mar 5, 2026');
  });

  it('never shifts a date-only value, whatever zone is asked for', () => {
    for (const timeZone of ['Pacific/Kiritimati', 'Pacific/Midway', 'UTC']) {
      expect(enUS.formatDate('2026-03-04', { timeZone })).toBe('Mar 4, 2026');
      expect(enUS.formatDateTime('2026-03-04', { timeZone })).toContain('Mar 4, 2026');
    }
  });

  it('formats a local calendar day without a zone shift', () => {
    // 00:30 on 4 March in the test machine's zone. Anchored by its own date
    // parts, so no conversion can move it.
    const day = new Date(2026, 2, 4, 0, 30);
    expect(enUS.formatCalendarDate(day)).toBe('Mar 4, 2026');
    expect(enGB.formatCalendarDate(day)).toBe('4 Mar 2026');
    expect(deDE.formatCalendarDate(day)).toContain('März');
    expect(formatCalendarWeekday(day, 'en-US')).toBe('Wed');
  });

  it('honours an explicit 24-hour clock', () => {
    expect(enUS.formatTime('2026-03-04T14:05:00Z', { timeZone: 'UTC', hourCycle: 'h23' })).toBe('14:05');
  });

  it('handles a DST transition without inventing a wall-clock hour', () => {
    // US clocks jump 02:00 → 03:00 on 8 March 2026.
    expect(
      enUS.formatTime('2026-03-08T06:30:00Z', { timeZone: 'America/New_York', hourCycle: 'h23' }),
    ).toBe('01:30');
    expect(
      enUS.formatTime('2026-03-08T07:30:00Z', { timeZone: 'America/New_York', hourCycle: 'h23' }),
    ).toBe('03:30');
  });

  it('exposes the zone the formatter is bound to', () => {
    expect(createFormatters('en-US', 'Asia/Tokyo').timeZone).toBe('Asia/Tokyo');
    expect(enUS.formatCalendarDate('not-a-date')).toBe('—');
  });
});

describe('direction (#88)', () => {
  it('detects right-to-left locales', () => {
    expect(isRtlLocale('ar-EG')).toBe(true);
    expect(isRtlLocale('he')).toBe(true);
    expect(isRtlLocale('en-US')).toBe(false);
    expect(directionFor('ar-EG')).toBe('rtl');
    expect(directionFor('de-DE')).toBe('ltr');
  });
});

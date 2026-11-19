import { describe, expect, it } from 'vitest';
import { effectiveFromDisplay, effectiveFromZoneLabel } from './effective-from';

// 23:30 UTC — already the next day in Tokyo, still the same evening in Berlin.
const VALUE = '2026-10-18T23:30:00.000Z';

describe('effectiveFromDisplay', () => {
  it("uses the facility's zone when it is configured", () => {
    const display = effectiveFromDisplay(VALUE, {
      facilityTimeZone: 'Asia/Tokyo',
      userTimeZone: 'UTC',
      locale: 'en-US',
    });

    expect(display.source).toBe('facility');
    expect(display.timeZone).toBe('Asia/Tokyo');
    expect(display.text).toBe('Oct 19, 2026, 08:30 AM');
  });

  it("falls back to the user's zone when the facility has none", () => {
    const display = effectiveFromDisplay(VALUE, {
      userTimeZone: 'Europe/Berlin',
      locale: 'en-US',
    });

    expect(display.source).toBe('user');
    expect(display.timeZone).toBe('Europe/Berlin');
    expect(display.text).toBe('Oct 19, 2026, 01:30 AM');
  });

  it('ignores an invalid facility zone rather than using it', () => {
    const display = effectiveFromDisplay(VALUE, {
      facilityTimeZone: 'Not/AZone',
      userTimeZone: 'UTC',
      locale: 'en-US',
    });

    expect(display.source).toBe('user');
    expect(display.timeZone).toBe('UTC');
    expect(display.text).toBe('Oct 18, 2026, 11:30 PM');
  });

  it('degrades to the documented UTC fallback when every zone is invalid', () => {
    const display = effectiveFromDisplay(VALUE, { userTimeZone: 'Still/NotAZone' });

    expect(display.source).toBe('user');
    expect(display.timeZone).toBe('UTC');
  });

  it('names the zone so the label can say which time it is', () => {
    const display = effectiveFromDisplay(VALUE, {
      facilityTimeZone: 'Asia/Tokyo',
      userTimeZone: 'UTC',
      locale: 'en-US',
    });

    expect(effectiveFromZoneLabel(display, VALUE, 'en-US')).toMatch(/GMT\+9|UTC\+9|JST/);
  });

  it('renders a dash for an unparseable timestamp instead of throwing', () => {
    const display = effectiveFromDisplay('not-a-date', { userTimeZone: 'UTC' });
    expect(display.text).toBe('—');
  });
});

import { createFormatters } from '../../i18n/format';
import { FALLBACK_TIME_ZONE, formatZoneName, isValidTimeZone } from '../../i18n/time-zone';

export interface EffectiveFromOptions {
  /** The facility's configured IANA zone, when the API exposes one. */
  facilityTimeZone?: string | null;
  /** The signed-in user's display zone (from `useTimeZone`). */
  userTimeZone: string;
  /** BCP 47 locale for the rendered date and zone name. */
  locale?: string;
}

export interface EffectiveFromDisplay {
  /** Localized date and time, in `timeZone`. */
  text: string;
  /** The zone the value was rendered in. */
  timeZone: string;
  /** Which preference supplied `timeZone`, for the visible label. */
  source: 'facility' | 'user';
}

/**
 * A price's `effectiveFrom` is an instant, so it must be shown in a zone the
 * reader knows about. Facility configuration wins when it is valid; otherwise
 * the user's display zone is used. Neither falls through to the browser's
 * system zone silently — an invalid facility zone is ignored, and an invalid
 * user zone degrades to the documented UTC fallback.
 */
export function effectiveFromDisplay(
  value: string,
  { facilityTimeZone, userTimeZone, locale }: EffectiveFromOptions,
): EffectiveFromDisplay {
  const facilityZone =
    facilityTimeZone && isValidTimeZone(facilityTimeZone) ? facilityTimeZone : null;
  const source: EffectiveFromDisplay['source'] = facilityZone ? 'facility' : 'user';
  const timeZone = facilityZone ?? (isValidTimeZone(userTimeZone) ? userTimeZone : FALLBACK_TIME_ZONE);

  const format = createFormatters(locale, timeZone);
  return {
    text: format.formatDateTime(value, { timeZone }),
    timeZone,
    source,
  };
}

/** Human-readable zone name for the label, e.g. "GMT+1" or "EDT". */
export function effectiveFromZoneLabel(
  display: EffectiveFromDisplay,
  at: string,
  locale?: string,
): string {
  return formatZoneName(display.timeZone, at, locale);
}

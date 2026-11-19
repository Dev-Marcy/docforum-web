import { useMemo } from 'react';
import { createFormatters, type Formatters } from './format';
import { useLocaleStore } from './locale-store';
import { useTimeZone } from './TimeZoneProvider';

/**
 * Formatters bound to the active locale/time zone. Components use this
 * rather than importing `toLocale*` directly so changing the locale
 * re-renders every formatted value consistently (issue #88).
 *
 * The zone comes from the user's display-zone preference (issue #110), so a
 * locale or zone change re-renders every value that used these formatters.
 */
export function useFormat(): Formatters {
  const locale = useLocaleStore((state) => state.locale);
  const { timeZone } = useTimeZone();
  return useMemo(() => createFormatters(locale, timeZone), [locale, timeZone]);
}

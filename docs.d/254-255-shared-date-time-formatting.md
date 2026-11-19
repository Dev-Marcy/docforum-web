---
file: ARCHITECTURE_ESSENTIALS.md
section: Known assumptions
---
### Date and time display (issues #254, #255)

Every displayed date or time goes through `src/i18n`: `useFormat()` in
components (bound to the selected language *and* the user's display-zone
preference), `ZonedTime`/`DualZoneTime` for rendered instants, and
`createFormatters(locale, timeZone)` inside pure functions. Direct
`toLocaleString`/`toLocaleDateString`/`toLocaleTimeString` calls are banned by
`no-restricted-syntax` in the migrated feature folders; `src/i18n` itself is
never restricted.

Two kinds of value are treated differently:

- **Instants** (appointment times, order and payment timestamps, result
  issuance) are formatted in the reader's zone and, where ambiguity matters
  (appointments), keep an explicit zone name.
- **Calendar dates** (date of birth, medication dose days, a course end, a
  chart's `YYYY-MM-DD` bucket) are formatted with `formatCalendarDate`, which
  anchors on the value's own year/month/day parts in UTC. They must never be
  pushed through a zone conversion, which is what used to move them a day.

Pure helpers take the formatting context as an explicit argument
(`{ locale, timeZone }`) rather than reading a store or a global, so their
tests stay deterministic.

Facility-owned instants (a price's `effectiveFrom`) use the facility's
configured time zone when the API exposes a valid one, otherwise the user's
display zone, and the value is labelled with the zone name and which
preference supplied it (`src/features/facility-settings/effective-from.ts`).
The API has no facility time-zone field yet, so the user-zone fallback is the
path actually exercised today.

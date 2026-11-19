Facility, payments and integrations screens now use the shared i18n
formatters too, and ESLint blocks direct `toLocale*String` calls in the
migrated feature folders ([issue #255](https://github.com/DocForum/docforum-web/issues/255)).

Migrated: payment status dates, receipts and refund deadlines, the order
payment panel timeline, wallet transaction expiry, the fulfillment queue and
facility queue timestamps, price-list effective-from values, API key and
webhook dates, webhook deliveries, the facility volume chart labels, and
closure-affected appointments.

A price's effective-from value is an instant: it is shown in the facility's
configured zone when one is available, otherwise in the user's display zone,
with the zone name and which preference supplied it shown beside the value
(`src/features/facility-settings/effective-from.ts`). No facility time-zone
field exists in the current API, so today it always falls back to the user's
zone; the helper already handles an invalid or missing facility zone without
falling through to the browser default.

`no-restricted-syntax` is scoped to the migrated folders for now — legacy
call sites remain in `src/components/PrintLayout.tsx`, `src/features/account`,
`admin-system` (number formatting), `admin-verification`, `invite`,
`messaging`, `notifications` and `orders`.

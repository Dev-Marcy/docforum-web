Patient and doctor screens now format every date and time with the shared
i18n formatters instead of calling `toLocaleDateString`/`toLocaleString`/
`toLocaleTimeString` directly ([issue #254](https://github.com/DocForum/docforum-web/issues/254)).

Migrated: today's appointments and intake times, referrals (inbox, detail,
snapshot), abnormal results, patient chart, medication schedule and
prescription sources, care hub, appointment slot labels, and doctor
verification. Timestamps render inside `<time dateTime>` and follow both the
selected language and the user's display time zone.

Calendar dates (medication days, course ends) are formatted with
`formatCalendarDate`, which anchors on the date's own parts in UTC so a zone
conversion can never move them a day. Pure helpers now take explicit
`{ locale, timeZone }` context: `buildMedicationSchedule` gained a fourth
format argument and `formatSlotTime`/`formatSlotDate` accept an options object.

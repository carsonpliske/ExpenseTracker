# Todo List: Local vs UTC Date Bug Fix

## Session Focus
User reported: adding a transaction on the 31st of a month sometimes rolled it into the 1st of the next month (visible in the pie chart / monthly totals). Root-caused and fixed a broader local-vs-UTC date mismatch, not just a month-end edge case.

## Root cause
Transactions are stored using **local** wall-clock semantics: `TransactionModal`/`EditTransactionModal` feed `addTransaction`/`editTransaction` (in `ExpenseTracker.vue`) a `YYYY-MM-DD` string from a native `<input type="date">`, which gets combined with the current local time and turned into an ISO string via `new Date(year, month-1, day, ...localTime).toISOString()`.

Several places then read that stored ISO string back using **UTC** methods (`getUTCMonth`/`getUTCFullYear`, or `.toISOString().split('T')[0]`) instead of local methods. Whenever local time-of-day + the browser's timezone offset crosses a UTC midnight boundary, the UTC calendar day differs from the local day the user actually picked. Most visible at month-end (rolls into next month), but the same class of bug existed in a few other spots.

## Fixed
- [x] `ExpenseTracker.vue` — `getTransactionsForPeriod()`'s `monthly`/`yearly` branches: removed the "includes T and Z → use UTC getters" heuristic (it was *always* true, since `.toISOString()` always produces T/Z), now always uses local getters (`getMonth()`, `getFullYear()`), matching how the date was actually constructed.
- [x] `AveragesTracker.vue` — `getDateRange()`: same UTC-heuristic removed; now strips to local calendar day (`getFullYear()`, `getMonth()`, `getDate()`).
- [x] `EditTransactionModal.vue` — pre-filling the date field on open used `.toISOString().split('T')[0]` (UTC calendar day); now builds `YYYY-MM-DD` from local getters, so editing a transaction added late at night no longer shows the wrong day in the date picker.
- [x] `AllTransactions.vue` — "Specific Date" and "Date Range" filters used the same `.toISOString().split('T')[0]` pattern to compare against local-semantics date-input values; replaced with a shared `toLocalDateString()` helper.
- [x] `npm run build` passes cleanly.

## Not changed
- The construction logic in `addTransaction`/`editTransaction` (ExpenseTracker.vue) was already correct (local semantics) — left as-is. Only the *reading* side was wrong.
- `AllTransactions.vue`'s "This Month"/"This Week" filters and month-header grouping already used local getters correctly — no change needed there.
- Existing stored transaction data is untouched; this only changes how dates already in the database are interpreted for display/filtering, which corrects historical entries too (no migration needed).

## Manual test needed (browser access unavailable this session)
- Add a transaction dated the 31st (or last day of the current month) — confirm it shows in the current month's pie chart/total, not next month.
- Edit an existing transaction — confirm the date field pre-fills with the correct day.
- In All Transactions, try "Specific Date" and "Date Range" filters near a month boundary.
- Check the Averages tab still shows sensible month/day counts.

# Todo List: Month Selector Dropdown (Home Screen)

## Session Focus
Let the user tap the "August 2026"-style month label on the home screen and pick a prior month from a dropdown, so the pie chart / totals / categories / legend for that month are shown instead of only the current month. Rolling 12-month list; resets to current month when leaving and returning to the Monthly tab. (Not in this session: the separate month-over-month comparison tab with red/green deltas — that's saved for a future session.)

## Plan

### Root cause of current limitation
`ExpenseTracker.vue`'s `getTransactionsForPeriod()` always filters the `monthly` case against `new Date()` (today), and `getCurrentPeriodLabel()` always renders today's month/year. There's no concept of "which month am I looking at" — only "what period granularity" (daily/weekly/monthly/yearly). Two child components independently reference `new Date()` too, which would show wrong data once a month becomes selectable:
- `CategoryDetailModal.vue` re-filters transactions itself using `now` for its `monthly` view, ignoring the parent's selected month.
- `SpendingInsights.vue`'s "per day this month" average divides by `now.getDate()` (days elapsed so far), which is wrong for a past month.

### Steps
1. **ExpenseTracker.vue: add viewed-month state**
   - `viewedMonth` / `viewedYear` refs, defaulting to the current month/year.
   - `showMonthDropdown` ref to toggle the dropdown.

2. **ExpenseTracker.vue: build the month list**
   - `availableMonths` computed: rolling 12 months ending at the current month (newest first), each with `{ year, month, label }`.

3. **ExpenseTracker.vue: use viewed month instead of "today"**
   - `getTransactionsForPeriod()`'s `monthly` branch compares against `viewedYear`/`viewedMonth`.
   - `getCurrentPeriodLabel()`'s `monthly` branch renders `viewedYear`/`viewedMonth`.

4. **ExpenseTracker.vue: dropdown UI**
   - Turn `.period-label` into a clickable button (only interactive in Monthly mode) with a small chevron.
   - Dropdown renders as a compact, absolutely-positioned list under the label (max-height + scroll, not full-width/full-height so it doesn't cover the whole chart), with a Vue `<transition>` for a smooth fade/scale rather than a hard cut.
   - Click-outside closes it; picking a month sets `viewedYear`/`viewedMonth`, closes the dropdown, and is visually marked as selected in the list.

5. **Reset behavior**
   - Switching the top period tab away from "Monthly" and back resets `viewedMonth`/`viewedYear` to the current month.

6. **Fix downstream components so they respect the viewed month**
   - Pass `viewedYear`/`viewedMonth` into `CategoryDetailModal.vue` so drilling into a category while viewing a past month shows that month's transactions, not today's.
   - Pass `viewedYear`/`viewedMonth` into `SpendingInsights.vue` so the "per day this month" average divides by the correct number of days for the viewed month (days elapsed if it's the current month, full days-in-month otherwise).

7. **Manual test in the running dev server**
   - Add/verify transactions across at least two different months.
   - Confirm: dropdown opens/closes smoothly, doesn't cover the entire chart, selecting a month updates chart/legend/category totals/total amount, category drill-down shows the right month, switching to another period tab and back to Monthly resets to the current month.

## Status
- [x] Step 1: viewed-month state
- [x] Step 2: available months list
- [x] Step 3: filter/label use viewed month
- [x] Step 4: dropdown UI + transition
- [x] Step 5: reset on tab switch
- [x] Step 6: fix CategoryDetailModal + SpendingInsights
- [ ] Step 7: manual test (needs user to check in browser — no browser tool available this session)

## Implementation notes
- New file: `src/components/MonthSelector.vue` — self-contained dropdown (button + transition + click-outside), used twice in `ExpenseTracker.vue` (mobile layout + desktop layout), matching the existing pattern of duplicating the PieChart/EnhancedLegend markup per layout.
- `ExpenseTracker.vue`: added `viewedMonth`/`viewedYear` refs (default to current month), `availableMonths` computed (rolling 12 months), `selectMonth` handler, and a `watch(selectedPeriod, ...)` that resets the viewed month back to current whenever the top tab leaves "Monthly".
- `getTransactionsForPeriod()`'s monthly branch and `getCurrentPeriodLabel()`'s monthly branch now use `viewedYear`/`viewedMonth` instead of always "today".
- `CategoryDetailModal.vue` and `SpendingInsights.vue` now accept `viewed-year`/`viewed-month` props so category drill-down and the "per day this month" average stay correct when viewing a past month (previously both silently used `new Date()`).
- `npm run build` passes cleanly with these changes.

## Decisions confirmed with user
- Month range: rolling 12 months (not calendar-year-only).
- Leaving/returning to Monthly tab resets to current month (doesn't remember last-picked past month).

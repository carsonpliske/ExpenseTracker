# Todo List: Month-to-Month Category Comparison Tab

## Session Focus
New tab (between "Budget Planner" and "Averages") that compares per-category spending between two chosen months, showing $ and % change with green (spent less) / red (spent more) coloring. This is the feature saved in memory from the month-selector session — now being built for real.

## Plan

### New file: `src/components/SpendingComparison.vue`
- Follows the same data-loading pattern as `AveragesTracker.vue`/`ExpenseTracker.vue`: loads all transactions via `transactionService.getAll()` and categories via the shared `baseCategoriesData` list + `customCategoryService.getAll()`.
- Two month pickers at the top, reusing the existing `MonthSelector.vue` dropdown component (already built for the home screen): "Comparing **[Month A ▾]** → **[Month B ▾]**". Both draw from the same rolling 12-month list.
- **Default on tab open**: Month A = 2 months ago, Month B = 1 month ago (last month) — both fully-completed months, per your request.
- **Summary row** at the top: total spent in Month A, total spent in Month B, overall $ and % change (same green/red rule as categories).
- **Category list** below (scrollable), one row per category that had spending in either month:
  - icon, name, Month A amount, Month B amount
  - $ change and % change, styled **green** if Month B < Month A (spending decreased), **red** if Month B > Month A (spending increased)
  - Edge cases: category had $0 in Month A but spending in Month B → labeled "New" instead of a percentage (still red, since it's new spending). Category had spending in Month A but $0 in Month B → "-100%" (green). Category with $0 in both months is left out of the list entirely.
  - Sorted by the size of the $ change (biggest swings first), so the categories most worth your attention surface at the top.

### `App.vue`
- Import and register the new component.
- Add a "Compare" nav tab between "Budget Planner" and "Averages".

### Manual test
- Open the tab, confirm it defaults to 2-months-ago vs last-month with correct totals.
- Switch both month pickers to other months and confirm the list updates.
- Check a category that only has spending in one of the two months to confirm the "New" / "-100%" edge cases render correctly.
- Check colors: overspending in red, underspending in green, matches in a neutral color.

## Status
- [x] Build `SpendingComparison.vue`
- [x] Wire into `App.vue` nav
- [x] `npm run build` passes cleanly
- [ ] Manual test (needs user to check in browser — no browser tool available this session)

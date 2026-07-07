const DAY_MS = 86_400_000

/**
 * `relativeUpdatedLabel('2026-06-27T10:00:00Z')` -> `'Updated 3 days ago'`
 * (relative to `now`, which defaults to the current time). Thresholds match
 * `docs/design/paper/pages/Admin Recipes.dc.html`'s own `relTime()`: today,
 * yesterday, N days (<7), "last week" (<14), N weeks (<30), then a full
 * date.
 */
export const relativeUpdatedLabel = (isoDate: string, now: Date = new Date()): string => {
  const updated = new Date(isoDate)
  const days = Math.round((now.getTime() - updated.getTime()) / DAY_MS)

  if (days <= 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${days} days ago`
  if (days < 14) return 'Updated last week'
  if (days < 30) return `Updated ${Math.floor(days / 7)} weeks ago`

  return `Updated ${updated.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

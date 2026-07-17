import { relativeUpdatedLabel } from './relativeTime'

const NOW = new Date('2026-07-15T12:00:00Z')

const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 86_400_000).toISOString()

describe('relativeUpdatedLabel', () => {
  it('shows "Updated today" when updated 0 days ago', () => {
    expect(relativeUpdatedLabel(daysAgo(0), NOW)).toBe('Updated today')
  })

  it('shows "Updated yesterday" when updated 1 day ago', () => {
    expect(relativeUpdatedLabel(daysAgo(1), NOW)).toBe('Updated yesterday')
  })

  it('shows "Updated N days ago" when updated 6 days ago', () => {
    expect(relativeUpdatedLabel(daysAgo(6), NOW)).toBe('Updated 6 days ago')
  })

  it('shows "Updated last week" when updated 7 days ago', () => {
    expect(relativeUpdatedLabel(daysAgo(7), NOW)).toBe('Updated last week')
  })

  it('shows "Updated last week" when updated 13 days ago', () => {
    expect(relativeUpdatedLabel(daysAgo(13), NOW)).toBe('Updated last week')
  })

  it('shows "Updated N weeks ago" when updated 14 days ago', () => {
    expect(relativeUpdatedLabel(daysAgo(14), NOW)).toBe('Updated 2 weeks ago')
  })

  it('shows "Updated N weeks ago" when updated 29 days ago', () => {
    expect(relativeUpdatedLabel(daysAgo(29), NOW)).toBe('Updated 4 weeks ago')
  })

  it('shows a full date when updated 30 or more days ago', () => {
    expect(relativeUpdatedLabel(daysAgo(30), NOW)).toBe('Updated 15 Jun 2026')
  })

  it('shows a full date matching the original update date, not the elapsed time', () => {
    expect(relativeUpdatedLabel('2026-01-15T10:00:00Z', NOW)).toBe('Updated 15 Jan 2026')
  })
})

import { pluralize } from './pluralize'

describe('pluralize', () => {
  it('uses the singular form when count is 1', () => {
    expect(pluralize(1, 'post')).toBe('1 post')
  })

  it('uses the plural form when count is 0', () => {
    expect(pluralize(0, 'post')).toBe('0 posts')
  })

  it('uses the plural form when count is greater than 1', () => {
    expect(pluralize(2, 'post')).toBe('2 posts')
  })
})

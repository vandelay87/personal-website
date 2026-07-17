import { isExternalHref } from './url'

describe('isExternalHref', () => {
  it('treats http(s) URLs as external', () => {
    expect(isExternalHref('https://example.com')).toBe(true)
  })

  it('treats mailto: links as external', () => {
    expect(isExternalHref('mailto:hello@akli.dev')).toBe(true)
  })

  it('treats tel: links as external', () => {
    expect(isExternalHref('tel:+15555555555')).toBe(true)
  })

  it('treats relative paths as internal', () => {
    expect(isExternalHref('/apps')).toBe(false)
  })
})

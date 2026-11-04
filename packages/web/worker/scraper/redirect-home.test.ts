import { describe, expect, it } from 'vitest'
import { isRedirectToOtherHomePage } from './scraper'

describe('isRedirectToOtherHomePage', () => {
  it('flags a page sent to another site home page', () => {
    expect(
      isRedirectToOtherHomePage(
        'https://www.instagram.com/p/abc123/',
        'https://www.facebook.com/',
      ),
    ).toBe(true)
  })

  it('keeps short links and same-site redirects', () => {
    expect(
      isRedirectToOtherHomePage(
        'https://t.co/abc',
        'https://example.com/article',
      ),
    ).toBe(false)
    expect(
      isRedirectToOtherHomePage(
        'https://www.example.com/old',
        'https://example.com/',
      ),
    ).toBe(false)
    expect(
      isRedirectToOtherHomePage('https://example.com/', 'https://other.com/'),
    ).toBe(false)
  })
})

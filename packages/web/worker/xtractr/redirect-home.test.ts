import { describe, expect, it, vi } from 'vitest'
import { isRedirectToOtherHomePage } from './redirect-home'

vi.mock('../url-guard', () => ({
  assertSafePublicUrl: (input: string) => new URL(input),
  assertSafePublicUrlResolved: async (input: string) => new URL(input),
  // Instagram, then facebook.com/unsupportedbrowser, ends on facebook.com
  safeFetch: async () => {
    const response = new Response('<html><title>Facebook</title></html>', {
      headers: { 'content-type': 'text/html' },
      status: 200,
    })
    Object.defineProperty(response, 'url', {
      value: 'https://www.facebook.com/',
    })
    return response
  },
}))

vi.mock('./follow-short-url', () => ({
  followShortUrl: async (urls: string[]) => ({
    unshortened_url: 'https://www.facebook.com/unsupportedbrowser',
    urls: [...urls, 'https://www.facebook.com/unsupportedbrowser'],
  }),
}))

describe('xtract', () => {
  it('fails for an Instagram post sent to facebook.com', async () => {
    const { xtract } = await import('./index')

    await expect(
      xtract('https://www.instagram.com/p/abc123/?utm_source=ig_web_copy_link'),
    ).rejects.toThrow("redirects to another site's home page")
  })
})

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
      isRedirectToOtherHomePage('https://t.co/abc', 'https://example.com/a'),
    ).toBe(false)
    expect(
      isRedirectToOtherHomePage(
        'https://www.example.com/old',
        'https://example.com/',
      ),
    ).toBe(false)
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../url-guard', () => ({
  assertSafePublicUrl: (input: string) => new URL(input),
  assertSafePublicUrlResolved: async (input: string) => new URL(input),
  // The page ends, after its redirects, on facebook.com's home page
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

describe('scrapeMetadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fails for a page sent to another site home page', async () => {
    // The HEAD request used to follow short links does not redirect
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 })),
    )
    // The Workers runtime's HTML parser, unused before the page is read
    vi.stubGlobal(
      'HTMLRewriter',
      class {
        on() {
          return this
        }
        transform(response: Response) {
          return response
        }
      },
    )
    const { scrapeMetadata } = await import('./index')

    await expect(
      scrapeMetadata('https://www.instagram.com/p/abc123/'),
    ).rejects.toThrow("redirects to another site's home page")
  })
})

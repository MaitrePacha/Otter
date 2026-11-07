import { describe, expect, it, vi } from 'vitest'
import { isTurnedAway } from './turned-away'

vi.mock('../url-guard', () => ({
  assertSafePublicUrl: (input: string) => new URL(input),
  assertSafePublicUrlResolved: async (input: string) => new URL(input),
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

describe('isTurnedAway', () => {
  it('flags pages sent to a sign-in or unsupported-browser page', () => {
    const post = 'https://www.facebook.com/share/p/abc123/'
    expect(
      isTurnedAway(post, ['https://www.facebook.com/login/?next=abc']),
    ).toBe(true)
    expect(
      isTurnedAway('https://www.instagram.com/p/abc123/', [
        'https://www.facebook.com/unsupportedbrowser',
        'https://www.facebook.com/',
      ]),
    ).toBe(true)
    expect(
      isTurnedAway('https://www.linkedin.com/posts/abc', [
        'https://www.linkedin.com/authwall',
        'https://www.linkedin.com/signup/cold-join',
      ]),
    ).toBe(true)
  })

  it('keeps a bookmarked sign-in page', () => {
    expect(
      isTurnedAway('https://example.com/login', [
        'https://example.com/login?next=%2F',
      ]),
    ).toBe(false)
  })

  it('keeps readable pages, short links and home pages', () => {
    expect(
      isTurnedAway('https://youtu.be/abc', [
        'https://www.youtube.com/watch?v=abc',
      ]),
    ).toBe(false)
    expect(
      isTurnedAway('https://example.com/a', ['https://example.com/a']),
    ).toBe(false)
    expect(isTurnedAway('https://example.com/', ['https://example.com/'])).toBe(
      false,
    )
  })
})

describe('xtract', () => {
  it('fails for an Instagram post sent to facebook.com', async () => {
    const { xtract } = await import('./index')

    await expect(
      xtract('https://www.instagram.com/p/abc123/?utm_source=ig_web_copy_link'),
    ).rejects.toThrow('needs an account')
  })
})

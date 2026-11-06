import { afterEach, describe, expect, it, vi } from 'vitest'
import { isYouTube, readYouTube } from './youtube'

const safeFetch = vi.fn()
vi.mock('../url-guard', () => ({
  safeFetch: (...args: unknown[]) => safeFetch(...args),
}))

afterEach(() => {
  safeFetch.mockReset()
})

describe('isYouTube', () => {
  it('recognises YouTube links only', () => {
    expect(isYouTube('https://youtu.be/abc')).toBe(true)
    expect(isYouTube('https://www.youtube.com/watch?v=abc')).toBe(true)
    expect(isYouTube('https://m.youtube.com/watch?v=abc')).toBe(true)
    expect(isYouTube('https://example.com/youtube')).toBe(false)
    expect(isYouTube('not a url')).toBe(false)
  })
})

describe('readYouTube', () => {
  it('gives the video title, channel and thumbnail', async () => {
    safeFetch.mockResolvedValue(
      Response.json({
        author_name: 'A channel',
        thumbnail_url: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
        title: 'A video',
      }),
    )

    const result = await readYouTube('https://youtu.be/abc?si=xyz')

    expect(safeFetch.mock.calls[0]?.[0]).toBe(
      'https://www.youtube.com/oembed?url=https%3A%2F%2Fyoutu.be%2Fabc%3Fsi%3Dxyz&format=json',
    )
    expect(result).toMatchObject({
      author: 'A channel',
      image: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
      title: 'A video',
      url: 'https://youtu.be/abc?si=xyz',
      urlType: 'video',
    })
  })

  it('gives null when YouTube does not answer', async () => {
    safeFetch.mockResolvedValue(new Response('', { status: 429 }))
    expect(await readYouTube('https://youtu.be/abc')).toBeNull()

    safeFetch.mockRejectedValue(new Error('network'))
    expect(await readYouTube('https://youtu.be/abc')).toBeNull()
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { isYouTube, readYouTube, widescreenThumbnail } from './youtube'

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
    safeFetch
      .mockResolvedValueOnce(
        Response.json({
          author_name: 'A channel',
          thumbnail_url: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
          title: 'A video',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    const result = await readYouTube('https://youtu.be/abc?si=xyz')

    expect(safeFetch.mock.calls[0]?.[0]).toBe(
      'https://www.youtube.com/oembed?url=https%3A%2F%2Fyoutu.be%2Fabc%3Fsi%3Dxyz&format=json',
    )
    expect(result).toMatchObject({
      author: 'A channel',
      image: 'https://i.ytimg.com/vi/abc/maxresdefault.jpg',
      title: 'A video',
      url: 'https://youtu.be/abc?si=xyz',
      urlType: 'video',
    })
  })

  it('falls back to the 16:9 thumbnail without a large one', async () => {
    safeFetch.mockResolvedValue(new Response(null, { status: 404 }))
    expect(
      await widescreenThumbnail('https://i.ytimg.com/vi/abc/hqdefault.jpg'),
    ).toBe('https://i.ytimg.com/vi/abc/mqdefault.jpg')
    expect(await widescreenThumbnail('https://example.com/a.jpg')).toBe(
      'https://example.com/a.jpg',
    )
  })

  it('gives null when YouTube does not answer', async () => {
    safeFetch.mockResolvedValue(new Response('', { status: 429 }))
    expect(await readYouTube('https://youtu.be/abc')).toBeNull()

    safeFetch.mockRejectedValue(new Error('network'))
    expect(await readYouTube('https://youtu.be/abc')).toBeNull()
  })
})

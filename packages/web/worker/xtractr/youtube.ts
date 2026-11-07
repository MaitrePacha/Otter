import { safeFetch } from '../url-guard'
import type { XtractResponse } from './xtract-response'

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
])

export const isYouTube = (url: string) => {
  try {
    return YOUTUBE_HOSTS.has(new URL(url).hostname)
  } catch {
    return false
  }
}

interface YouTubeOEmbed {
  title?: string
  author_name?: string
  thumbnail_url?: string
}

/**
 * Reads a YouTube video's title, channel and thumbnail from YouTube's
 * oEmbed endpoint. YouTube often refuses to serve its pages to servers
 * (429 Too Many Requests), while this endpoint answers. Returns null when
 * it does not, so the page can be read as any other.
 */
export const readYouTube = async (
  targetUrl: string,
): Promise<XtractResponse | null> => {
  try {
    const endpoint = new URL('https://www.youtube.com/oembed')
    endpoint.searchParams.set('url', targetUrl)
    endpoint.searchParams.set('format', 'json')

    const response = await safeFetch(endpoint.toString(), {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      return null
    }

    const video = (await response.json()) as YouTubeOEmbed
    if (!video.title) {
      return null
    }

    return {
      author: video.author_name ?? '',
      content: '',
      description: '',
      domain: new URL(targetUrl).hostname,
      favicon: 'https://www.youtube.com/favicon.ico',
      image: video.thumbnail_url ?? '',
      pageType: 'video',
      published: '',
      redirectUrls: [targetUrl],
      resolvedUrl: targetUrl,
      site: 'YouTube',
      source: targetUrl,
      title: video.title,
      url: targetUrl,
      urlType: 'video',
      wordCount: 0,
    }
  } catch {
    return null
  }
}

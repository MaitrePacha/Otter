import type { bookmarks } from '../../db/schema'

type BookmarkInsert = typeof bookmarks.$inferInsert

/**
 * See later holds the bookmarks not sorted yet. A bookmark saved without
 * tags goes on the list unless the caller says otherwise, and it leaves the
 * list once it gets a tag or goes to the trash.
 */
export const seeLaterOnCreate = (
  seeLater: boolean | undefined,
  tags: string[] | null | undefined,
) => seeLater ?? !tags?.length

/** The see_later change an update implies, unless it sets see_later itself */
export const seeLaterOnUpdate = (
  set: Partial<BookmarkInsert>,
): Partial<BookmarkInsert> =>
  set.seeLater === undefined && (set.tags?.length || set.status === 'inactive')
    ? { seeLater: false }
    : {}

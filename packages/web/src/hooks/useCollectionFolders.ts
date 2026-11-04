import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCollectionsTagsOptions } from '@/utils/fetching/collections'

export interface CollectionFolder {
  /** Full tag, e.g. collection:folder */
  tag: string
  /** Shown name, without the collection: folder */
  label: string
  /** Deeper tags under it, e.g. collection:folder:sub */
  children: { tag: string; label: string }[]
}

/**
 * The collection's tags as a two-level tree. `collection:folder` is a
 * folder, and `collection:folder:sub` (or deeper) a sub-folder of it; a
 * folder exists as soon as one of its sub-folders does.
 */
export const useCollectionFolders = (collection: string) => {
  const { data: collectionTags } = useSuspenseQuery(getCollectionsTagsOptions())

  return useMemo(() => {
    const tags =
      collectionTags?.find(
        (item) => item?.collection?.toLowerCase() === collection.toLowerCase(),
      )?.tags ?? []
    const folders = new Map<string, CollectionFolder>()

    for (const tag of tags) {
      const [name, folderName, ...rest] = tag.split(':')

      if (!folderName) {
        continue
      }

      const folderTag = `${name}:${folderName}`
      const folder = folders.get(folderTag.toLowerCase()) ?? {
        children: [],
        label: folderName,
        tag: folderTag,
      }

      if (rest.length) {
        folder.children.push({ label: rest.join(':'), tag })
      }
      folders.set(folderTag.toLowerCase(), folder)
    }

    return [...folders.values()]
  }, [collection, collectionTags])
}

/**
 * The tags the bookmarks are filtered by: each selected folder, or its
 * selected sub-folders when some are
 */
export const getFilterTags = (
  folders: CollectionFolder[],
  selectedFolders: string[],
  selectedTags: string[],
) =>
  folders
    .filter((folder) => selectedFolders.includes(folder.tag))
    .flatMap((folder) => {
      const children = folder.children
        .map((child) => child.tag)
        .filter((tag) => selectedTags.includes(tag))

      return children.length ? children : [folder.tag]
    })

import { FolderIcon } from '@phosphor-icons/react'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { CollectionFilters } from '@/components/CollectionFilters'
import { Feed } from '@/components/Feed'
import {
  getFilterTags,
  useCollectionFolders,
} from '@/hooks/useCollectionFolders'
import type { Bookmark } from '@/types/db'
import { apiParameters } from '@/utils/fetching/apiParameters'
import { getCollectionsInfiniteOptions } from '@/utils/fetching/collections'

export const Route = createFileRoute('/_app/collection/$collection')({
  component: Page,
  head: ({ params }) => ({
    meta: [
      {
        title: `Collection: ${params.collection}`,
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ search }),
  validateSearch: (search: Record<string, unknown>) => {
    const { offset: _, ...params } = apiParameters(search)
    const strings = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : []
    const folders = strings(search.folders)
    const tags = strings(search.tags)
    return {
      ...params,
      // Selected folders, then selected sub-folders inside them
      folders: folders.length ? folders : undefined,
      tags: tags.length ? tags : undefined,
    }
  },
})

function Page() {
  const collection = Route.useParams().collection
  const {
    folders: selectedFolders = [],
    tags: selectedTags = [],
    ...search
  } = useSearch({
    from: '/_app/collection/$collection',
  })
  const folders = useCollectionFolders(collection)
  const tags = getFilterTags(folders, selectedFolders, selectedTags)
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      getCollectionsInfiniteOptions({
        name: collection,
        params: search,
        tags: tags.length ? tags : undefined,
      }),
    )

  const items = data.pages.flatMap((page) => page.data ?? []) as Bookmark[]
  const count = data.pages[0]?.count ?? 0

  return (
    <Feed
      items={items}
      count={count}
      limit={search.limit}
      allowGroupByDate={true}
      title={collection}
      icon={<FolderIcon weight="duotone" size={24} />}
      feedType="bookmarks"
      filters={
        <CollectionFilters
          collection={collection}
          folders={folders}
          selectedFolders={selectedFolders}
          selectedTags={selectedTags}
        />
      }
      from={`/collection/${encodeURIComponent(collection)}`}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      shareConfig={{ kind: 'collection', name: collection }}
    />
  )
}

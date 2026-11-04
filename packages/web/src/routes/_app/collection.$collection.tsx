import {
  BookmarksSimpleIcon,
  FolderIcon,
  NotebookIcon,
} from '@phosphor-icons/react'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { CollectionFilters } from '@/components/CollectionFilters'
import { CollectionJournals } from '@/components/CollectionJournals'
import { Feed } from '@/components/Feed'
import { headingVariants } from '@/components/Heading'
import { IconControl } from '@/components/IconControl'
import {
  getFilterTags,
  useCollectionFolders,
} from '@/hooks/useCollectionFolders'
import type { Bookmark } from '@/types/db'
import { cn } from '@/utils/classnames'
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
      // A collection holds bookmarks and journals, one view at a time
      view: search.view === 'journals' ? ('journals' as const) : undefined,
    }
  },
})

const VIEWS = [
  {
    icon: <BookmarksSimpleIcon size={18} weight="duotone" />,
    label: 'Bookmarks',
    value: undefined,
  },
  {
    icon: <NotebookIcon size={18} weight="duotone" />,
    label: 'Journals',
    value: 'journals',
  },
] as const

/** Square icon tiles switching between the bookmarks and the journals */
const ViewSwitch = ({ view }: { view: 'journals' | undefined }) => {
  const navigate = useNavigate()

  return (
    <div className="flex gap-2xs">
      {VIEWS.map(({ icon, label, value }) => (
        <IconControl
          key={label}
          type="radio"
          name="collection-view"
          value={value ?? 'bookmarks'}
          label=""
          aria-label={label}
          title={label}
          checked={view === value}
          onChange={() =>
            navigate({
              resetScroll: false,
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                view: value,
              }),
              to: '.',
            })
          }
        >
          {icon}
        </IconControl>
      ))}
    </div>
  )
}

function Page() {
  const collection = Route.useParams().collection
  const {
    folders: selectedFolders = [],
    tags: selectedTags = [],
    view,
    ...search
  } = useSearch({
    from: '/_app/collection/$collection',
  })
  const folders = useCollectionFolders(collection)
  const tags = getFilterTags(folders, selectedFolders, selectedTags)
  const filters = (
    <div className="flex flex-col gap-xs">
      <ViewSwitch view={view} />
      <CollectionFilters
        collection={collection}
        folders={folders}
        selectedFolders={selectedFolders}
        selectedTags={selectedTags}
      />
    </div>
  )

  if (view === 'journals') {
    return (
      <div className="feed">
        <h3
          className={cn(
            headingVariants({ variant: 'feedTitle' }),
            'flex items-center gap-2xs',
          )}
        >
          <FolderIcon weight="duotone" size={24} />
          {collection}
        </h3>
        <div className="mt-xs">{filters}</div>
        <div className="mt-m max-w-prose">
          <CollectionJournals collection={collection} filterTags={tags} />
        </div>
      </div>
    )
  }

  return (
    <CollectionBookmarks
      collection={collection}
      filters={filters}
      search={search}
      tags={tags}
    />
  )
}

function CollectionBookmarks({
  collection,
  filters,
  search,
  tags,
}: {
  collection: string
  filters: React.ReactNode
  search: ReturnType<typeof apiParameters>
  tags: string[]
}) {
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
      filters={filters}
      from={`/collection/${encodeURIComponent(collection)}`}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      shareConfig={{ kind: 'collection', name: collection }}
    />
  )
}

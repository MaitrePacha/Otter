import { NotebookIcon, TrashIcon } from '@phosphor-icons/react'
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Feed } from '@/components/Feed'
import { headingVariants } from '@/components/Heading'
import { JournalEntryItem } from '@/components/JournalEntryItem'
import { Link } from '@/components/Link'
import { CONTENT, createTitle } from '@/constants'
import type { Bookmark } from '@/types/db'
import { cn } from '@/utils/classnames'
import { apiParameters } from '@/utils/fetching/apiParameters'
import { getBookmarksInfiniteOptions } from '@/utils/fetching/bookmarks'
import { getJournalEntriesOptions } from '@/utils/fetching/journal'

export const Route = createFileRoute('/_app/trash')({
  component: FeedPage,
  head: () => ({
    meta: [
      {
        title: createTitle('trashTitle'),
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ search }),
  validateSearch: (search: Record<string, unknown>) => {
    const { offset: _, ...params } = apiParameters(search)
    return {
      ...params,
      // The trash holds bookmarks and journal entries, one view at a time
      view: search.view === 'journal' ? ('journal' as const) : undefined,
    }
  },
})

// Switches between the two views, under the title
const trashViews = (view: 'journal' | undefined) => [
  {
    href: '/trash',
    icon: <TrashIcon weight="duotone" size={18} />,
    isActive: view !== 'journal',
    search: { view: undefined },
    text: 'Bookmarks',
  },
  {
    href: '/trash',
    icon: <NotebookIcon weight="duotone" size={18} />,
    isActive: view === 'journal',
    search: { view: 'journal' },
    text: 'Journal entries',
  },
]

function FeedPage() {
  const { view, ...search } = useSearch({ from: '/_app/trash' })

  return view === 'journal' ? (
    <JournalTrash />
  ) : (
    <BookmarksTrash search={search} />
  )
}

function BookmarksTrash({
  search,
}: {
  search: ReturnType<typeof apiParameters>
}) {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      getBookmarksInfiniteOptions({ ...search, status: 'inactive' }),
    )

  const items = data.pages.flatMap((page) => page.data ?? []) as Bookmark[]
  const count = data.pages[0]?.count ?? 0

  return (
    <Feed
      items={items}
      count={count}
      limit={search.limit}
      allowGroupByDate={true}
      title={CONTENT.trashTitle}
      icon={<TrashIcon weight="duotone" size={24} />}
      subNav={trashViews(undefined)}
      feedType="bookmarks"
      allowDeletion
      from="/trash"
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  )
}

function JournalTrash() {
  const { data } = useSuspenseQuery(
    getJournalEntriesOptions({ status: 'deleted' }),
  )
  const entries = data?.data ?? []

  return (
    <div className="feed">
      <h3
        className={cn(
          headingVariants({ variant: 'feedTitle' }),
          'flex items-center gap-2xs',
        )}
      >
        <TrashIcon weight="duotone" size={24} />
        {CONTENT.trashTitle}
      </h3>
      <div className="mt-xs flex flex-wrap gap-3xs">
        {trashViews('journal').map(({ href, icon, isActive, search, text }) => (
          <Link
            href={href}
            // @ts-expect-error How do I type search params?
            search={search}
            variant="sidebar"
            isActive={isActive}
            aria-pressed={isActive}
            key={text}
          >
            <div className="link-sidebar-inner">
              {icon}
              {text}
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-m max-w-prose">
        {entries.length ? (
          entries.map((entry) => (
            <JournalEntryItem key={entry.id} entry={entry} inTrash />
          ))
        ) : (
          <p>{CONTENT.noItems}</p>
        )}
      </div>
    </div>
  )
}

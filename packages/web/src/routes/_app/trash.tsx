import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  CheckSquareIcon,
  ChecksIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/Button'
import { Feed } from '@/components/Feed'
import { headingVariants } from '@/components/Heading'
import { JournalEntryItem } from '@/components/JournalEntryItem'
import { Link } from '@/components/Link'
import { PageToolbar } from '@/components/PageToolbar'
import { CONTENT, createTitle } from '@/constants'
import type { Bookmark } from '@/types/db'
import { cn } from '@/utils/classnames'
import { apiParameters } from '@/utils/fetching/apiParameters'
import { getBookmarksInfiniteOptions } from '@/utils/fetching/bookmarks'
import {
  getJournalEntriesOptions,
  useBatchUpdateJournalEntries,
} from '@/utils/fetching/journal'

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
    icon: <CalendarBlankIcon weight="duotone" size={18} />,
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
  const batchMutation = useBatchUpdateJournalEntries()
  const [isSelecting, setIsSelecting] = useState(false)
  const [selection, setSelection] = useState<Set<number>>(() => new Set())
  // Only act on selected entries that are still listed
  const selectedIds = entries
    .filter((entry) => selection.has(entry.id))
    .map((entry) => entry.id)
  const isAllSelected =
    entries.length > 0 && selectedIds.length === entries.length
  const isBatchDisabled = batchMutation.isPending || selectedIds.length === 0

  const handleSelectedChange = (id: number, isSelected: boolean) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (isSelected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const handleBatch = (type: 'restore' | 'purge') => {
    if (
      type === 'purge' &&
      !confirm(
        `Permanently delete ${selectedIds.length} journal ${selectedIds.length === 1 ? 'entry' : 'entries'}? This cannot be undone.`,
      )
    ) {
      return
    }
    batchMutation.mutate(
      { action: { type }, ids: selectedIds },
      { onSuccess: () => setSelection(new Set()) },
    )
  }

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
      <PageToolbar>
        <Button
          size="xs"
          variant="ghost"
          aria-pressed={isSelecting}
          onClick={() => {
            setIsSelecting((prev) => !prev)
            setSelection(new Set())
          }}
        >
          <CheckSquareIcon
            size={16}
            weight={isSelecting ? 'fill' : 'duotone'}
          />{' '}
          Select
        </Button>
      </PageToolbar>
      {isSelecting ? (
        <PageToolbar>
          <span className="px-2xs text-step--2 text-theme11">
            {selectedIds.length} selected
          </span>
          <Button
            size="xs"
            variant="ghost"
            onClick={() =>
              setSelection(
                isAllSelected
                  ? new Set()
                  : new Set(entries.map((entry) => entry.id)),
              )
            }
            aria-pressed={isAllSelected}
            aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
            title={
              isAllSelected ? 'Deselect all' : `Select all (${entries.length})`
            }
          >
            <ChecksIcon size={16} weight={isAllSelected ? 'bold' : 'regular'} />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isBatchDisabled}
            onClick={() => handleBatch('restore')}
            aria-label="Un-delete"
            title="Un-delete"
          >
            <ArrowCounterClockwiseIcon size={16} weight="duotone" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isBatchDisabled}
            onClick={() => handleBatch('purge')}
            aria-label="Permanently delete"
            title="Permanently delete"
          >
            <TrashIcon size={16} weight="duotone" />
          </Button>
        </PageToolbar>
      ) : null}
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
            <JournalEntryItem
              key={entry.id}
              entry={entry}
              inTrash
              {...(isSelecting
                ? {
                    isSelected: selection.has(entry.id),
                    onSelectedChange: handleSelectedChange,
                  }
                : {})}
            />
          ))
        ) : (
          <p>{CONTENT.noItems}</p>
        )}
      </div>
    </div>
  )
}

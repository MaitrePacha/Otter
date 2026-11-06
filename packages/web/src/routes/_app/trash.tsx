import {
  ArrowCounterClockwiseIcon,
  BookmarkSimpleIcon,
  CalendarBlankIcon,
  CheckSquareIcon,
  ChecksIcon,
  ClockCounterClockwiseIcon,
  TrashIcon,
  XIcon,
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
import { useFeedOptions } from '@/hooks/useFeedOptions'
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

const TRASH_VIEWS = [
  {
    icon: <BookmarkSimpleIcon weight="duotone" size={18} />,
    text: 'Bookmarks',
    view: undefined,
  },
  {
    icon: <CalendarBlankIcon weight="duotone" size={18} />,
    text: 'Journal entries',
    view: 'journal',
  },
] as const

/**
 * Switches between the two views, under the title, in the greys of a
 * collection's Bookmarks / Journals buttons
 */
const TrashViews = ({ view }: { view: 'journal' | undefined }) => (
  <div className="flex flex-wrap gap-3xs">
    {TRASH_VIEWS.map(({ icon, text, view: target }) => (
      <Link
        key={text}
        href="/trash"
        // @ts-expect-error How do I type search params?
        search={{ view: target }}
        aria-pressed={view === target}
        className={cn(
          'flex items-center gap-3xs rounded-md px-2xs py-3xs text-step--2 hover:no-underline!',
          view === target
            ? 'bg-theme5 [--color:var(--theme12)]!'
            : '[--color:var(--theme9)]! hover:[--color:var(--theme12)]!',
        )}
      >
        {icon}
        {text}
      </Link>
    ))}
  </div>
)

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
      filters={<TrashViews view={undefined} />}
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
  const { windowQuery, setWindowQuery } = useFeedOptions()
  // Same 7-day windows as the bookmarks, on the date each entry was created
  const entries = (data?.data ?? []).filter((entry) => {
    if (!windowQuery || !entry.created_at) {
      return true
    }
    const age = (Date.now() - new Date(entry.created_at).getTime()) / 86_400_000
    return age < windowQuery * 7 && age >= (windowQuery - 1) * 7
  })
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
          onClick={() => setWindowQuery((prev) => prev + 1)}
          size="xs"
          variant="ghost"
          aria-pressed={windowQuery > 0}
          title="Click again to go back another 7 days"
        >
          <ClockCounterClockwiseIcon
            size={16}
            weight={windowQuery > 0 ? 'fill' : 'duotone'}
          />{' '}
          {windowQuery > 1
            ? `${(windowQuery - 1) * 7 + 1}–${windowQuery * 7} days ago`
            : 'Last 7 days'}
        </Button>
        {windowQuery > 0 ? (
          <Button
            onClick={() => setWindowQuery(0)}
            size="xs"
            variant="ghost"
            aria-label="Clear date filter"
          >
            <XIcon size={16} />
          </Button>
        ) : null}
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
      <div className="mt-xs">
        <TrashViews view="journal" />
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

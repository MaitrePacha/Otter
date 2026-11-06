import { StarIcon } from '@phosphor-icons/react'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { CollectionJournals } from '@/components/CollectionJournals'
import { Feed } from '@/components/Feed'
import { headingVariants } from '@/components/Heading'
import { ViewSwitch } from '@/components/ViewSwitch'
import { CONTENT, createTitle } from '@/constants'
import type { Bookmark } from '@/types/db'
import { cn } from '@/utils/classnames'
import { apiParameters } from '@/utils/fetching/apiParameters'
import { getBookmarksInfiniteOptions } from '@/utils/fetching/bookmarks'

export const Route = createFileRoute('/_app/stars')({
  component: Page,
  head: () => ({
    meta: [
      {
        title: createTitle('starsTitle'),
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ search }),
  validateSearch: (search: Record<string, unknown>) => {
    const { offset: _, ...params } = apiParameters(search)
    return {
      ...params,
      // The starred bookmarks or the starred journals
      view: search.view === 'journals' ? ('journals' as const) : undefined,
    }
  },
})

function Page() {
  const { view, ...search } = useSearch({ from: '/_app/stars' })

  if (view === 'journals') {
    return (
      <div className="feed">
        <h3
          className={cn(
            headingVariants({ variant: 'feedTitle' }),
            'flex items-center gap-2xs',
          )}
        >
          <StarIcon weight="duotone" size={24} />
          {CONTENT.starsTitle}
        </h3>
        <div className="mt-xs">
          <ViewSwitch view={view} />
        </div>
        <div className="mt-m max-w-prose">
          <CollectionJournals starredOnly />
        </div>
      </div>
    )
  }

  return <StarredBookmarks search={search} />
}

function StarredBookmarks({
  search,
}: {
  search: ReturnType<typeof apiParameters>
}) {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      getBookmarksInfiniteOptions({ ...search, star: true }),
    )

  const items = data.pages.flatMap((page) => page.data ?? []) as Bookmark[]
  const count = data.pages[0]?.count ?? 0

  return (
    <Feed
      items={items}
      count={count}
      limit={search.limit}
      allowGroupByDate={true}
      title={CONTENT.starsTitle}
      icon={<StarIcon weight="duotone" size={24} />}
      feedType="bookmarks"
      filters={<ViewSwitch view={undefined} />}
      from="/stars"
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  )
}

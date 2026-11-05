import { HashIcon } from '@phosphor-icons/react'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { CollectionJournals } from '@/components/CollectionJournals'
import { Feed } from '@/components/Feed'
import { headingVariants } from '@/components/Heading'
import { JournalsToolbar } from '@/components/JournalsToolbar'
import { ViewSwitch } from '@/components/ViewSwitch'
import type { Bookmark } from '@/types/db'
import { cn } from '@/utils/classnames'
import { apiParameters } from '@/utils/fetching/apiParameters'
import { getBookmarksInfiniteOptions } from '@/utils/fetching/bookmarks'

export const Route = createFileRoute('/_app/tag/$tag')({
  component: Page,
  head: ({ params }) => ({
    meta: [
      {
        title: `Tag: #${params.tag}`,
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ search }),
  validateSearch: (search: Record<string, unknown>) => {
    const { offset: _, ...params } = apiParameters(search)
    return {
      ...params,
      // As on a collection's page: the bookmarks or the journals with the tag
      view: search.view === 'journals' ? ('journals' as const) : undefined,
    }
  },
})

function Page() {
  const tag = Route.useParams().tag
  const { view, ...search } = useSearch({ from: '/_app/tag/$tag' })
  // Untagged is a filter on bookmarks, journals have no such page
  const hasJournals = tag !== 'Untagged'

  if (hasJournals && view === 'journals') {
    return (
      <div className="feed">
        <h3
          className={cn(
            headingVariants({ variant: 'feedTitle' }),
            'flex items-center gap-2xs',
          )}
        >
          <HashIcon weight="duotone" size={24} />
          {tag}
        </h3>
        <JournalsToolbar kind="tag" name={tag} defaultTags={[tag]} />
        <div className="mt-xs">
          <ViewSwitch view={view} />
        </div>
        <div className="mt-m max-w-prose">
          <CollectionJournals collection={tag} filterTags={[]} exact />
        </div>
      </div>
    )
  }

  return <TagBookmarks tag={tag} search={search} hasJournals={hasJournals} />
}

function TagBookmarks({
  tag,
  search,
  hasJournals,
}: {
  tag: string
  search: ReturnType<typeof apiParameters>
  hasJournals: boolean
}) {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(getBookmarksInfiniteOptions({ ...search, tag }))

  const items = data.pages.flatMap((page) => page.data ?? []) as Bookmark[]
  const count = data.pages[0]?.count ?? 0

  return (
    <Feed
      items={items}
      count={count}
      limit={search.limit}
      allowGroupByDate={true}
      title={tag}
      icon={<HashIcon weight="duotone" size={24} />}
      feedType="bookmarks"
      filters={hasJournals ? <ViewSwitch view={undefined} /> : undefined}
      from={`/tag/${encodeURIComponent(tag)}`}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      shareConfig={tag === 'Untagged' ? undefined : { kind: 'tag', name: tag }}
    />
  )
}

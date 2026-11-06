import { StarIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useFeedOptions } from '@/hooks/useFeedOptions'
import type { Journal } from '@/types/db'
import {
  getJournalEntriesOptions,
  getJournalsOptions,
} from '@/utils/fetching/journal'
import { Link } from './Link'

// A tag is under `parent` when it is `parent` or starts with `parent:`
const isUnder = (tag: string, parent: string) => {
  const lower = tag.toLowerCase()
  const parentLower = parent.toLowerCase()
  return lower === parentLower || lower.startsWith(`${parentLower}:`)
}

interface CollectionJournalsProps {
  /** The collection, or the tag on a tag's page; none lists every journal */
  collection?: string
  /** The selected folders or sub-folders; none shows the whole collection */
  filterTags?: string[]
  /** On a tag's page: only journals with that very tag, as for bookmarks */
  exact?: boolean
  /** Only the starred journals, as the toolbar's Stars or the Stars page */
  starredOnly?: boolean
}

/**
 * The journals tagged in a collection (or with a tag), each opening the
 * Journal page
 */
export const CollectionJournals = ({
  collection,
  filterTags = [],
  exact = false,
  starredOnly = false,
}: CollectionJournalsProps) => {
  const { data } = useSuspenseQuery(getJournalsOptions())
  // The toolbar's Stars, in the same search param as the bookmarks'
  const { starQuery } = useFeedOptions()
  const onlyStars = starredOnly || starQuery
  const parents = filterTags.length
    ? filterTags
    : collection
      ? [collection]
      : []
  const journals = (data?.data ?? []).filter(
    (journal: Journal) =>
      (!onlyStars || journal.star) &&
      (!parents.length ||
        journal.tags.some((tag) =>
          parents.some((parent) =>
            exact
              ? tag.toLowerCase() === parent.toLowerCase()
              : isUnder(tag, parent),
          ),
        )),
  )

  const { data: entries } = useSuspenseQuery(getJournalEntriesOptions())
  const entryCounts = new Map<number, number>()
  for (const entry of entries?.data ?? []) {
    if (entry.journal) {
      entryCounts.set(entry.journal, (entryCounts.get(entry.journal) ?? 0) + 1)
    }
  }

  if (!journals.length) {
    return <p>No journals here yet.</p>
  }

  // Each card: name and number of entries, description, then tags
  return (
    <ul className="m-0 grid list-none gap-xs p-0 sm:grid-cols-2">
      {journals.map((journal) => (
        <li key={journal.id} className="flex">
          <Link
            href="/journal"
            // @ts-expect-error How do I type search params?
            search={{ journal: journal.id }}
            className="group card w-full justify-start hover:no-underline!"
          >
            <span className="flex items-baseline justify-between gap-xs">
              <span className="text-step-0 text-theme12 decoration-theme9 underline-offset-3 group-hover:underline">
                {journal.name}
              </span>
              <span className="text-step--2 text-theme9">
                {entryCounts.get(journal.id) ?? 0}
              </span>
            </span>
            {journal.description ? (
              <span className="text-step--1 text-theme9">
                {journal.description}
              </span>
            ) : null}
            {/* The star of a starred journal leads its tags, as on a
                bookmark's footer */}
            <span className="flex flex-wrap items-center gap-3xs">
              {journal.star ? (
                <StarIcon
                  size={14}
                  weight="fill"
                  aria-label="Starred"
                  className="text-theme10"
                />
              ) : null}
              {journal.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-theme4 px-3xs text-step--2 text-theme10"
                >
                  {tag}
                </span>
              ))}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

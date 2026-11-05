import { NotebookIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { Journal } from '@/types/db'
import { getJournalsOptions } from '@/utils/fetching/journal'
import { Link } from './Link'

// A tag is under `parent` when it is `parent` or starts with `parent:`
const isUnder = (tag: string, parent: string) => {
  const lower = tag.toLowerCase()
  const parentLower = parent.toLowerCase()
  return lower === parentLower || lower.startsWith(`${parentLower}:`)
}

interface CollectionJournalsProps {
  collection: string
  /** The selected folders or sub-folders; none shows the whole collection */
  filterTags: string[]
}

/** The journals tagged in a collection, each opening the Journal page */
export const CollectionJournals = ({
  collection,
  filterTags,
}: CollectionJournalsProps) => {
  const { data } = useSuspenseQuery(getJournalsOptions())
  const parents = filterTags.length ? filterTags : [collection]
  const journals = (data?.data ?? []).filter((journal: Journal) =>
    journal.tags.some((tag) => parents.some((parent) => isUnder(tag, parent))),
  )

  if (!journals.length) {
    return <p>No journals here yet.</p>
  }

  return (
    <ul className="m-0 grid list-none gap-xs p-0">
      {journals.map((journal) => (
        <li key={journal.id}>
          <Link
            href="/journal"
            // @ts-expect-error How do I type search params?
            search={{ journal: journal.id }}
            className="card"
          >
            <span className="flex items-start gap-xs">
              <NotebookIcon size={20} weight="duotone" className="shrink-0" />
              <span className="flex flex-col gap-3xs">
                <span className="text-step-0 text-theme12">{journal.name}</span>
                {journal.description ? (
                  <span className="text-step--1 text-theme10">
                    {journal.description}
                  </span>
                ) : null}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

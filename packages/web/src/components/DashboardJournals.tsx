import { useSuspenseQuery } from '@tanstack/react-query'
import type { JournalEntry } from '@/types/db'
import { getJournalEntriesOptions } from '@/utils/fetching/journal'
import { headingVariants } from './Heading'
import { Link } from './Link'

const DAY = 86_400_000

// The bookmarks' sections, on the date of each entry
const SECTIONS = [
  { from: 6, title: 'One week ago', to: 8 },
  { from: 29, title: 'One month ago', to: 31 },
  { from: 59, title: 'Two months ago', to: 61 },
  { from: 179, title: 'Six months ago', to: 181 },
  { from: 364, title: 'One year ago', to: 366 },
]

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(date))

const EntryCard = ({ entry }: { entry: JournalEntry }) => (
  <Link
    href="/journal"
    // @ts-expect-error How do I type search params?
    search={{ journal: entry.journal ?? undefined }}
    className="group card justify-start hover:no-underline!"
  >
    <span className="flex items-baseline justify-between gap-xs text-step--1">
      <span className="text-theme12 decoration-theme9 underline-offset-3 group-hover:underline">
        {entry.date ? formatDate(entry.date) : 'No date'}
      </span>
      {entry.journals?.name ? (
        <span className="text-step--2 text-theme9">{entry.journals.name}</span>
      ) : null}
    </span>
    <span className="line-clamp-3 text-step--1 text-theme10">
      {entry.entry}
    </span>
  </Link>
)

const Section = ({
  title,
  entries,
}: {
  title: string
  entries: JournalEntry[]
}) =>
  entries.length ? (
    <div className="feed-simple">
      <h3 className={headingVariants({ variant: 'feedTitle' })}>{title}</h3>
      <div className="feed-simple-grid">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  ) : null

/**
 * The Dashboard's Journals view: the latest journal entries, then entries
 * from a week, a month… a year ago, as the bookmarks' sections
 */
export const DashboardJournals = () => {
  const { data } = useSuspenseQuery(getJournalEntriesOptions())
  const entries = (data?.data ?? [])
    .filter((entry) => entry.date)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  const ageOf = (entry: JournalEntry) =>
    (Date.now() - new Date(entry.date ?? '').getTime()) / DAY

  return (
    <div className="flex flex-col gap-l">
      <Section title="Recent" entries={entries.slice(0, 4)} />
      {SECTIONS.map(({ title, from, to }) => (
        <Section
          key={title}
          title={title}
          entries={entries
            .filter((entry) => ageOf(entry) >= from && ageOf(entry) <= to)
            .slice(0, 2)}
        />
      ))}
    </div>
  )
}

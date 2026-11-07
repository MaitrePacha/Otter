import {
  ArrowCounterClockwiseIcon,
  ListPlusIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/Button'
import { Dialog, DialogContent } from '@/components/Dialog'
import { Markdown } from '@/components/Markdown'
import type { JournalEntry } from '@/types/db'
import {
  useBatchUpdateJournalEntries,
  useDeleteJournalEntry,
} from '@/utils/fetching/journal'
import { Flex } from './Flex'

const formatEntryDate = (date: string) => {
  // Date-only strings parse as UTC midnight, so format in UTC too —
  // otherwise users behind UTC see the previous calendar day.
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(date))
}

// One part of an entry's date, as 30, OCT or 2026 on its card
const formatDatePart = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(
    new Date(date),
  )

interface JournalEntryItemProps {
  entry: JournalEntry
  /** Required unless inTrash */
  onEdit?: (entry: JournalEntry) => void
  /** In the trash: Un-delete and Permanently delete instead of Edit and
   * Delete */
  inTrash?: boolean
  onSelectJournal?: (journal: number) => void
  /** Shows a checkbox for bulk editing when defined */
  isSelected?: boolean
  onSelectedChange?: (id: number, isSelected: boolean) => void
}

export const JournalEntryItem = ({
  entry,
  onEdit,
  onSelectJournal,
  isSelected,
  onSelectedChange,
  inTrash = false,
}: JournalEntryItemProps) => {
  const deleteJournalEntry = useDeleteJournalEntry()
  const batchMutation = useBatchUpdateJournalEntries()
  const noteRef = useRef<HTMLDivElement>(null)
  const [isCut, setIsCut] = useState(false)
  const [isReading, setIsReading] = useState(false)

  // Shows More once the note is longer than the card shows
  useEffect(() => {
    const note = noteRef.current
    if (!note) {
      return
    }
    const observer = new ResizeObserver(() => {
      setIsCut(note.scrollHeight > note.clientHeight + 1)
    })
    observer.observe(note)
    return () => observer.disconnect()
  }, [])

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      deleteJournalEntry.mutate(entry.id)
    }
  }

  return (
    <article className="card journal-entry flex-row! gap-m!">
      <div className="flex w-14 shrink-0 flex-col items-center gap-2xs border-theme5 border-r pr-s text-center">
        {onSelectedChange ? (
          <input
            type="checkbox"
            className="feed-item-checkbox"
            aria-label={`Select entry${entry.date ? ` from ${formatEntryDate(entry.date)}` : ''}`}
            checked={isSelected ?? false}
            onChange={(event) =>
              onSelectedChange(entry.id, event.target.checked)
            }
          />
        ) : null}
        {entry.date ? (
          <time
            dateTime={entry.date}
            className="flex flex-col"
            title={formatEntryDate(entry.date)}
          >
            <span className="text-step-3 text-theme12 leading-none">
              {formatDatePart(entry.date, { day: 'numeric' })}
            </span>
            <span className="mt-3xs text-step--2 text-theme10 uppercase">
              {formatDatePart(entry.date, { month: 'short' })}
              <br />
              {formatDatePart(entry.date, { year: 'numeric' })}
            </span>
          </time>
        ) : null}
      </div>
      <div className="flex min-w-0 grow flex-col gap-2xs">
        {entry.journals?.name && onSelectJournal ? (
          <button
            type="button"
            className="self-end text-step--2 text-theme10 hover:text-theme12"
            onClick={() => onSelectJournal(entry.journals?.id as number)}
          >
            {entry.journals.name}
          </button>
        ) : null}
        <div ref={noteRef} className="journal-entry-note line-clamp-8 grow">
          <Markdown preventClamping>{entry.entry ?? ''}</Markdown>
        </div>
        <Flex align="center" justify="end" gap="s">
          {isCut ? (
            <Button
              variant="ghost"
              size="2xs"
              type="button"
              className="mr-auto"
              onClick={() => setIsReading(true)}
            >
              <ListPlusIcon size={16} weight="duotone" />
              More
            </Button>
          ) : null}
          {inTrash ? (
            <>
              <Button
                variant="ghost"
                size="2xs"
                type="button"
                disabled={batchMutation.isPending}
                onClick={() =>
                  batchMutation.mutate({
                    action: { type: 'restore' },
                    ids: [entry.id],
                  })
                }
              >
                <ArrowCounterClockwiseIcon size={16} weight="duotone" />
                Un-delete
              </Button>
              <Button
                variant="ghost"
                size="2xs"
                type="button"
                disabled={batchMutation.isPending}
                onClick={() => {
                  if (
                    confirm(
                      'Permanently delete this journal entry? This cannot be undone.',
                    )
                  ) {
                    batchMutation.mutate({
                      action: { type: 'purge' },
                      ids: [entry.id],
                    })
                  }
                }}
              >
                <TrashIcon size={16} weight="duotone" />
                Permanently delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="2xs"
                type="button"
                onClick={() => onEdit?.(entry)}
              >
                <PencilSimpleIcon size={16} weight="duotone" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="2xs"
                type="button"
                onClick={handleDelete}
              >
                <TrashIcon size={16} weight="duotone" />
                Delete
              </Button>
            </>
          )}
        </Flex>
      </div>
      <Dialog open={isReading} onOpenChange={setIsReading}>
        <DialogContent
          placement="center"
          width="m"
          title={entry.date ? formatEntryDate(entry.date) : 'Journal entry'}
          description={entry.journals?.name ?? undefined}
        >
          <Markdown preventClamping>{entry.entry ?? ''}</Markdown>
        </DialogContent>
      </Dialog>
    </article>
  )
}

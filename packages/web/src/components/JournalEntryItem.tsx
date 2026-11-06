import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { Button } from '@/components/Button'
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
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(new Date(date))
}

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

  // No confirmation: a deleted entry goes to the trash
  const handleDelete = () => {
    deleteJournalEntry.mutate(entry.id)
  }

  return (
    <article className="journal-entry border-b border-theme6 py-m">
      {entry.date || onSelectedChange ? (
        <Flex align="center" gap="2xs" className="mb-xs text-theme10">
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
            <>
              <CalendarBlankIcon size={18} weight="duotone" />
              <time dateTime={entry.date}>{formatEntryDate(entry.date)}</time>
            </>
          ) : null}
        </Flex>
      ) : null}
      <Markdown preventClamping>{entry.entry ?? ''}</Markdown>
      <Flex align="center" gap="s" className="mt-s">
        {entry.journals?.name && onSelectJournal ? (
          <Button
            variant="outline"
            size="2xs"
            type="button"
            onClick={() => onSelectJournal(entry.journals?.id as number)}
          >
            {entry.journals.name}
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
    </article>
  )
}

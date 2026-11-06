import { PlusCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button } from './Button'
import { Dialog, DialogContent, DialogTrigger } from './Dialog'
import { JournalForm } from './JournalForm'
import { PageToolbar } from './PageToolbar'
import { ShareDialog } from './ShareDialog'

/**
 * The Journals view's toolbar, on a collection's or a tag's page: share the
 * page, as in the Bookmarks view, and on a collection's page create a
 * journal already tagged
 */
export const JournalsToolbar = ({
  kind,
  name,
  defaultTags,
}: {
  kind: 'collection' | 'tag'
  name: string
  /** Offers New journal, starting with these tags; without, no button */
  defaultTags?: string[]
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <PageToolbar>
      {defaultTags ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="xs" variant="ghost">
              <PlusCircleIcon size={16} weight="duotone" /> New journal
            </Button>
          </DialogTrigger>
          <DialogContent placement="center" width="m">
            <JournalForm
              defaultTags={defaultTags}
              onSubmitted={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}
      <ShareDialog kind={kind} name={name} />
    </PageToolbar>
  )
}

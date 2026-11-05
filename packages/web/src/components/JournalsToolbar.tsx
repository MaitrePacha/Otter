import { PlusCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button } from './Button'
import { Dialog, DialogContent, DialogTrigger } from './Dialog'
import { JournalForm } from './JournalForm'
import { PageToolbar } from './PageToolbar'
import { ShareDialog } from './ShareDialog'

/**
 * The Journals view's toolbar, on a collection's or a tag's page: share the
 * page, as in the Bookmarks view, or create a journal already tagged
 */
export const JournalsToolbar = ({
  kind,
  name,
  defaultTags,
}: {
  kind: 'collection' | 'tag'
  name: string
  defaultTags: string[]
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <PageToolbar>
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
      <ShareDialog kind={kind} name={name} />
    </PageToolbar>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import type { Journal, JournalInsert } from '@/types/db'
import { useCreateJournal, useUpdateJournal } from '@/utils/fetching/journal'
import { getTagsOptions } from '@/utils/fetching/tags'
import { setComboboxValue } from './BookmarkForm'
import { Button } from './Button'
import { Combobox } from './Combobox'
import { FormGroup } from './FormGroup'
import { Input } from './Input'

interface JournalFormProps {
  /** Edits this journal; without it, creates a new one */
  journal?: Journal
  onSubmitted: () => void
}

/** A journal's name, description and tags, which file it in collections */
export const JournalForm = ({ journal, onSubmitted }: JournalFormProps) => {
  const createJournalMutation = useCreateJournal()
  const updateJournalMutation = useUpdateJournal()
  const { data: tags } = useQuery(getTagsOptions())
  const { control, register, handleSubmit, reset } = useForm<JournalInsert>({
    defaultValues: {
      description: journal?.description ?? '',
      name: journal?.name ?? '',
      tags: journal?.tags ?? [],
    },
  })
  const tagOptions = tags
    ?.filter((item) => item.tag && item.tag !== 'Untagged')
    .map((item) => ({ label: item.tag, value: item.tag }))

  const handleSubmitForm = (formData: JournalInsert) => {
    if (journal) {
      updateJournalMutation.mutate(
        { data: formData, id: journal.id },
        { onSuccess: onSubmitted },
      )
      return
    }
    createJournalMutation.mutate(formData, {
      onSuccess: () => {
        reset()
        onSubmitted()
      },
    })
  }

  return (
    <div>
      <h2 className="mb-s">{journal ? 'Edit journal' : 'New journal'}</h2>
      <form
        onSubmit={handleSubmit(handleSubmitForm)}
        className="flex flex-col gap-s"
      >
        <FormGroup label="Name" name="name">
          <Input
            id="name"
            placeholder="Journal name"
            autoComplete="off"
            autoFocus
            {...register('name', { required: true })}
          />
        </FormGroup>
        <FormGroup label="Description" name="description">
          <Input
            id="description"
            placeholder="Optional description"
            autoComplete="off"
            {...register('description')}
          />
        </FormGroup>
        <FormGroup label="Tags" name="tags">
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <Combobox
                inputId="tags"
                options={tagOptions}
                onChange={(options) =>
                  field.onChange(
                    (options as { value: string }[]).map((item) => item.value),
                  )
                }
                value={setComboboxValue(field.value)}
                maxMenuHeight={100}
              />
            )}
          />
        </FormGroup>
        <div>
          <Button
            type="submit"
            disabled={
              createJournalMutation.isPending || updateJournalMutation.isPending
            }
          >
            {journal ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}

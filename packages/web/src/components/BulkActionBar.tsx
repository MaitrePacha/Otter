import popOffSfx from '@mrmartineau/kit/sounds/pop-off.mp3'
import popOnSfx from '@mrmartineau/kit/sounds/pop-on.mp3'
import popUpOffSfx from '@mrmartineau/kit/sounds/pop-up-off.mp3'
import popUpOnSfx from '@mrmartineau/kit/sounds/pop-up-on.mp3'
import useSound from '@mrmartineau/use-sound'
import {
  ArrowCounterClockwiseIcon,
  ChecksIcon,
  EyeIcon,
  EyeSlashIcon,
  MinusCircleIcon,
  PencilSimpleIcon,
  PlusCircleIcon,
  StarIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import type { BatchAction } from 'worker/bookmarks/batch'
import sweepSfx from '@/assets/sounds/sweep.mp3'
import { Button } from '@/components/Button'
import type { Bookmark, BookmarkType } from '@/types/db'
import { batchUpdateBookmarks } from '@/utils/fetching/bookmarks'
import { getTagsOptions } from '@/utils/fetching/tags'
import { getErrorMessage } from '@/utils/get-error-message'
import { Combobox, comboboxStyles } from './Combobox'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'
import { TypeToIcon } from './TypeToIcon'

// The bookmark form's tag field, drawn as the window's plain grey field
const TAG_FIELD_STYLES: Record<string, unknown> = {
  ...comboboxStyles,
  // @ts-ignore
  control: (provided, state) => ({
    ...provided,
    ':hover': {
      borderColor: state.isFocused ? 'var(--theme8)' : 'var(--theme5)',
    },
    backgroundColor: 'var(--theme2)',
    borderColor: state.isFocused ? 'var(--theme8)' : 'var(--theme5)',
    borderRadius: 'var(--radii-m)',
    boxShadow: 'none',
    minHeight: 0,
  }),
}

const ICON_BUTTON =
  'focus grid size-7 shrink-0 place-items-center rounded-md text-theme10 hover:bg-theme4 hover:text-theme12 disabled:opacity-50'
const TEXT_BUTTON =
  'focus text-step--2 text-theme9 hover:text-theme12 disabled:opacity-50'

const BOOKMARK_TYPES: BookmarkType[] = [
  'link',
  'article',
  'video',
  'audio',
  'recipe',
  'image',
  'document',
  'product',
  'game',
  'note',
  'event',
  'place',
]

interface BulkActionBarProps {
  selectedBookmarks: Bookmark[]
  totalCount: number
  /** In the trash the actions are restore and permanent delete */
  isTrash?: boolean
  onSelectAll: () => void
  onClear: () => void
}

export const BulkActionBar = ({
  selectedBookmarks,
  totalCount,
  isTrash = false,
  onSelectAll,
  onClear,
}: BulkActionBarProps) => {
  const queryClient = useQueryClient()
  // The single bookmark's star and public sounds, played three times in
  // quick succession to mark a bulk edit; a broom sweep for the trash
  const [playPopOn] = useSound(popOnSfx, { volume: 0.3 })
  const [playPopOff] = useSound(popOffSfx, { volume: 0.3 })
  const [playPopUpOn] = useSound(popUpOnSfx, { volume: 0.3 })
  const [playPopUpOff] = useSound(popUpOffSfx, { volume: 0.3 })
  const [playSweep] = useSound(sweepSfx, { volume: 0.3 })
  const selectedIds = selectedBookmarks.map((bookmark) => bookmark.id)
  const [tag, setTag] = useState('')
  const { data: tags } = useQuery(getTagsOptions())
  const { isPending, mutate } = useMutation({
    mutationFn: (action: BatchAction) =>
      batchUpdateBookmarks(selectedIds, action),
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
    onSuccess: async ({ data }) => {
      toast.success(
        `Updated ${data.updated} bookmark${data.updated === 1 ? '' : 's'}`,
      )
      // Every action ends with an empty selection, ready for the next one
      onClear()
      await queryClient.invalidateQueries()
    },
  })
  const playRepeated = (play: () => void) => {
    play()
    setTimeout(play, 90)
    setTimeout(play, 180)
  }
  const isDisabled = isPending || selectedIds.length === 0
  const trimmedTag = tag.trim()
  const tagOptions = tags
    ?.filter((item) => item.tag && item.tag !== 'Untagged')
    .map((item) => ({ label: item.tag, value: item.tag }))
  const isAllSelected = totalCount > 0 && selectedIds.length === totalCount

  // Each toggle offers whatever the selection is not entirely already
  const isAllStarred =
    selectedBookmarks.length > 0 &&
    selectedBookmarks.every((bookmark) => bookmark.star)
  const isAllPublic =
    selectedBookmarks.length > 0 &&
    selectedBookmarks.every((bookmark) => bookmark.public)

  const handleRemove = (field: 'description' | 'image') => {
    const count = selectedIds.length

    if (
      confirm(
        `Remove the ${field} of ${count} bookmark${count === 1 ? '' : 's'}? This cannot be undone.`,
      )
    ) {
      mutate({
        type: field === 'description' ? 'clearDescription' : 'clearImage',
      })
    }
  }

  const handleDelete = () => {
    const count = selectedIds.length

    if (
      confirm(
        `Permanently delete ${count} bookmark${count === 1 ? '' : 's'}? This cannot be undone.`,
      )
    ) {
      mutate({ type: 'delete' })
    }
  }

  // Icon-only buttons keep the row short; title doubles as the tooltip
  return (
    <>
      <span className="px-2xs text-step--2 text-theme11">
        {selectedIds.length} selected
      </span>
      <Button
        size="xs"
        variant="ghost"
        onClick={isAllSelected ? onClear : onSelectAll}
        aria-pressed={isAllSelected}
        aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
        title={isAllSelected ? 'Deselect all' : `Select all (${totalCount})`}
      >
        <ChecksIcon size={16} weight={isAllSelected ? 'bold' : 'regular'} />
      </Button>
      {isTrash ? (
        <>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => mutate({ type: 'restore' })}
            aria-label="Un-delete"
            title="Un-delete"
          >
            <ArrowCounterClockwiseIcon size={16} weight="duotone" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={handleDelete}
            aria-label="Permanently delete"
            title="Permanently delete"
          >
            <TrashIcon size={16} weight="duotone" />
          </Button>
        </>
      ) : (
        <>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => {
              playRepeated(isAllStarred ? playPopUpOff : playPopUpOn)
              mutate({ type: 'star', value: !isAllStarred })
            }}
            aria-label={isAllStarred ? 'Unstar' : 'Star'}
            title={isAllStarred ? 'Unstar' : 'Star'}
          >
            <StarIcon size={16} weight={isAllStarred ? 'fill' : 'duotone'} />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => {
              playRepeated(isAllPublic ? playPopOff : playPopOn)
              mutate({ type: 'public', value: !isAllPublic })
            }}
            aria-label={isAllPublic ? 'Make private' : 'Make public'}
            title={isAllPublic ? 'Make private' : 'Make public'}
          >
            {isAllPublic ? (
              <EyeSlashIcon size={16} weight="duotone" />
            ) : (
              <EyeIcon size={16} weight="duotone" />
            )}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => {
              playSweep()
              mutate({ type: 'trash' })
            }}
            aria-label="Trash"
            title="Trash"
          >
            <TrashIcon size={16} weight="duotone" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="xs"
                variant="ghost"
                disabled={isDisabled}
                aria-label="Edit tags, type…"
                title="Edit tags, type…"
              >
                <PencilSimpleIcon size={16} weight="duotone" />
              </Button>
            </PopoverTrigger>
            {/* Greys only: the tag field, the types as icons, then the
                fields to clear, in three bands */}
            <PopoverContent
              className="w-72 border-theme5 bg-theme2 p-0"
              collisionPadding={16}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-3xs p-2xs">
                  {/* The bookmark form's tag suggestions, in a field that
                      looks like a plain one: no arrow, one tag at a time */}
                  <div className="min-w-0 flex-1">
                    <Combobox
                      inputId="bulk-tag"
                      aria-label="Tag"
                      isMulti={false}
                      options={tagOptions}
                      placeholder="Tag"
                      value={
                        trimmedTag
                          ? { label: trimmedTag, value: trimmedTag }
                          : null
                      }
                      onChange={(option) =>
                        setTag(
                          (option as { value: string } | null)?.value ?? '',
                        )
                      }
                      components={{
                        DropdownIndicator: null,
                        IndicatorSeparator: null,
                      }}
                      // @ts-ignore The shared styles are typed for a multi field
                      styles={TAG_FIELD_STYLES}
                      maxMenuHeight={160}
                    />
                  </div>
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    disabled={isDisabled || !trimmedTag}
                    onClick={() => mutate({ tag: trimmedTag, type: 'addTag' })}
                    aria-label="Add tag"
                    title="Add tag"
                  >
                    <PlusCircleIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    disabled={isDisabled || !trimmedTag}
                    onClick={() =>
                      mutate({ tag: trimmedTag, type: 'removeTag' })
                    }
                    aria-label="Remove tag"
                    title="Remove tag"
                  >
                    <MinusCircleIcon size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-4xs border-theme4 border-t p-2xs">
                  {BOOKMARK_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={ICON_BUTTON}
                      disabled={isDisabled}
                      onClick={() => mutate({ type: 'setType', value: type })}
                      aria-label={`Set type: ${type}`}
                      title={`Set type: ${type}`}
                    >
                      <TypeToIcon type={type} size="16" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-s border-theme4 border-t p-2xs">
                  <button
                    type="button"
                    className={TEXT_BUTTON}
                    disabled={isDisabled}
                    onClick={() => handleRemove('description')}
                  >
                    Clear description
                  </button>
                  <button
                    type="button"
                    className={TEXT_BUTTON}
                    disabled={isDisabled}
                    onClick={() => handleRemove('image')}
                  >
                    Clear image
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
    </>
  )
}

import {
  EyeIcon,
  PlusIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import type { Bookmark } from '@/types/db'
import { updateBookmark } from '@/utils/fetching/bookmarks'
import { getTagsOptions } from '@/utils/fetching/tags'
import { getErrorMessage } from '@/utils/get-error-message'
import { Combobox, comboboxStyles } from './Combobox'
import { Dialog, DialogContent } from './Dialog'
import { Flex } from './Flex'

const TILE =
  'focus flex flex-col items-center gap-3xs rounded-lg border-2 border-theme7 p-2xs text-step--2 text-theme10 hover:border-theme9 hover:text-theme12 disabled:opacity-50 aria-pressed:border-theme10 aria-pressed:bg-theme3 aria-pressed:text-theme12'

// The bookmark form's tag list, in a plain field with a violet outline
const TAG_FIELD_STYLES: Record<string, unknown> = {
  ...comboboxStyles,
  // @ts-ignore
  control: (provided, state) => ({
    ...provided,
    ':hover': { borderColor: 'var(--accent9)' },
    backgroundColor: 'var(--theme2)',
    borderColor: state.isFocused ? 'var(--accent9)' : 'var(--accent6)',
    borderRadius: 'var(--radii-m)',
    boxShadow: 'none',
    minHeight: 0,
  }),
}

// The form a link's href takes once the browser has parsed it
const toHref = (url: string) => {
  try {
    return new URL(url).href
  } catch {
    return url
  }
}

/**
 * Remembers which See later bookmark's title was clicked, and when the user
 * comes back to Otter (the page turns visible again, as it does when the
 * bookmark's tab is closed) asks what to do with it. The page must have been
 * hidden in between, so a link opened in a background tab asks nothing.
 */
export const useSeeLaterReturn = (items: Bookmark[]) => {
  const openedRef = useRef<{ bookmark: Bookmark; wasHidden: boolean } | null>(
    null,
  )
  const [returned, setReturned] = useState<Bookmark | null>(null)

  useEffect(() => {
    const handleVisibilityChange = () => {
      const opened = openedRef.current

      if (!opened) {
        return
      }

      if (document.visibilityState === 'hidden') {
        opened.wasHidden = true
      } else if (opened.wasHidden) {
        openedRef.current = null
        setReturned(opened.bookmark)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Left or middle click on a bookmark title
  const handleLinkClick = (event: MouseEvent) => {
    const href = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      'a.link-feed-title',
    )?.href
    const bookmark = href
      ? items.find((item) => item.url && toHref(item.url) === href)
      : undefined

    if (bookmark) {
      openedRef.current = { bookmark, wasHidden: false }
    }
  }

  return {
    clear: () => setReturned(null),
    handleLinkClick,
    returned,
  }
}

interface SeeLaterDialogProps {
  bookmark: Bookmark | null
  onClose: () => void
}

/**
 * Trash, star or make public the bookmark just seen, or tag it: trashing and
 * tagging take it off the See later list
 */
export const SeeLaterDialog = ({ bookmark, onClose }: SeeLaterDialogProps) => {
  const queryClient = useQueryClient()
  const tagInputId = useId()
  const { data: tags } = useQuery(getTagsOptions())
  const [tag, setTag] = useState('')
  const [isPending, setIsPending] = useState(false)
  // Star and public stay open to change, so the dialog shows their state
  const [current, setCurrent] = useState<Bookmark | null>(bookmark)

  useEffect(() => {
    setCurrent(bookmark)
    setTag('')
  }, [bookmark])

  const update = async (
    data: Partial<Bookmark>,
    message: string,
    close: boolean,
  ): Promise<void> => {
    if (!current) {
      return
    }

    setIsPending(true)
    try {
      await updateBookmark(current.id, data)
      setCurrent({ ...current, ...data })
      await queryClient.invalidateQueries()
      toast.success(message, { description: current.title ?? undefined })
      if (close) {
        onClose()
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsPending(false)
    }
  }

  const trimmedTag = tag.trim()
  const tagOptions = tags
    ?.filter((item) => item.tag && item.tag !== 'Untagged')
    .map((item) => ({ label: item.tag, value: item.tag }))

  const tagBookmark = () => {
    if (current && trimmedTag) {
      update(
        {
          see_later: false,
          tags: [...new Set([...(current.tags ?? []), trimmedTag])],
        },
        `Tagged ${trimmedTag}`,
        true,
      )
    }
  }

  return (
    <Dialog
      open={Boolean(bookmark)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        title="Done with it?"
        width="s"
        // The small size is as wide as the sidebar on large screens; widen it
        // there for the tag field. Phones keep the full-screen dialog.
        style={{ '--sidebar-width': '24rem' } as CSSProperties}
      >
        <Flex direction="column" gap="m">
          {/* Long titles and bare URLs wrap, up to three lines */}
          <p className="mt-2xs line-clamp-3 text-step--1 text-theme10 [overflow-wrap:anywhere]">
            {current?.title ?? current?.url}
          </p>
          {/* Three tiles, as the journal and media pickers */}
          <div className="grid grid-cols-3 gap-2xs">
            <button
              type="button"
              className={TILE}
              disabled={isPending}
              onClick={() =>
                update(
                  { see_later: false, status: 'inactive' },
                  'Moved to the trash',
                  true,
                )
              }
            >
              <TrashIcon size={20} weight="duotone" /> Trash
            </button>
            <button
              type="button"
              className={TILE}
              disabled={isPending}
              aria-pressed={current?.star}
              onClick={() =>
                update(
                  { star: !current?.star },
                  current?.star ? 'Unstarred' : 'Starred',
                  false,
                )
              }
            >
              <StarIcon size={20} weight={current?.star ? 'fill' : 'duotone'} />
              {current?.star ? 'Unstar' : 'Star'}
            </button>
            <button
              type="button"
              className={TILE}
              disabled={isPending}
              aria-pressed={current?.public}
              onClick={() =>
                update(
                  { public: !current?.public },
                  current?.public ? 'Made private' : 'Made public',
                  false,
                )
              }
            >
              <EyeIcon
                size={20}
                weight={current?.public ? 'fill' : 'duotone'}
              />
              {current?.public ? 'Private' : 'Public'}
            </button>
          </div>
          {/* The last step, in violet: a tag files the bookmark away */}
          <form
            className="flex flex-col gap-2xs rounded-lg bg-accent3 p-xs"
            onSubmit={(event) => {
              event.preventDefault()
              tagBookmark()
            }}
          >
            <label
              htmlFor={tagInputId}
              className="flex items-center gap-2xs text-step--1 text-accent11"
            >
              <TagIcon size={16} weight="duotone" /> Tag it to file it away
            </label>
            <div className="flex items-center gap-2xs">
              <div className="min-w-0 flex-1">
                <Combobox
                  inputId={tagInputId}
                  isMulti={false}
                  options={tagOptions}
                  value={
                    trimmedTag ? { label: trimmedTag, value: trimmedTag } : null
                  }
                  onChange={(option) =>
                    setTag((option as { value: string } | null)?.value ?? '')
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
                type="submit"
                disabled={isPending || !trimmedTag}
                aria-label="Add tag"
                title="Add tag"
                className="grid size-9 shrink-0 place-items-center rounded-md bg-accent9 text-white hover:bg-accent10 disabled:opacity-50"
              >
                <PlusIcon size={18} weight="bold" />
              </button>
            </div>
          </form>
        </Flex>
      </DialogContent>
    </Dialog>
  )
}

import { useNavigate } from '@tanstack/react-router'
import type { CollectionFolder } from '@/hooks/useCollectionFolders'
import { cn } from '@/utils/classnames'
import { Flex } from './Flex'

interface CollectionFiltersProps {
  folders: CollectionFolder[]
  selectedFolders: string[]
  selectedTags: string[]
}

const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((value) => value !== item) : [...list, item]

/**
 * Two rows of filters on a collection's page: its folders as small grey chips, then the sub-folders of the selected folders as plain text. Both live in the page's search
 * params, so a filtered view can be bookmarked.
 */
export const CollectionFilters = ({
  folders,
  selectedFolders,
  selectedTags,
}: CollectionFiltersProps) => {
  const navigate = useNavigate()
  const openFolders = folders.filter(
    (folder) => selectedFolders.includes(folder.tag) && folder.children.length,
  )

  if (!folders.length) {
    return null
  }

  return (
    <Flex direction="column" gap="xs">
      <div className="flex flex-wrap gap-2xs">
        {folders.map((folder) => {
          const isSelected = selectedFolders.includes(folder.tag)
          const nextFolders = toggle(selectedFolders, folder.tag)
          // Closing a folder also drops its sub-folder filters
          const nextTags = isSelected
            ? selectedTags.filter(
                (tag) => !folder.children.some((child) => child.tag === tag),
              )
            : selectedTags

          return (
            <button
              key={folder.tag}
              type="button"
              aria-pressed={isSelected}
              // Greys only: the violet is kept for Bookmarks / Journals
              className={cn(
                'focus rounded-md px-2xs py-3xs text-step--2',
                isSelected
                  ? 'bg-theme5 text-theme12'
                  : 'text-theme9 hover:text-theme12',
              )}
              onClick={() =>
                navigate({
                  resetScroll: false,
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    folders: nextFolders.length ? nextFolders : undefined,
                    tags: nextTags.length ? nextTags : undefined,
                  }),
                  to: '.',
                })
              }
            >
              {folder.label}
            </button>
          )
        })}
      </div>
      {openFolders.length ? (
        <div className="flex flex-wrap gap-x-s gap-y-3xs pl-3xs">
          {openFolders.flatMap((folder) =>
            folder.children.map((child) => {
              const isActive = selectedTags.includes(child.tag)
              const nextTags = toggle(selectedTags, child.tag)

              return (
                <button
                  key={child.tag}
                  type="button"
                  aria-pressed={isActive}
                  className={cn(
                    'focus text-step--2',
                    isActive
                      ? 'font-medium text-theme12'
                      : 'text-theme9 hover:text-theme12',
                  )}
                  onClick={() =>
                    navigate({
                      resetScroll: false,
                      search: (prev: Record<string, unknown>) => ({
                        ...prev,
                        tags: nextTags.length ? nextTags : undefined,
                      }),
                      to: '.',
                    })
                  }
                >
                  ↳{' '}
                  {openFolders.length > 1
                    ? `${folder.label}:${child.label}`
                    : child.label}
                </button>
              )
            }),
          )}
        </div>
      ) : null}
    </Flex>
  )
}

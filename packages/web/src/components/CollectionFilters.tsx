import { HashIcon } from '@phosphor-icons/react'
import { useNavigate } from '@tanstack/react-router'
import type { CollectionFolder } from '@/hooks/useCollectionFolders'
import { cn } from '@/utils/classnames'
import { Flex } from './Flex'
import { Link } from './Link'

interface CollectionFiltersProps {
  collection: string
  folders: CollectionFolder[]
  selectedFolders: string[]
  selectedTags: string[]
}

const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((value) => value !== item) : [...list, item]

/**
 * Two rows of filters on a collection's page: its folders as pills, then
 * the sub-folders of the selected folders. Both live in the page's search
 * params, so a filtered view can be bookmarked.
 */
export const CollectionFilters = ({
  collection,
  folders,
  selectedFolders,
  selectedTags,
}: CollectionFiltersProps) => {
  const navigate = useNavigate()
  const href = `/collection/${encodeURIComponent(collection)}`
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
              className={cn(
                'focus rounded-full border px-xs py-3xs text-step--2',
                isSelected
                  ? 'border-accent9 bg-accent9 text-white'
                  : 'border-theme6 text-theme11 hover:border-theme8',
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
        <Flex gapX="3xs" gapY="3xs" wrap="wrap">
          {openFolders.flatMap((folder) =>
            folder.children.map((child) => {
              const isActive = selectedTags.includes(child.tag)
              const nextTags = toggle(selectedTags, child.tag)

              return (
                <Link
                  key={child.tag}
                  href={href}
                  // @ts-expect-error How do I type search params?
                  search={(prev: Record<string, unknown>) => ({
                    ...prev,
                    tags: nextTags.length ? nextTags : undefined,
                  })}
                  variant="sidebar"
                  isActive={isActive}
                  aria-pressed={isActive}
                  resetScroll={false}
                >
                  <div className="link-sidebar-inner">
                    <HashIcon weight="duotone" size={18} />
                    {openFolders.length > 1
                      ? `${folder.label}:${child.label}`
                      : child.label}
                  </div>
                </Link>
              )
            }),
          )}
        </Flex>
      ) : null}
    </Flex>
  )
}

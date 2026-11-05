import { BookmarksSimpleIcon, NotebookIcon } from '@phosphor-icons/react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/utils/classnames'

const VIEWS = [
  {
    icon: <BookmarksSimpleIcon size={18} weight="duotone" />,
    label: 'Bookmarks',
    value: undefined,
  },
  {
    icon: <NotebookIcon size={18} weight="duotone" />,
    label: 'Journals',
    value: 'journals',
  },
] as const

/** Two small icon buttons switching between the bookmarks and the journals */
export const ViewSwitch = ({ view }: { view: 'journals' | undefined }) => {
  const navigate = useNavigate()

  return (
    <div className="flex gap-4xs">
      {VIEWS.map(({ icon, label, value }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          aria-pressed={view === value}
          title={label}
          className={cn(
            'focus grid size-8 place-items-center rounded-md',
            // The sidebar's state colours
            view === value
              ? 'bg-accent6 text-accent11 hover:bg-accent7 hover:text-theme11'
              : 'text-theme10 hover:bg-theme5 hover:text-theme11',
          )}
          onClick={() =>
            navigate({
              resetScroll: false,
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                view: value,
              }),
              to: '.',
            })
          }
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

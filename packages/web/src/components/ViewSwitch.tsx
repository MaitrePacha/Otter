import popOffSfx from '@mrmartineau/kit/sounds/pop-off.mp3'
import popOnSfx from '@mrmartineau/kit/sounds/pop-on.mp3'
import useSound from '@mrmartineau/use-sound'
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
  // Public and private's sounds: on into the journals, off back out
  const [playPopOn] = useSound(popOnSfx, { volume: 0.3 })
  const [playPopOff] = useSound(popOffSfx, { volume: 0.3 })

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
            // Greys only: the violet is kept for the folders
            view === value
              ? 'bg-theme5 text-theme12'
              : 'text-theme9 hover:text-theme12',
          )}
          onClick={() => {
            if (view !== value) {
              if (value === 'journals') {
                playPopOn()
              } else {
                playPopOff()
              }
            }
            navigate({
              resetScroll: false,
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                view: value,
              }),
              to: '.',
            })
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

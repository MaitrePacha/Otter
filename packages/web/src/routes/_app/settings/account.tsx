import { createFileRoute } from '@tanstack/react-router'
import { CodeBlock } from '@/components/CodeBlock'
import { UpdateInfoForm } from '@/components/UpdateInfoForm'
import { useUser } from '@/components/UserProvider'
import { SIDEBAR_SECTIONS, type SidebarSection } from '@/types/db'
import { cn } from '@/utils/classnames'
import { getSession } from '@/utils/fetching/user'

export const Route = createFileRoute('/_app/settings/account')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Account settings',
      },
    ],
  }),
  loader: async () => {
    const session = await getSession()
    return session?.user ?? null
  },
})

const SECTION_LABELS: Record<SidebarSection, string> = {
  collections: 'Collections',
  dashboard: 'Dashboard',
  journal: 'Journal',
  media: 'Media',
  public: 'Public',
  seeLater: 'See later',
  stars: 'Stars',
  tags: 'Tags',
  toots: 'Toots (Mastodon)',
  top: 'Top links',
  tweets: 'Tweets',
  types: 'Types',
}

const SidebarSectionsSetting = () => {
  const { profile, handleUpdateUISettings } = useUser()
  const hidden = profile?.settings_hidden_sections ?? []

  // Two columns of switches, also on phones
  return (
    <fieldset>
      <legend className="mb-2xs">Show in the sidebar</legend>
      <ul className="m-0 grid list-none grid-cols-2 gap-x-m p-0 sm:gap-x-l">
        {SIDEBAR_SECTIONS.map((section) => {
          const isShown = !hidden.includes(section)

          return (
            <li key={section}>
              <button
                type="button"
                role="switch"
                aria-checked={isShown}
                className="focus flex w-full items-center justify-between gap-2xs py-2xs text-step--1 text-theme11"
                onClick={() =>
                  handleUpdateUISettings({
                    payload: isShown
                      ? [...hidden, section]
                      : hidden.filter((item) => item !== section),
                    type: 'settings_hidden_sections',
                  })
                }
              >
                <span className="truncate">{SECTION_LABELS[section]}</span>
                <span
                  className={cn(
                    'relative h-4 w-7 shrink-0 rounded-full transition-colors',
                    isShown ? 'bg-accent9' : 'bg-theme5',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-3 rounded-full bg-white transition-all',
                      isShown ? 'left-3.5' : 'left-0.5',
                    )}
                  />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

function RouteComponent() {
  const user = Route.useLoaderData()

  return (
    <article className="flow">
      <h3>User info</h3>
      Account ID: <CodeBlock>{user?.id}</CodeBlock>
      <h3>Update account</h3>
      <UpdateInfoForm user={user} />
      <h3>Preferences</h3>
      <SidebarSectionsSetting />
    </article>
  )
}

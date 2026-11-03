import { CheckIcon, EyeSlashIcon } from '@phosphor-icons/react'
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

  // A row of toggles in the sidebar tabs' style: a shown section looks like
  // the active tab, a hidden one like an idle tab
  return (
    <fieldset>
      <legend className="mb-2xs ml-1 text-step--2 uppercase tracking-wide">
        Show in the sidebar
      </legend>
      <div className="flex flex-wrap gap-3xs">
        {SIDEBAR_SECTIONS.map((section) => {
          const isShown = !hidden.includes(section)

          return (
            <button
              key={section}
              type="button"
              aria-pressed={isShown}
              className={cn(
                'focus flex items-center gap-3xs rounded-md px-2xs py-3xs text-step--2 font-medium',
                isShown
                  ? 'bg-accent6 text-accent11 hover:bg-accent7'
                  : 'text-theme10 hover:bg-theme5 hover:text-theme11',
              )}
              onClick={() =>
                handleUpdateUISettings({
                  payload: isShown
                    ? [...hidden, section]
                    : hidden.filter((item) => item !== section),
                  type: 'settings_hidden_sections',
                })
              }
            >
              {isShown ? (
                <CheckIcon size={14} weight="bold" />
              ) : (
                <EyeSlashIcon size={14} weight="duotone" />
              )}
              {SECTION_LABELS[section]}
            </button>
          )
        })}
      </div>
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

import { cx } from '../lib/util.js'
import { useLang } from '../lib/i18n.js'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
  { key: 'browse', label: 'Browse', icon: 'fa-book-open' },
  { key: 'plan', label: 'Week', icon: 'fa-calendar-week' },
  { key: 'market', label: 'Market', icon: 'fa-basket-shopping' },
  { key: 'cookbook', label: 'Saved', icon: 'fa-bookmark' },
]

export default function Sidebar({ view, onView, menuCount, cookbookCount, onGenerate }) {
  const { t } = useLang()
  const badges = { plan: menuCount, cookbook: cookbookCount }

  const item = (n, layout) => {
    const active = view === n.key
    const badge = badges[n.key]
    return (
      <button
        key={n.key}
        onClick={() => onView(n.key)}
        aria-current={active ? 'page' : undefined}
        className={cx(
          'group relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-colors',
          layout === 'rail' ? 'w-full' : 'min-w-0 flex-1',
          active ? 'text-brand-700 dark:text-brand-300' : 'text-muted hover:text-ink-2',
        )}
      >
        <span
          className={cx(
            'relative flex h-11 w-11 items-center justify-center rounded-2xl text-lg transition-all',
            active ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30' : 'bg-surface-2 group-hover:bg-brand-50',
          )}
        >
          <i className={`fa-solid ${n.icon}`} aria-hidden />
          {badge > 0 && (
            <span className="bg-amber-ink absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
        </span>
        <span className="w-full truncate text-center text-[10px] leading-none font-bold tracking-wide">
          {t(n.label)}
        </span>
      </button>
    )
  }

  return (
    <>
      {/* Desktop rail */}
      <nav className="card no-print sticky top-4 hidden h-[calc(100vh-2rem)] w-24 shrink-0 flex-col items-center gap-1 p-3 md:flex">
        <a
          href="#main"
          className="text-brand-600 mb-2 flex h-11 w-11 items-center justify-center rounded-2xl text-xl"
          title={t('Maru Recipe Book')}
        >
          <i className="fa-solid fa-bowl-food" aria-hidden />
        </a>
        {NAV.map((n) => item(n, 'rail'))}
        <div className="mt-auto flex w-full flex-col items-center gap-1 pt-2">
          <button
            onClick={onGenerate}
            className="group flex w-full cursor-pointer flex-col items-center gap-1 rounded-2xl px-1 py-2"
            title={t('Generate 10 recipes for the week')}
          >
            <span className="bg-amber-soft text-amber-ink flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-current/40 text-lg transition-transform group-hover:scale-105 group-active:scale-95">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden />
            </span>
            <span className="text-amber-ink w-full truncate text-center text-[10px] leading-none font-bold tracking-wide">
              {t('Generate')}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile: five tabs in the bar, generate as a floating button above it.
          Hidden on the dashboard and the week plan — both already show a Generate
          button in the content, and there the FAB just sits on top of the cards. */}
      {!['dashboard', 'plan'].includes(view) && (
        <button
          onClick={onGenerate}
          className="bg-brand-500 no-print fixed right-4 bottom-24 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl text-xl text-white shadow-lg shadow-brand-500/40 active:scale-95 md:hidden"
          title={t('Generate 10 recipes for the week')}
          aria-label={t('Generate 10 recipes for the week')}
        >
          <i className="fa-solid fa-wand-magic-sparkles" aria-hidden />
        </button>
      )}

      <nav className="card no-print fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-0.5 rounded-b-none border-b-0 px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden">
        {NAV.map((n) => item(n, 'bar'))}
      </nav>
    </>
  )
}

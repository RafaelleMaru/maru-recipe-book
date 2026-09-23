import { categoryIcon, CUISINES, CUISINE_META, cx, fmtTime, SERVING_MODES, totalTime } from '../lib/util.js'
import { menuStats, QUICK_MINUTES } from '../lib/planner.js'
import { useLang } from '../lib/i18n.js'
import { CuisineDot, EmptyState, RecipeImage, SectionHeader, Stat } from './common.jsx'

export default function Dashboard({
  menu,
  counts,
  servings,
  onGenerate,
  onView,
  onOpen,
  onToggleMenu,
  onCuisine,
  quickPicks,
}) {
  const { t } = useLang()
  const stats = menuStats(menu)
  const mode = SERVING_MODES[servings]

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <section className="card relative overflow-hidden p-6 sm:p-7">
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-brand-100 opacity-70 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4">
          <div>
            <p className="text-brand-600 dark:text-brand-300 text-xs font-bold tracking-[0.18em] uppercase">
              {t('Maru Recipe Book')}
            </p>
            <h1 className="mt-2 text-2xl leading-tight font-extrabold sm:text-3xl">
              {t('What are we cooking this week?')}
            </h1>
            <p className="text-ink-2 mt-2 max-w-2xl text-sm leading-relaxed">
              {t(
                '{total} authentic home recipes across {n} cuisines. Hit generate and the planner builds a balanced ten-dish week — no repeats, spread across cuisines and proteins, with two vegetable-forward dishes and at least three fast ones. Portions are set for {mode}.',
                { total: counts.total, n: CUISINES.length, mode: t(mode.label).toLowerCase() },
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onGenerate} className="btn-primary">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> {t('Generate 10 recipes')}
            </button>
            <button onClick={() => onView('browse')} className="btn-soft">
              <i className="fa-solid fa-book-open" aria-hidden /> {t('Browse the book')}
            </button>
            {menu.length > 0 && (
              <button onClick={() => onView('market')} className="btn-amber">
                <i className="fa-solid fa-basket-shopping" aria-hidden /> {t('Market list')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon="fa-calendar-week"
          value={stats.count}
          label={t(stats.count === 1 ? 'dish on the menu' : 'dishes on the menu')}
        />
        <Stat icon="fa-hourglass-half" value={fmtTime(stats.minutes)} label={t('total cooking time')} tone="plain" />
        <Stat icon="fa-earth-asia" value={stats.cuisines} label={t('cuisines this week')} tone="plain" />
        <Stat
          icon="fa-child-reaching"
          value={`${stats.kid}/${stats.count || 0}`}
          label={t('kid-approved')}
          tone="amber"
        />
      </section>

      {/* This week */}
      <section>
        <SectionHeader
          title={t("This week's menu")}
          hint={
            menu.length
              ? t('{quick} quick · {veg} meat-free · avg {avg} per dish', {
                  quick: stats.quick,
                  veg: stats.veg,
                  avg: fmtTime(stats.avgMinutes),
                })
              : t('Nothing picked yet')
          }
          action={
            menu.length > 0 && (
              <button onClick={() => onView('plan')} className="btn-ghost text-xs">
                {t('Plan the days')} <i className="fa-solid fa-arrow-right" aria-hidden />
              </button>
            )
          }
        />
        {menu.length === 0 ? (
          <EmptyState
            icon="fa-wand-magic-sparkles"
            title={t('The week is empty')}
            action={
              <button onClick={onGenerate} className="btn-primary mt-1">
                <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> {t('Generate 10 recipes')}
              </button>
            }
          >
            {t(
              'Generate a balanced ten-dish week, or browse and add dishes one by one. Everything stays on this computer and can be exported to a file.',
            )}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {menu.map((r) => (
              <div key={r.id} className="card group relative overflow-hidden">
                <button onClick={() => onOpen(r)} className="block w-full cursor-pointer text-left">
                  <RecipeImage recipe={r} className="h-24 w-full" />
                  <span className="block p-2.5">
                    <span className="line-clamp-2 text-xs leading-snug font-bold">{r.title}</span>
                    <span className="meta mt-1 flex items-center gap-1.5">
                      <CuisineDot cuisine={r.cuisine} />
                      {fmtTime(totalTime(r))}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => onToggleMenu(r)}
                  className="absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white/90 text-xs text-red-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
                  title={t('Remove from the week')}
                  aria-label={t('Remove {title} from the week', { title: r.title })}
                >
                  <i className="fa-solid fa-xmark" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cuisine library */}
      <section>
        <SectionHeader
          title={t('Search by cuisine')}
          hint={t("Each collection is researched from that country's own home cooks")}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CUISINES.map((c) => {
            const meta = CUISINE_META[c] ?? {}
            return (
              <button
                key={c}
                onClick={() => onCuisine(c)}
                className={cx(
                  'card flex cursor-pointer flex-col items-center gap-1.5 bg-gradient-to-br p-4 transition-transform hover:-translate-y-0.5',
                  meta.tint,
                  'dark:bg-none',
                )}
              >
                <CuisineDot cuisine={c} size={16} />
                <span className="text-sm font-extrabold text-brand-800 dark:text-ink">{c}</span>
                <span className="text-[11px] font-bold text-brand-700/70 dark:text-muted">
                  {t('{n} recipes', { n: counts.cuisines[c] ?? 0 })}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Quick picks */}
      {quickPicks.length > 0 && (
        <section>
          <SectionHeader
            title={t('Weeknight rescue')}
            hint={t('Ready in {n} minutes or less, not on the menu yet', { n: QUICK_MINUTES })}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickPicks.map((r) => (
              <div key={r.id} className="card flex items-center gap-3 p-3">
                <button onClick={() => onOpen(r)} className="min-w-0 flex-1 cursor-pointer text-left">
                  <span className="line-clamp-1 text-sm font-bold">{r.title}</span>
                  <span className="meta mt-1 flex items-center gap-2">
                    <i className={`fa-solid ${categoryIcon(r.categories[0])} text-brand-500`} aria-hidden />
                    {fmtTime(totalTime(r))} · {r.cuisine}
                  </span>
                </button>
                <button
                  onClick={() => onToggleMenu(r)}
                  className="btn-icon bg-brand-100 text-brand-700 shrink-0"
                  title={t('Add to the week')}
                  aria-label={t('Add {title} to the week', { title: r.title })}
                >
                  <i className="fa-solid fa-plus" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

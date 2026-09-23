import { DAYS, cx, fmtTime, portionsFor, SERVING_MODES, totalTime } from '../lib/util.js'
import { menuStats } from '../lib/planner.js'
import { useLang } from '../lib/i18n.js'
import { CuisineDot, EmptyState, RecipeImage, SectionHeader, SpiceMeter } from './common.jsx'

/**
 * The weekly menu: every picked dish, optionally pinned to a day.
 * Days are a convenience — a dish can sit in the menu unassigned.
 */
export default function WeekPlan({
  menu,
  plan,
  servings,
  onAssign,
  onOpen,
  onRemove,
  onClear,
  onGenerate,
  onSwap,
  onView,
}) {
  const { t } = useLang()
  const stats = menuStats(menu)
  const portions = portionsFor(servings)
  const assignedIds = Object.values(plan).filter(Boolean)
  const unassigned = menu.filter((r) => !assignedIds.includes(r.id))

  if (menu.length === 0) {
    return (
      <EmptyState
        icon="fa-calendar-week"
        title={t('No dishes on the week yet')}
        action={
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <button onClick={onGenerate} className="btn-primary">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> {t('Generate 10 recipes')}
            </button>
            <button onClick={() => onView('browse')} className="btn-soft">
              <i className="fa-solid fa-book-open" aria-hidden /> {t('Browse instead')}
            </button>
          </div>
        }
      >
        {t('Generate a balanced week or add dishes from the book, then drop each one onto a day.')}
      </EmptyState>
    )
  }

  // Phones stack this: dish on top, controls on their own full-width row.
  // Everything sits on one line from `sm` up.
  const row = (recipe, day) => (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={() => onOpen(recipe)}
          className="shrink-0 cursor-pointer"
          aria-label={t('Open {title}', { title: recipe.title })}
        >
          <RecipeImage recipe={recipe} className="h-14 w-20 rounded-xl" />
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => onOpen(recipe)} className="w-full cursor-pointer text-left">
            <span className="line-clamp-2 text-sm leading-snug font-bold hover:text-brand-600">{recipe.title}</span>
          </button>
          <div className="meta mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CuisineDot cuisine={recipe.cuisine} /> {recipe.cuisine}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="fa-solid fa-clock text-brand-500" aria-hidden /> {fmtTime(totalTime(recipe))}
            </span>
            <SpiceMeter level={recipe.spicy} showLabel={false} />
            {recipe.kidFriendly && (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-amber-ink">
                <i className="fa-solid fa-child-reaching" aria-hidden /> {t('kid-ok')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="no-print flex shrink-0 items-center gap-1.5">
        <select
          value={day ?? ''}
          onChange={(e) => onAssign(recipe.id, e.target.value || null)}
          className="field min-w-0 flex-1 py-2 text-xs font-bold sm:w-auto sm:max-w-[8.5rem] sm:flex-none sm:py-1.5"
          aria-label={t('Day for {title}', { title: recipe.title })}
        >
          <option value="">{t('Any day')}</option>
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {t(d)}
            </option>
          ))}
        </select>
        <button
          onClick={() => onSwap(recipe)}
          className="btn-icon border-line text-muted hover:bg-surface-2 shrink-0 border"
          title={t('Swap for a different dish')}
          aria-label={t('Swap {title}', { title: recipe.title })}
        >
          <i className="fa-solid fa-shuffle" aria-hidden />
        </button>
        <button
          onClick={() => onRemove(recipe)}
          className="btn-icon border-line text-muted hover:bg-surface-2 hover:text-red-500 shrink-0 border"
          title={t('Remove from the week')}
          aria-label={t('Remove {title}', { title: recipe.title })}
        >
          <i className="fa-solid fa-trash-can" aria-hidden />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h1 className="panel-title text-lg">{t("This week's menu")}</h1>
          <p className="meta mt-1">
            {t('{n} dishes · {time} total cooking · {c} cuisines · cooking for {mode} ({p} portions)', {
              n: stats.count,
              time: fmtTime(stats.minutes),
              c: stats.cuisines,
              mode: t(SERVING_MODES[servings].label).toLowerCase(),
              p: portions,
            })}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button onClick={onGenerate} className="btn-soft text-xs">
            <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> {t('Generate more')}
          </button>
          <button onClick={() => onView('market')} className="btn-amber text-xs">
            <i className="fa-solid fa-basket-shopping" aria-hidden /> {t('Market list')}
          </button>
          <button onClick={() => window.print()} className="btn-ghost text-xs">
            <i className="fa-solid fa-print" aria-hidden /> {t('Print')}
          </button>
          <button onClick={onClear} className="btn-ghost text-xs hover:text-red-500">
            <i className="fa-solid fa-broom" aria-hidden /> {t('Clear week')}
          </button>
        </div>
      </section>

      {/* Day-by-day */}
      <section>
        <SectionHeader
          title={t('Day by day')}
          hint={t('Pick a day for each dish — anything left over sits in the pool below')}
        />
        <div className="flex flex-col gap-2">
          {DAYS.map((day) => {
            const recipe = menu.find((r) => r.id === plan[day])
            return (
              <div
                key={day}
                className={cx('card flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:gap-3', !recipe && 'border-dashed')}
              >
                {/* A compact pill on phones, the square day tile from sm up. */}
                <span className="bg-brand-50 text-brand-700 dark:text-brand-300 flex shrink-0 items-center gap-2 self-start rounded-xl px-2.5 py-1 sm:h-14 sm:w-14 sm:flex-col sm:justify-center sm:gap-0 sm:self-auto sm:rounded-2xl sm:px-0 sm:py-0">
                  <span className="text-[10px] font-bold tracking-wide uppercase">{t(day)}</span>
                  <i className="fa-solid fa-utensils text-xs opacity-60 sm:mt-0.5" aria-hidden />
                </span>
                {recipe ? (
                  row(recipe, day)
                ) : (
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <p className="meta">{t('Nothing planned')}</p>
                    <select
                      value=""
                      onChange={(e) => e.target.value && onAssign(e.target.value, day)}
                      className="field no-print w-full py-2 text-xs font-bold sm:w-auto sm:max-w-[12rem] sm:py-1.5"
                      aria-label={t('Choose a dish for {day}', { day: t(day) })}
                    >
                      <option value="">{t('Choose a dish…')}</option>
                      {unassigned.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Unassigned pool */}
      {unassigned.length > 0 && (
        <section>
          <SectionHeader
            title={t('Still to schedule')}
            hint={t(
              unassigned.length === 1 ? '{n} dish on the menu without a day' : '{n} dishes on the menu without a day',
              { n: unassigned.length },
            )}
          />
          <div className="flex flex-col gap-2">
            {unassigned.map((r) => (
              <div key={r.id} className="card flex items-center gap-3 p-3">
                {row(r, null)}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

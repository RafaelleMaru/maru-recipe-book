import { useEffect, useState } from 'react'
import { CATEGORY_META, categoryIcon, categoryLabel, cx, CUISINES } from '../lib/util.js'
import { useLang } from '../lib/i18n.js'
import { CuisineDot, EmptyState } from './common.jsx'
import RecipeCard from './RecipeCard.jsx'

// With 250+ recipes, rendering every card at once makes a phone crawl.
const PAGE = 36

const TOGGLES = [
  { key: 'kidOnly', label: 'Kid-approved', icon: 'fa-child-reaching' },
  { key: 'vegOnly', label: 'Meat-free', icon: 'fa-leaf' },
  { key: 'quickOnly', label: '35 min or less', icon: 'fa-bolt' },
  { key: 'mildOnly', label: 'Not spicy', icon: 'fa-seedling' },
]

const SORTS = [
  { key: 'relevance', label: 'Best match' },
  { key: 'title', label: 'A → Z' },
  { key: 'time', label: 'Fastest first' },
  { key: 'cuisine', label: 'By cuisine' },
  { key: 'spice', label: 'Mildest first' },
]

export default function Browse({
  recipes,
  filters,
  setFilters,
  counts,
  query,
  onOpen,
  onToggleMenu,
  onToggleSave,
  menuIds,
  cookbookIds,
  onClear,
  title,
  hint,
}) {
  const { t } = useLang()
  const [shown, setShown] = useState(PAGE)

  // Any change to the result set starts the list over at the top.
  useEffect(() => setShown(PAGE), [recipes.length, query, title])

  const toggleIn = (key, value) =>
    setFilters((f) => {
      const list = f[key] ?? []
      return { ...f, [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] }
    })

  const activeCount =
    filters.cuisines.length +
    filters.categories.length +
    TOGGLES.filter((x) => filters[x.key]).length +
    (query ? 1 : 0)

  const usedCategories = Object.keys(CATEGORY_META).filter((c) => counts.categories[c] > 0)

  const defaultHint = query
    ? t('{n} of {total} recipes matching “{q}”', { n: recipes.length, total: counts.total, q: query })
    : t('{n} of {total} recipes', { n: recipes.length, total: counts.total })

  return (
    <div className="flex flex-col gap-4">
      <section className="card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="panel-title text-lg">{title ?? t('Browse recipes')}</h1>
            <p className="meta mt-0.5">{hint ?? defaultHint}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="meta flex items-center gap-2">
              <span className="hidden sm:inline">{t('Sort')}</span>
              <select
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
                className="field w-auto py-1.5 text-xs font-bold"
              >
                {SORTS.filter((s) => s.key !== 'relevance' || query).map((s) => (
                  <option key={s.key} value={s.key}>
                    {t(s.label)}
                  </option>
                ))}
              </select>
            </label>
            {activeCount > 0 && (
              <button onClick={onClear} className="btn-ghost text-xs">
                <i className="fa-solid fa-filter-circle-xmark" aria-hidden /> {t('Clear ({n})', { n: activeCount })}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <button
                key={c}
                onClick={() => toggleIn('cuisines', c)}
                className={cx('chip-btn', filters.cuisines.includes(c) && 'chip-on')}
              >
                <CuisineDot cuisine={c} />
                {c}
                <span className={cx('text-[10px] font-bold', filters.cuisines.includes(c) ? 'text-white/70' : 'text-muted')}>
                  {counts.cuisines[c] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="border-line flex flex-wrap gap-2 border-t pt-3">
            {usedCategories.map((c) => (
              <button
                key={c}
                onClick={() => toggleIn('categories', c)}
                className={cx('chip-btn', filters.categories.includes(c) && 'chip-on')}
              >
                <i className={`fa-solid ${categoryIcon(c)}`} aria-hidden />
                {t(categoryLabel(c))}
                <span
                  className={cx('text-[10px] font-bold', filters.categories.includes(c) ? 'text-white/70' : 'text-muted')}
                >
                  {counts.categories[c]}
                </span>
              </button>
            ))}
          </div>

          <div className="border-line flex flex-wrap gap-2 border-t pt-3">
            {TOGGLES.map((x) => (
              <button
                key={x.key}
                onClick={() => setFilters((f) => ({ ...f, [x.key]: !f[x.key] }))}
                className={cx('chip-btn', filters[x.key] && 'chip-on')}
              >
                <i className={`fa-solid ${x.icon}`} aria-hidden />
                {t(x.label)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {recipes.length === 0 ? (
        <EmptyState
          icon="fa-magnifying-glass"
          title={t('Nothing matches that yet')}
          action={
            <button onClick={onClear} className="btn-soft mt-1">
              <i className="fa-solid fa-rotate-left" aria-hidden /> {t('Reset the filters')}
            </button>
          }
        >
          {t('Try a single word like')} <em>manok</em>, <em>gata</em> {t('or')} <em>noodles</em>,{' '}
          {t('or drop one of the filters above.')}
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.slice(0, shown).map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onOpen={onOpen}
                onToggleMenu={onToggleMenu}
                onToggleSave={onToggleSave}
                inMenu={menuIds.includes(r.id)}
                saved={cookbookIds.includes(r.id)}
              />
            ))}
          </div>
          {recipes.length > shown && (
            <button onClick={() => setShown((n) => n + PAGE)} className="btn-soft mx-auto">
              <i className="fa-solid fa-plus" aria-hidden />
              {/* Both wrapped so the button's flex gap applies between them. */}
              <span>{t('Show {n} more', { n: Math.min(PAGE, recipes.length - shown) })}</span>
              <span className="text-brand-700/60 dark:text-brand-300/60 font-normal">
                {shown}/{recipes.length}
              </span>
            </button>
          )}
        </>
      )}
    </div>
  )
}

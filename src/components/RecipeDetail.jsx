import { useEffect, useMemo, useState } from 'react'
import {
  categoryIcon,
  categoryLabel,
  cx,
  fmtQty,
  fmtTime,
  portionsFor,
  scaleQty,
  totalTime,
} from '../lib/util.js'
import { isVegetarian } from '../lib/planner.js'
import { recipeText, useLang } from '../lib/i18n.js'
import { CuisineDot, RecipeImage, SpiceMeter } from './common.jsx'

export default function RecipeDetail({ recipe, servings, inMenu, saved, onToggleMenu, onToggleSave, onBack, onTag }) {
  const { lang, t } = useLang()
  const [portions, setPortions] = useState(portionsFor(servings))

  // Follow the global 2-adults / family switch, but allow a local override for guests.
  // Both effects use a block body on purpose: an effect must return either nothing
  // or a cleanup function, and `scrollTo` returns a promise in some engines.
  useEffect(() => {
    setPortions(portionsFor(servings))
  }, [servings, recipe.id])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [recipe.id])

  const factor = portions / recipe.servings
  const text = recipeText(recipe, lang)

  // Ingredients keep their English group headings but show translated names.
  const groups = useMemo(() => {
    const out = new Map()
    recipe.ingredients.forEach((ing, i) => {
      const key = ing.group || 'Ingredients'
      if (!out.has(key)) out.set(key, [])
      out.get(key).push({ ...ing, name: text.ingredientNames[i] })
    })
    return [...out.entries()]
  }, [recipe, text])

  return (
    <div className="pop-in grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      {/* ---------------------------------------------------------- main column */}
      <div className="flex flex-col gap-4">
        <section className="card overflow-hidden">
          <div className="relative">
            <RecipeImage recipe={recipe} className="h-56 w-full sm:h-72" />
            <button
              onClick={onBack}
              className="no-print absolute top-4 left-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-white/90 text-brand-800 shadow-sm hover:bg-white"
              aria-label={t('Back to browsing')}
            >
              <i className="fa-solid fa-chevron-left" aria-hidden />
            </button>
            <div className="no-print absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-white/90 text-brand-800 shadow-sm hover:bg-white"
                title={t('Print this recipe')}
                aria-label={t('Print')}
              >
                <i className="fa-solid fa-print" aria-hidden />
              </button>
              <button
                onClick={() => onToggleSave(recipe)}
                className={cx(
                  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl shadow-sm',
                  saved ? 'bg-amber-soft text-amber-ink' : 'bg-white/90 text-brand-800 hover:bg-white',
                )}
                title={t(saved ? 'Remove from cookbook' : 'Save to cookbook')}
                aria-label={t('Save to cookbook')}
              >
                <i className={cx(saved ? 'fa-solid' : 'fa-regular', 'fa-bookmark')} aria-hidden />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-brand-700 dark:text-brand-300 text-2xl leading-tight font-extrabold">{recipe.title}</h1>
                {recipe.localTitle && <p className="text-muted mt-1 text-sm font-semibold italic">{recipe.localTitle}</p>}
              </div>
              <button onClick={() => onTag({ type: 'cuisine', value: recipe.cuisine })} className="chip-btn text-sm">
                <CuisineDot cuisine={recipe.cuisine} /> {recipe.cuisine}
              </button>
            </div>

            <p className="text-ink-2 text-sm leading-relaxed">{text.description}</p>

            <div className="border-line flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3">
              <span className="meta inline-flex items-center gap-1.5">
                <i className="fa-solid fa-clock text-brand-500" aria-hidden /> {t('Prep')} {fmtTime(recipe.prepMinutes)}
              </span>
              <span className="meta inline-flex items-center gap-1.5">
                <i className="fa-solid fa-fire-burner text-brand-500" aria-hidden /> {t('Cook')} {fmtTime(recipe.cookMinutes)}
              </span>
              <span className="meta inline-flex items-center gap-1.5 font-bold">
                <i className="fa-solid fa-hourglass-half text-brand-500" aria-hidden /> {t('Total')}{' '}
                {fmtTime(totalTime(recipe))}
              </span>
              <span className="meta inline-flex items-center gap-1.5">
                <i className="fa-solid fa-gauge-simple-high text-brand-500" aria-hidden /> {t(recipe.difficulty)}
              </span>
              <SpiceMeter level={recipe.spicy} />
              {isVegetarian(recipe) && (
                <span className="meta inline-flex items-center gap-1.5">
                  <i className="fa-solid fa-leaf text-brand-500" aria-hidden /> {t('Meat-free')}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {recipe.categories.map((c) => (
                <button key={c} onClick={() => onTag({ type: 'category', value: c })} className="chip-btn">
                  <i className={`fa-solid ${categoryIcon(c)}`} aria-hidden /> {t(categoryLabel(c))}
                </button>
              ))}
              {recipe.tags?.map((tag) => (
                <span key={tag} className="chip">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="card p-5">
          <h2 className="panel-title mb-4 flex items-center gap-2">
            <i className="fa-solid fa-list-ol" aria-hidden /> {t('Steps')}
          </h2>
          <ol className="flex flex-col gap-3.5">
            {text.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="step-no">{i + 1}</span>
                <p className="text-ink-2 pt-0.5 text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          {text.tips?.length > 0 && (
            <div className="border-line mt-5 border-t pt-4">
              <h3 className="text-amber-ink mb-2 flex items-center gap-2 text-sm font-bold">
                <i className="fa-solid fa-lightbulb" aria-hidden /> {t('Kitchen notes')}
              </h3>
              <ul className="flex flex-col gap-2">
                {text.tips.map((tip, i) => (
                  <li key={i} className="text-ink-2 flex gap-2 text-sm leading-relaxed">
                    <i className="fa-solid fa-circle text-brand-300 mt-1.5 text-[5px]" aria-hidden />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* --------------------------------------------------------- side column */}
      <div className="flex flex-col gap-4">
        {/* Ingredients with live scaling */}
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="panel-title flex items-center gap-2">
              <i className="fa-solid fa-basket-shopping" aria-hidden /> {t('Ingredients')}
            </h2>
            <div className="no-print bg-surface-2 flex items-center gap-1 rounded-xl p-1">
              <button
                onClick={() => setPortions((p) => Math.max(1, p - 1))}
                className="hover:bg-surface flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-xs"
                aria-label={t('Fewer portions')}
              >
                <i className="fa-solid fa-minus" aria-hidden />
              </button>
              <span className="min-w-16 text-center text-xs font-bold">{t('{n} portions', { n: portions })}</span>
              <button
                onClick={() => setPortions((p) => Math.min(20, p + 1))}
                className="hover:bg-surface flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-xs"
                aria-label={t('More portions')}
              >
                <i className="fa-solid fa-plus" aria-hidden />
              </button>
            </div>
          </div>

          {factor !== 1 && (
            <p className="meta mb-3">
              {t('Scaled ×{factor} from the original {n}-portion recipe.', {
                factor: Math.round(factor * 100) / 100,
                n: recipe.servings,
              })}
            </p>
          )}

          {groups.map(([group, items]) => (
            <div key={group} className="mb-3 last:mb-0">
              {groups.length > 1 && (
                <h3 className="text-muted mb-2 text-xs font-bold tracking-wide uppercase">{t(group)}</h3>
              )}
              <ul className="grid gap-2 sm:grid-cols-2">
                {items.map((ing, i) => {
                  const qty = scaleQty(ing.qty, ing.unit, factor)
                  return (
                    <li key={i} className="bg-surface-2 rounded-2xl px-3 py-2">
                      <span className="block text-xs leading-snug font-bold">
                        {qty === null ? t('To taste') : `${fmtQty(qty)}${ing.unit ? ` ${ing.unit}` : ''}`}
                      </span>
                      <span className="text-ink-2 block text-xs leading-snug">{ing.name}</span>
                      {ing.note && <span className="text-muted mt-0.5 block text-[11px] italic">{ing.note}</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>

        {/* Family + health notes */}
        {(text.kidNote || text.nutritionNote) && (
          <section className="card flex flex-col gap-3 p-5">
            {text.kidNote && (
              <div>
                <h3 className="text-amber-ink mb-1.5 flex items-center gap-2 text-sm font-bold">
                  <i className="fa-solid fa-child-reaching" aria-hidden /> {t('For the kids')}
                </h3>
                <p className="text-ink-2 text-sm leading-relaxed">{text.kidNote}</p>
              </div>
            )}
            {text.nutritionNote && (
              <div className={text.kidNote ? 'border-line border-t pt-3' : ''}>
                <h3 className="text-brand-700 dark:text-brand-300 mb-1.5 flex items-center gap-2 text-sm font-bold">
                  <i className="fa-solid fa-heart-pulse" aria-hidden /> {t('Balance it')}
                </h3>
                <p className="text-ink-2 text-sm leading-relaxed">{text.nutritionNote}</p>
              </div>
            )}
          </section>
        )}

        {/* Actions */}
        <section className="card no-print flex flex-col gap-2 p-5">
          <button onClick={() => onToggleMenu(recipe)} className={inMenu ? 'btn-ghost' : 'btn-primary'}>
            <i className={`fa-solid ${inMenu ? 'fa-circle-minus' : 'fa-circle-plus'}`} aria-hidden />
            {t(inMenu ? 'Remove from this week' : 'Add to this week')}
          </button>
          <button onClick={() => onToggleSave(recipe)} className="btn-amber">
            <i className={cx(saved ? 'fa-solid' : 'fa-regular', 'fa-bookmark')} aria-hidden />
            {t(saved ? 'Saved in cookbook' : 'Save to cookbook')}
          </button>
          {recipe.source?.url && (
            <a href={recipe.source.url} target="_blank" rel="noreferrer noopener" className="btn-ghost">
              <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden />
              {t('Method checked against {source}', { source: recipe.source.name })}
            </a>
          )}
        </section>
      </div>
    </div>
  )
}

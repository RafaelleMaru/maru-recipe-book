import { useMemo } from 'react'
import { cx, fmtQty, portionsFor, SERVING_MODES } from '../lib/util.js'
import { buildShoppingList } from '../lib/planner.js'
import { ingredientName, useLang } from '../lib/i18n.js'
import { EmptyState, SectionHeader } from './common.jsx'

/** One consolidated market list for everything on the week's menu. */
export default function MarketList({ menu, servings, checked, onToggle, onClearChecks, onGenerate, onView, onCopied }) {
  const { lang, t } = useLang()
  const portions = portionsFor(servings)

  const groups = useMemo(
    () =>
      buildShoppingList(
        menu,
        (recipe) => portions / recipe.servings,
        (recipe, index) => ingredientName(recipe, index, lang),
      ),
    [menu, portions, lang],
  )

  const all = groups.flatMap((g) => g.items)
  const doneCount = all.filter((i) => checked[i.key]).length
  const progress = all.length ? Math.round((doneCount / all.length) * 100) : 0

  const asText = () =>
    groups
      .map((g) => {
        const lines = g.items.map((i) => {
          const amount = i.toTaste && i.qty === null ? t('to taste') : `${fmtQty(i.qty)}${i.unit ? ` ${i.unit}` : ''}`
          return `  [ ] ${amount} — ${i.item}`
        })
        return `${t(g.key)}\n${lines.join('\n')}`
      })
      .join('\n\n')

  const copy = async () => {
    const header = t('{n} items for {m} dishes · scaled for {mode} ({p} portions)', {
      n: all.length,
      m: menu.length,
      mode: t(SERVING_MODES[servings].label),
      p: portions,
    })
    try {
      await navigator.clipboard.writeText(`${t('Market list')} — ${header}\n\n${asText()}`)
      onCopied(t('Market list copied — paste it into Messenger or Notes.'))
    } catch {
      onCopied(t('Could not reach the clipboard. Use Print instead.'), 'warn')
    }
  }

  if (menu.length === 0) {
    return (
      <EmptyState
        icon="fa-basket-shopping"
        title={t('Nothing to buy yet')}
        action={
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <button onClick={onGenerate} className="btn-primary">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden /> {t('Generate 10 recipes')}
            </button>
            <button onClick={() => onView('browse')} className="btn-soft">
              <i className="fa-solid fa-book-open" aria-hidden /> {t('Browse the book')}
            </button>
          </div>
        }
      >
        {t(
          'The market list builds itself from whatever is on the week’s menu, merged by ingredient and scaled to your serving size.',
        )}
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="panel-title text-lg">{t('Market list')}</h1>
            <p className="meta mt-1">
              {t('{n} items for {m} dishes · scaled for {mode} ({p} portions)', {
                n: all.length,
                m: menu.length,
                mode: t(SERVING_MODES[servings].label).toLowerCase(),
                p: portions,
              })}
            </p>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <button onClick={copy} className="btn-soft text-xs">
              <i className="fa-solid fa-copy" aria-hidden /> {t('Copy')}
            </button>
            <button onClick={() => window.print()} className="btn-ghost text-xs">
              <i className="fa-solid fa-print" aria-hidden /> {t('Print')}
            </button>
            {doneCount > 0 && (
              <button onClick={onClearChecks} className="btn-ghost text-xs">
                <i className="fa-solid fa-rotate-left" aria-hidden /> {t('Uncheck all')}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="meta mb-1.5 flex justify-between">
            <span>{t('{done} of {n} in the basket', { done: doneCount, n: all.length })}</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
            <div className="bg-brand-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.key}>
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                <i className={`fa-solid ${group.icon}`} aria-hidden /> {t(group.key)}
              </span>
            }
            hint={t(group.items.length === 1 ? '{n} item' : '{n} items', { n: group.items.length })}
          />
          <div className="card divide-line divide-y overflow-hidden">
            {group.items.map((item) => {
              const done = Boolean(checked[item.key])
              return (
                <label
                  key={item.key}
                  className={cx(
                    'hover:bg-surface-2 flex cursor-pointer items-center gap-3 p-3 transition-colors',
                    done && 'opacity-55',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => onToggle(item.key)}
                    className="accent-brand-500 h-5 w-5 shrink-0 cursor-pointer rounded-md"
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cx('block text-sm font-semibold', done && 'line-through')}>
                      {item.qty === null ? '' : `${fmtQty(item.qty)}${item.unit ? ` ${item.unit}` : ''} `}
                      {item.item}
                      {item.qty === null && <span className="text-muted font-normal"> — {t('to taste')}</span>}
                    </span>
                    <span className="meta mt-0.5 block truncate">
                      {t('for {recipes}', { recipes: item.recipes.slice(0, 3).join(', ') })}
                      {item.recipes.length > 3 ? ` ${t('+{n} more', { n: item.recipes.length - 3 })}` : ''}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

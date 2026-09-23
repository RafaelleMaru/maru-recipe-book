import { useCallback, useEffect, useState } from 'react'
import { CUISINES, cx, fmtTime, totalTime } from '../lib/util.js'
import { generateMenu } from '../lib/planner.js'
import { useLang } from '../lib/i18n.js'
import { CuisineDot, Modal, RecipeImage } from './common.jsx'

const DEFAULT_OPTS = {
  count: 10,
  cuisines: [],
  kidSafeOnly: false,
  quickOnly: false,
  vegetarianOnly: false,
  maxSpice: 3,
  avoidRepeats: true,
}

/**
 * "Generate 10 recipes" — picks a balanced, duplicate-free batch and lets you
 * reroll individual dishes before committing them to the week.
 */
export default function GenerateDialog({ open, onClose, db, menuIds, history, onCommit }) {
  const { t } = useLang()
  const [opts, setOpts] = useState(DEFAULT_OPTS)
  const [picks, setPicks] = useState([])
  const [info, setInfo] = useState(null)

  const filters = {
    cuisines: opts.cuisines,
    kidSafeOnly: opts.kidSafeOnly,
    quickOnly: opts.quickOnly,
    vegetarianOnly: opts.vegetarianOnly,
    maxSpice: opts.maxSpice,
  }

  const run = useCallback(
    (options = opts) => {
      const result = generateMenu(db, {
        count: options.count,
        excludeIds: menuIds,
        history: options.avoidRepeats ? history : [],
        filters: {
          cuisines: options.cuisines,
          kidSafeOnly: options.kidSafeOnly,
          quickOnly: options.quickOnly,
          vegetarianOnly: options.vegetarianOnly,
          maxSpice: options.maxSpice,
        },
      })
      setPicks(result.picked)
      setInfo(result)
    },
    [db, menuIds, history, opts],
  )

  useEffect(() => {
    if (open) run(opts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const rerollOne = (recipe) => {
    const taken = picks.map((p) => p.id)
    const { picked } = generateMenu(db, {
      count: 1,
      excludeIds: [...menuIds, ...taken],
      history: opts.avoidRepeats ? history : [],
      filters,
    })
    if (!picked.length) return
    setPicks((current) => current.map((p) => (p.id === recipe.id ? picked[0] : p)))
  }

  const drop = (recipe) => setPicks((current) => current.filter((p) => p.id !== recipe.id))

  const toggleCuisine = (c) =>
    setOpts((o) => ({
      ...o,
      cuisines: o.cuisines.includes(c) ? o.cuisines.filter((x) => x !== c) : [...o.cuisines, c],
    }))

  const switches = [
    { key: 'kidSafeOnly', label: 'Kid-approved only', icon: 'fa-child-reaching' },
    { key: 'quickOnly', label: '35 min or less', icon: 'fa-bolt' },
    { key: 'vegetarianOnly', label: 'Meat-free only', icon: 'fa-leaf' },
    { key: 'avoidRepeats', label: 'Skip recently cooked', icon: 'fa-clock-rotate-left' },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      icon="fa-wand-magic-sparkles"
      title={t('Generate {n} recipes', { n: opts.count })}
      subtitle={t("Balanced across cuisines and proteins, and never a dish that's already on the week.")}
      footer={
        <>
          <button onClick={() => run(opts)} className="btn-ghost">
            <i className="fa-solid fa-dice" aria-hidden /> {t('Reroll all')}
          </button>
          <button
            onClick={() => {
              onCommit(picks)
              onClose()
            }}
            disabled={picks.length === 0}
            className="btn-primary"
          >
            <i className="fa-solid fa-circle-plus" aria-hidden /> {t('Add {n} to the week', { n: picks.length })}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Options */}
        <div className="bg-surface-2 flex flex-col gap-3 rounded-2xl p-4">
          <label className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold">{t('How many dishes')}</span>
            <input
              type="range"
              min="3"
              max="14"
              value={opts.count}
              onChange={(e) => {
                const count = Number(e.target.value)
                setOpts((o) => ({ ...o, count }))
                run({ ...opts, count })
              }}
              className="accent-brand-500 min-w-40 flex-1 cursor-pointer"
            />
            <span className="bg-brand-500 min-w-9 rounded-lg px-2 py-1 text-center text-xs font-bold text-white">
              {opts.count}
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCuisine(c)}
                className={cx('chip-btn', opts.cuisines.includes(c) && 'chip-on')}
              >
                <CuisineDot cuisine={c} /> {c}
              </button>
            ))}
            {opts.cuisines.length > 0 && (
              <button onClick={() => setOpts((o) => ({ ...o, cuisines: [] }))} className="chip-btn">
                <i className="fa-solid fa-xmark" aria-hidden /> {t('All cuisines')}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {switches.map((s) => (
              <button
                key={s.key}
                onClick={() => setOpts((o) => ({ ...o, [s.key]: !o[s.key] }))}
                className={cx('chip-btn', opts[s.key] && 'chip-on')}
              >
                <i className={`fa-solid ${s.icon}`} aria-hidden /> {t(s.label)}
              </button>
            ))}
          </div>

          <button onClick={() => run(opts)} className="btn-soft self-start text-xs">
            <i className="fa-solid fa-arrows-rotate" aria-hidden /> {t('Apply and reroll')}
          </button>
        </div>

        {/* Warnings */}
        {info?.shortfall > 0 && (
          <p className="bg-amber-soft text-amber-ink rounded-2xl px-4 py-3 text-xs font-semibold">
            <i className="fa-solid fa-triangle-exclamation mr-2" aria-hidden />
            {t(
              'Only {n} dishes fit those filters right now ({pool} available in total). Loosen a filter, or ask Claude to research more recipes for the database.',
              { n: picks.length, pool: info.poolSize },
            )}
          </p>
        )}
        {info?.recycled && info?.shortfall <= 0 && (
          <p className="bg-amber-soft text-amber-ink rounded-2xl px-4 py-3 text-xs font-semibold">
            <i className="fa-solid fa-clock-rotate-left mr-2" aria-hidden />
            {t('The fresh pool ran out, so some dishes you’ve cooked before are back in the mix.')}
          </p>
        )}

        {/* Picks */}
        <ul className="flex flex-col gap-2">
          {picks.map((r, i) => (
            <li key={r.id} className="border-line flex items-center gap-3 rounded-2xl border p-2">
              <span className="bg-brand-50 text-brand-700 dark:text-brand-300 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {i + 1}
              </span>
              <RecipeImage recipe={r} className="h-12 w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-bold">{r.title}</p>
                <p className="meta mt-0.5 flex items-center gap-1.5">
                  <CuisineDot cuisine={r.cuisine} /> {r.cuisine} · {fmtTime(totalTime(r))}
                  {r.kidFriendly ? ` · ${t('kid-ok')}` : ''}
                </p>
              </div>
              <button
                onClick={() => rerollOne(r)}
                className="btn-icon border-line text-muted hover:bg-surface-2 border"
                title={t('Swap this one')}
                aria-label={t('Swap {title}', { title: r.title })}
              >
                <i className="fa-solid fa-shuffle" aria-hidden />
              </button>
              <button
                onClick={() => drop(r)}
                className="btn-icon border-line text-muted hover:bg-surface-2 hover:text-red-500 border"
                title={t('Drop this one')}
                aria-label={t('Remove {title}', { title: r.title })}
              >
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}

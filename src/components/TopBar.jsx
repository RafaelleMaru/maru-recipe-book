import { useEffect, useRef, useState } from 'react'
import { cx, fmtTime, SERVING_MODES, totalTime } from '../lib/util.js'
import { hitLabel, snippetFor } from '../lib/search.js'
import { LANGS, useLang } from '../lib/i18n.js'
import { CuisineDot, RecipeImage } from './common.jsx'

export default function TopBar({
  query,
  onQuery,
  suggestions,
  onPick,
  onSubmitSearch,
  canGoBack,
  onBack,
  servings,
  onServings,
  theme,
  onTheme,
  onLang,
  onBackup,
}) {
  const { lang, t } = useLang()
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const boxRef = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Ctrl/Cmd+K focuses the search box from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        boxRef.current?.querySelector('input')?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const visible = open && query.trim().length > 0 && suggestions.length > 0
  const other = lang === 'en' ? LANGS.fil : LANGS.en

  const onKeyDown = (e) => {
    if (e.key === 'Escape') return setOpen(false)
    if (!visible) {
      if (e.key === 'Enter') onSubmitSearch()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => (c + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (c <= 0 ? suggestions.length - 1 : c - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (cursor >= 0) {
        onPick(suggestions[cursor].recipe)
        setOpen(false)
      } else {
        onSubmitSearch()
        setOpen(false)
      }
    }
  }

  return (
    // Phones get two rows: a full-width search box, then the controls beneath it.
    // From `sm` up it collapses back to a single row.
    <header className="no-print mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:gap-3">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className={cx(
            'btn-icon hidden shrink-0 sm:inline-flex',
            canGoBack ? 'bg-surface border-line border text-ink-2 hover:bg-surface-2' : 'text-muted/40',
          )}
          aria-label={t('Back')}
          title={t('Back')}
        >
          <i className="fa-solid fa-chevron-left" aria-hidden />
        </button>

        <div ref={boxRef} className="relative min-w-0 flex-1">
        <div className="bg-surface border-line flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-sm focus-within:border-brand-300 sm:px-4">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              onQuery(e.target.value)
              setOpen(true)
              setCursor(-1)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t('Search dishes, ingredients or steps…')}
            className="placeholder:text-muted min-w-0 flex-1 bg-transparent py-1 text-sm font-medium outline-none"
            aria-label={t('Search recipes')}
          />
          {query && (
            <button
              className="text-muted hover:text-ink cursor-pointer px-1"
              onClick={() => onQuery('')}
              aria-label={t('Clear search')}
            >
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
          )}
          <span className="text-muted border-line hidden border-l pl-2 text-[10px] font-bold lg:block">Ctrl K</span>
          <button className="text-brand-600 cursor-pointer px-1 text-lg" onClick={onSubmitSearch} aria-label={t('Search')}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden />
          </button>
        </div>

        {visible && (
          <div className="card pop-in absolute inset-x-0 top-full z-50 mt-2 max-h-[22rem] overflow-y-auto p-2 shadow-xl">
            {suggestions.map((s, i) => (
              <button
                key={s.recipe.id}
                onMouseEnter={() => setCursor(i)}
                onClick={() => {
                  onPick(s.recipe)
                  setOpen(false)
                }}
                className={cx(
                  'flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-colors',
                  cursor === i ? 'bg-brand-50' : 'hover:bg-surface-2',
                )}
              >
                <RecipeImage recipe={s.recipe} className="h-12 w-16 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">{s.recipe.title}</span>
                    <span className="meta flex shrink-0 items-center gap-1.5">
                      <CuisineDot cuisine={s.recipe.cuisine} />
                      {s.recipe.cuisine}
                    </span>
                  </span>
                  <span className="text-muted mt-0.5 block truncate text-xs">
                    {snippetFor(s.recipe, query, s.hit, lang)}
                  </span>
                </span>
                <span className="meta hidden shrink-0 items-center gap-2 sm:flex">
                  <span className="chip">{t(hitLabel[s.hit] ?? 'match')}</span>
                  {fmtTime(totalTime(s.recipe))}
                </span>
              </button>
            ))}
            <button
              onClick={() => {
                onSubmitSearch()
                setOpen(false)
              }}
              className="text-brand-700 dark:text-brand-300 hover:bg-surface-2 mt-1 w-full cursor-pointer rounded-2xl p-2 text-center text-xs font-bold"
            >
              {t('See all results for “{q}”', { q: query })}
            </button>
          </div>
        )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
      {/* Serving-size switch: the whole app scales to this. Icons only on phones. */}
      <div className="bg-surface border-line flex shrink-0 items-center gap-0.5 rounded-2xl border p-1 shadow-sm">
        {Object.values(SERVING_MODES).map((m) => (
          <button
            key={m.key}
            onClick={() => onServings(m.key)}
            title={t(m.hint)}
            className={cx(
              'flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors sm:px-3',
              servings === m.key ? 'bg-brand-500 text-white' : 'text-ink-2 hover:bg-surface-2',
            )}
          >
            <i className={`fa-solid ${m.icon}`} aria-hidden />
            <span className="hidden lg:inline">{t(m.label)}</span>
          </button>
        ))}
      </div>

      {/* Language switch — shows the language you'd move to, like the theme button. */}
      <button
        onClick={onLang}
        className="btn-icon bg-surface border-line text-ink-2 hover:bg-surface-2 hover:text-brand-600 shrink-0 border text-xs font-extrabold shadow-sm"
        title={t(lang === 'en' ? 'Switch to Filipino' : 'Switch to English')}
        aria-label={t(lang === 'en' ? 'Switch to Filipino' : 'Switch to English')}
      >
        {other.short}
      </button>

      <button
        onClick={onBackup}
        className="btn-icon bg-surface border-line text-ink-2 hover:bg-surface-2 hidden shrink-0 border shadow-sm sm:flex"
        title={t('Backup or restore this plan')}
        aria-label={t('Backup or restore this plan')}
      >
        <i className="fa-solid fa-floppy-disk" aria-hidden />
      </button>

      <button
        onClick={onTheme}
        className="btn-icon bg-surface border-line text-ink-2 hover:bg-surface-2 shrink-0 border shadow-sm"
        title={t(theme === 'dark' ? 'Switch to light' : 'Switch to dark')}
        aria-label={t('Toggle theme')}
      >
        <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden />
      </button>
      </div>
    </header>
  )
}

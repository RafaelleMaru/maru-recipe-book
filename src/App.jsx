import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { buildIndex, searchIndex } from './lib/search.js'
import { generateMenu, isVegetarian, QUICK_MINUTES } from './lib/planner.js'
import { downloadBackup, initialTheme, restoreBackup, useStored, useToast } from './lib/store.js'
import { LangProvider, makeT } from './lib/i18n.js'
import { CUISINES, DAYS, cx, totalTime } from './lib/util.js'

import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Browse from './components/Browse.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import WeekPlan from './components/WeekPlan.jsx'
import MarketList from './components/MarketList.jsx'
import GenerateDialog from './components/GenerateDialog.jsx'
import CookMode from './components/CookMode.jsx'
import { EmptyState, Modal, Toasts } from './components/common.jsx'

const HISTORY_LIMIT = 40
const NO_RECIPES = []

const DEFAULT_FILTERS = {
  cuisines: [],
  categories: [],
  kidOnly: false,
  vegOnly: false,
  quickOnly: false,
  mildOnly: false,
  sort: 'title',
}

/** Default to Filipino only if the browser asks for it; otherwise English. */
const initialLang = () => (navigator.language?.toLowerCase().startsWith('fil') || navigator.language?.toLowerCase().startsWith('tl') ? 'fil' : 'en')

export default function App() {
  const [view, setView] = useState('dashboard')
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [cookingId, setCookingId] = useState(null)
  const fileRef = useRef(null)

  const [servings, setServings] = useStored('servings', 'family')
  const [theme, setTheme] = useStored('theme', initialTheme)
  const [lang, setLang] = useStored('lang', initialLang)
  const [menuIds, setMenuIds] = useStored('menu', [])
  const [plan, setPlan] = useStored('plan', {})
  const [cookbookIds, setCookbookIds] = useStored('cookbook', [])
  const [history, setHistory] = useStored('history', [])
  const [checked, setChecked] = useStored('checked', {})

  const { toasts, push, dismiss } = useToast()
  const t = useMemo(() => makeT(lang), [lang])

  // The recipe database is fetched rather than bundled: it is by far the largest
  // asset, and keeping it out of the JS means a phone paints the shell immediately
  // and caches the data separately between deploys.
  const [db, setDb] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}data/recipes.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((json) => alive && setDb(json))
      .catch(() => alive && setLoadError(true))
    return () => {
      alive = false
    }
  }, [])

  const RECIPES = db?.recipes ?? NO_RECIPES

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = lang === 'fil' ? 'fil' : 'en'
  }, [lang])

  /* ------------------------------------------------------------- derived data */

  const byId = useMemo(() => new Map(RECIPES.map((r) => [r.id, r])), [RECIPES])
  const index = useMemo(() => buildIndex(RECIPES), [RECIPES])

  const counts = useMemo(() => {
    const cuisines = {}
    const categories = {}
    for (const r of RECIPES) {
      cuisines[r.cuisine] = (cuisines[r.cuisine] || 0) + 1
      for (const c of r.categories) categories[c] = (categories[c] || 0) + 1
    }
    return { total: RECIPES.length, cuisines, categories }
  }, [RECIPES])

  const searchHits = useMemo(() => (query.trim() ? searchIndex(index, query) : null), [index, query])
  const suggestions = useMemo(() => (searchHits ? searchHits.slice(0, 6) : []), [searchHits])

  const applyFilters = useCallback(
    (list) =>
      list.filter((r) => {
        if (filters.cuisines.length && !filters.cuisines.includes(r.cuisine)) return false
        if (filters.categories.length && !r.categories.some((c) => filters.categories.includes(c))) return false
        if (filters.kidOnly && !r.kidFriendly) return false
        if (filters.vegOnly && !isVegetarian(r)) return false
        if (filters.quickOnly && totalTime(r) > QUICK_MINUTES) return false
        if (filters.mildOnly && (r.spicy ?? 0) > 1) return false
        return true
      }),
    [filters],
  )

  const sortList = useCallback(
    (list, keepRelevance) => {
      if (keepRelevance && filters.sort === 'relevance') return list
      const sorted = [...list]
      if (filters.sort === 'time') sorted.sort((a, b) => totalTime(a) - totalTime(b) || a.title.localeCompare(b.title))
      else if (filters.sort === 'cuisine')
        sorted.sort((a, b) => a.cuisine.localeCompare(b.cuisine) || a.title.localeCompare(b.title))
      else if (filters.sort === 'spice')
        sorted.sort((a, b) => (a.spicy ?? 0) - (b.spicy ?? 0) || a.title.localeCompare(b.title))
      else sorted.sort((a, b) => a.title.localeCompare(b.title))
      return sorted
    },
    [filters.sort],
  )

  const browseList = useMemo(() => {
    const base = searchHits ? searchHits.map((h) => h.recipe) : RECIPES
    return sortList(applyFilters(base), Boolean(searchHits))
  }, [RECIPES, searchHits, applyFilters, sortList])

  const menu = useMemo(() => menuIds.map((id) => byId.get(id)).filter(Boolean), [menuIds, byId])
  const cookbook = useMemo(() => cookbookIds.map((id) => byId.get(id)).filter(Boolean), [cookbookIds, byId])
  const cookbookList = useMemo(() => sortList(applyFilters(cookbook), false), [cookbook, applyFilters, sortList])
  const selected = selectedId ? byId.get(selectedId) : null
  const cooking = cookingId ? byId.get(cookingId) : null

  const quickPicks = useMemo(
    () =>
      RECIPES.filter((r) => totalTime(r) <= QUICK_MINUTES && !menuIds.includes(r.id))
        .sort((a, b) => totalTime(a) - totalTime(b))
        .slice(0, 4),
    [RECIPES, menuIds],
  )

  /* ----------------------------------------------------------------- handlers */

  const remember = useCallback(
    (ids) => setHistory((h) => [...ids, ...h.filter((id) => !ids.includes(id))].slice(0, HISTORY_LIMIT)),
    [setHistory],
  )

  const openRecipe = useCallback((recipe) => setSelectedId(recipe.id), [])

  const removeFromMenu = useCallback(
    (recipe) => {
      setMenuIds((ids) => ids.filter((id) => id !== recipe.id))
      setPlan((p) => Object.fromEntries(Object.entries(p).filter(([, id]) => id !== recipe.id)))
    },
    [setMenuIds, setPlan],
  )

  const toggleMenu = useCallback(
    (recipe) => {
      if (menuIds.includes(recipe.id)) {
        removeFromMenu(recipe)
        push(t('{title} taken off the week.', { title: recipe.title }), 'info')
      } else {
        setMenuIds((ids) => [...ids, recipe.id])
        remember([recipe.id])
        push(t('{title} added to the week.', { title: recipe.title }))
      }
    },
    [menuIds, removeFromMenu, setMenuIds, remember, push, t],
  )

  const toggleSave = useCallback(
    (recipe) => {
      const wasSaved = cookbookIds.includes(recipe.id)
      setCookbookIds((ids) => (wasSaved ? ids.filter((id) => id !== recipe.id) : [...ids, recipe.id]))
      push(
        t(wasSaved ? '{title} removed from the cookbook.' : '{title} saved to the cookbook.', { title: recipe.title }),
        wasSaved ? 'info' : 'ok',
      )
    },
    [cookbookIds, setCookbookIds, push, t],
  )

  const commitGenerated = useCallback(
    (recipes) => {
      const fresh = recipes.filter((r) => !menuIds.includes(r.id))
      if (!fresh.length) {
        push(t('Those dishes are already on the week.'), 'warn')
        return
      }
      setMenuIds((ids) => [...ids, ...fresh.map((r) => r.id)])
      remember(fresh.map((r) => r.id))
      push(t('{n} dishes added to the week.', { n: fresh.length }))
      setView('plan')
      setSelectedId(null)
    },
    [menuIds, setMenuIds, remember, push, t],
  )

  const assignDay = useCallback(
    (recipeId, day) => {
      setPlan((p) => {
        const next = { ...p }
        // A dish lives on at most one day, and a day holds at most one dish.
        for (const d of DAYS) if (next[d] === recipeId) delete next[d]
        if (day) next[day] = recipeId
        return next
      })
    },
    [setPlan],
  )

  const swapOne = useCallback(
    (recipe) => {
      const { picked } = generateMenu(RECIPES, { count: 1, excludeIds: menuIds, history, filters: {} })
      if (!picked.length) {
        push(t('Every recipe in the book is already on the week.'), 'warn')
        return
      }
      const replacement = picked[0]
      setMenuIds((ids) => ids.map((id) => (id === recipe.id ? replacement.id : id)))
      setPlan((p) => Object.fromEntries(Object.entries(p).map(([d, id]) => [d, id === recipe.id ? replacement.id : id])))
      remember([replacement.id])
      push(t('Swapped {from} for {to}.', { from: recipe.title, to: replacement.title }))
    },
    [RECIPES, menuIds, history, setMenuIds, setPlan, remember, push, t],
  )

  const clearWeek = () =>
    setConfirm({
      title: t('Clear the whole week?'),
      body: t('The menu and the day assignments go away. Your cookbook and the recipe database are untouched.'),
      confirmLabel: t('Clear the week'),
      onConfirm: () => {
        setMenuIds([])
        setPlan({})
        setChecked({})
        push(t('Week cleared.'), 'info')
      },
    })

  const filterByCuisine = (cuisine) => {
    setFilters({ ...DEFAULT_FILTERS, cuisines: [cuisine] })
    setQuery('')
    setSelectedId(null)
    setView('browse')
  }

  const applyTag = ({ type, value }) => {
    setFilters({ ...DEFAULT_FILTERS, ...(type === 'cuisine' ? { cuisines: [value] } : { categories: [value] }) })
    setQuery('')
    setSelectedId(null)
    setView('browse')
  }

  const onRestoreFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const message = await restoreBackup(file)
      push(`${t(message.key, message.vars)} ${t('Reloading…')}`)
      setTimeout(() => window.location.reload(), 900)
    } catch (err) {
      push(t(err.message), 'warn')
    } finally {
      event.target.value = ''
    }
  }

  const goBack = () => {
    if (selectedId) return setSelectedId(null)
    if (view !== 'dashboard') return setView('dashboard')
  }

  /* -------------------------------------------------------------------- render */

  const main = () => {
    if (!db) {
      return loadError ? (
        <EmptyState
          icon="fa-plug-circle-xmark"
          title={t('Could not load the recipes.')}
          action={
            <button onClick={() => window.location.reload()} className="btn-primary mt-1">
              <i className="fa-solid fa-rotate-right" aria-hidden /> {t('Reload')}
            </button>
          }
        >
          {t('Check your connection and reload the page.')}
        </EmptyState>
      ) : (
        <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
          <i className="fa-solid fa-bowl-food text-brand-400 animate-pulse text-3xl" aria-hidden />
          <p className="meta">{t('Loading the recipe book…')}</p>
        </div>
      )
    }

    if (selected) {
      return (
        <RecipeDetail
          recipe={selected}
          servings={servings}
          inMenu={menuIds.includes(selected.id)}
          saved={cookbookIds.includes(selected.id)}
          onToggleMenu={toggleMenu}
          onToggleSave={toggleSave}
          onBack={() => setSelectedId(null)}
          onTag={applyTag}
          onCook={() => setCookingId(selected.id)}
        />
      )
    }

    if (view === 'browse') {
      return (
        <Browse
          recipes={browseList}
          filters={filters}
          setFilters={setFilters}
          counts={counts}
          query={query}
          onOpen={openRecipe}
          onToggleMenu={toggleMenu}
          onToggleSave={toggleSave}
          menuIds={menuIds}
          cookbookIds={cookbookIds}
          onClear={() => {
            setFilters(DEFAULT_FILTERS)
            setQuery('')
          }}
        />
      )
    }

    if (view === 'plan') {
      return (
        <WeekPlan
          menu={menu}
          plan={plan}
          servings={servings}
          onAssign={assignDay}
          onOpen={openRecipe}
          onRemove={(r) => {
            removeFromMenu(r)
            push(t('{title} taken off the week.', { title: r.title }), 'info')
          }}
          onClear={clearWeek}
          onGenerate={() => setGenerateOpen(true)}
          onSwap={swapOne}
          onView={setView}
        />
      )
    }

    if (view === 'market') {
      return (
        <MarketList
          menu={menu}
          servings={servings}
          checked={checked}
          onToggle={(key) => setChecked((c) => ({ ...c, [key]: !c[key] }))}
          onClearChecks={() => setChecked({})}
          onGenerate={() => setGenerateOpen(true)}
          onView={setView}
          onCopied={(message, tone) => push(message, tone)}
        />
      )
    }

    if (view === 'cookbook') {
      return (
        <Browse
          recipes={cookbookList}
          filters={filters}
          setFilters={setFilters}
          counts={counts}
          query={query}
          onOpen={openRecipe}
          onToggleMenu={toggleMenu}
          onToggleSave={toggleSave}
          menuIds={menuIds}
          cookbookIds={cookbookIds}
          onClear={() => {
            setFilters(DEFAULT_FILTERS)
            setQuery('')
          }}
          title={t('Saved cookbook')}
          hint={
            cookbook.length
              ? t('{n} of {total} saved recipes', { n: cookbookList.length, total: cookbook.length })
              : t('Tap the bookmark on any recipe to keep it here')
          }
        />
      )
    }

    return (
      <Dashboard
        menu={menu}
        counts={counts}
        servings={servings}
        onGenerate={() => setGenerateOpen(true)}
        onView={(v) => {
          setSelectedId(null)
          setView(v)
        }}
        onOpen={openRecipe}
        onToggleMenu={toggleMenu}
        onCuisine={filterByCuisine}
        quickPicks={quickPicks}
      />
    )
  }

  return (
    <LangProvider lang={lang}>
      <div className="mx-auto flex max-w-[1500px] gap-4 p-3 pb-28 sm:p-4 md:pb-4">
        <Sidebar
          view={view}
          onView={(v) => {
            setSelectedId(null)
            setView(v)
          }}
          menuCount={menuIds.length}
          cookbookCount={cookbookIds.length}
          onGenerate={() => setGenerateOpen(true)}
        />

        <main id="main" className="min-w-0 flex-1">
          <TopBar
            query={query}
            onQuery={(value) => {
              setQuery(value)
              setFilters((f) => ({ ...f, sort: value ? 'relevance' : f.sort === 'relevance' ? 'title' : f.sort }))
            }}
            suggestions={suggestions}
            onPick={(recipe) => {
              setSelectedId(recipe.id)
              setView('browse')
            }}
            onSubmitSearch={() => {
              setSelectedId(null)
              setView('browse')
            }}
            canGoBack={Boolean(selectedId) || view !== 'dashboard'}
            onBack={goBack}
            servings={servings}
            onServings={setServings}
            theme={theme}
            onTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            onLang={() => setLang((current) => (current === 'fil' ? 'en' : 'fil'))}
            onBackup={() => setBackupOpen(true)}
          />

          {main()}

          <footer className="meta no-print mt-6 flex flex-wrap items-center justify-between gap-2 px-1">
            <span>
              {t('{n} recipes · {c} cuisines · database built {date}', {
                n: counts.total,
                c: CUISINES.length,
                date: db?.generatedAt ? new Date(db.generatedAt).toLocaleDateString(lang === 'fil' ? 'fil-PH' : 'en-PH') : '—',
              })}
            </span>
            <span className="flex items-center gap-3">
              <button onClick={() => setBackupOpen(true)} className="hover:text-brand-600 cursor-pointer font-bold">
                {t('Backup or restore')}
              </button>
            </span>
          </footer>
        </main>

        {cooking && (
        <CookMode
          recipe={cooking}
          servings={servings}
          onClose={() => setCookingId(null)}
          onFinish={() => {
            setCookingId(null)
            remember([cooking.id])
            push(t('Enjoy the {title}!', { title: cooking.title }))
          }}
        />
      )}

      <GenerateDialog
          open={generateOpen}
          onClose={() => setGenerateOpen(false)}
          db={RECIPES}
          menuIds={menuIds}
          history={history}
          onCommit={commitGenerated}
        />

        <Modal
          open={backupOpen}
          onClose={() => setBackupOpen(false)}
          icon="fa-floppy-disk"
          title={t('Backup & restore')}
          subtitle={t(
            'The week, the cookbook and your preferences live in this browser. Export a file to carry them to another PC.',
          )}
        >
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                downloadBackup()
                push(t('Backup file downloaded.'))
              }}
              className="btn-primary"
            >
              <i className="fa-solid fa-download" aria-hidden /> {t('Export my plan to a file')}
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-soft">
              <i className="fa-solid fa-upload" aria-hidden /> {t('Restore from a backup file')}
            </button>
            <input ref={fileRef} type="file" accept="application/json" onChange={onRestoreFile} className="hidden" />
            <p className="meta leading-relaxed">
              {t(
                'The {n} recipes themselves live in the project folder ({path}), so they travel with the code. This backup only covers what you’ve planned and saved.',
                { n: counts.total, path: 'data/cuisines/*.json' },
              )}
            </p>
          </div>
        </Modal>

        <Modal
          open={Boolean(confirm)}
          onClose={() => setConfirm(null)}
          icon="fa-triangle-exclamation"
          title={confirm?.title ?? ''}
          footer={
            <>
              <button onClick={() => setConfirm(null)} className="btn-ghost">
                {t('Cancel')}
              </button>
              <button
                onClick={() => {
                  confirm?.onConfirm?.()
                  setConfirm(null)
                }}
                className={cx('btn', 'bg-red-500 text-white hover:bg-red-600')}
              >
                {confirm?.confirmLabel ?? t('Confirm')}
              </button>
            </>
          }
        >
          <p className="text-ink-2 text-sm leading-relaxed">{confirm?.body}</p>
        </Modal>

        <Toasts toasts={toasts} dismiss={dismiss} />
      </div>
    </LangProvider>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cx, fmtQty, portionsFor, scaleQty } from '../lib/util.js'
import { recipeText, useLang } from '../lib/i18n.js'

/**
 * Full-screen cooking mode: one step at a time in large type, the screen kept
 * awake, and a timer for any step that mentions a duration.
 *
 * Designed for a phone propped on the counter — big tap targets, high contrast,
 * nothing that needs precision.
 */

/** Pull a cookable duration out of a step: "simmer for 20-25 minutes" → 20 min. */
function parseDuration(step) {
  const m = step.match(/(\d+)(?:\s*(?:-|–|to)\s*(\d+))?\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/i)
  if (!m) return null
  const value = Number(m[1]) // the lower bound — check early rather than overcook
  const unit = m[3].toLowerCase()
  const seconds = unit.startsWith('h') ? value * 3600 : unit.startsWith('m') ? value * 60 : value
  if (!seconds || seconds > 6 * 3600) return null
  return { seconds, label: m[0] }
}

const clock = (total) => {
  const s = Math.max(0, Math.round(total))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}

export default function CookMode({ recipe, servings, onClose, onFinish }) {
  const { lang, t } = useLang()
  const text = useMemo(() => recipeText(recipe, lang), [recipe, lang])
  const steps = text.steps

  const [step, setStep] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const [awake, setAwake] = useState(false)

  const portions = portionsFor(servings)
  const factor = portions / recipe.servings

  /* ------------------------------------------------------------- wake lock */

  const lockRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const acquire = async () => {
      if (!('wakeLock' in navigator)) return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          lock.release()
          return
        }
        lockRef.current = lock
        setAwake(true)
        lock.addEventListener('release', () => setAwake(false))
      } catch {
        setAwake(false) // denied, low battery, or an older iOS
      }
    }

    // Browsers drop the lock when the tab is hidden, so take it again on return.
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [])

  /* ---------------------------------------------------------------- timer */

  const duration = useMemo(() => parseDuration(steps[step] ?? ''), [steps, step])
  const [remaining, setRemaining] = useState(null)
  const [running, setRunning] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    // A new step gets a fresh timer.
    setRemaining(null)
    setRunning(false)
  }, [step])

  const alarm = useCallback(() => {
    navigator.vibrate?.([300, 120, 300, 120, 600])
    const ctx = audioRef.current
    if (!ctx) return
    for (let i = 0; i < 3; i++) {
      const at = ctx.currentTime + i * 0.7
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5)
      osc.start(at)
      osc.stop(at + 0.55)
    }
  }, [])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setRemaining((value) => {
        if (value === null) return null
        if (value <= 1) {
          setRunning(false)
          alarm()
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, alarm])

  const startTimer = () => {
    // Created inside the tap so iOS allows sound later.
    if (!audioRef.current) {
      try {
        audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
      } catch {
        audioRef.current = null
      }
    }
    audioRef.current?.resume?.()
    setRemaining(duration.seconds)
    setRunning(true)
  }

  useEffect(() => () => audioRef.current?.close?.(), [])

  /* ------------------------------------------------------------ navigation */

  const last = step >= steps.length - 1
  const next = useCallback(() => {
    if (last) onFinish()
    else setStep((s) => Math.min(steps.length - 1, s + 1))
  }, [last, onFinish, steps.length])
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') back()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [next, back, onClose])

  return (
    <div className="bg-canvas fixed inset-0 z-[70] flex flex-col">
      {/* Header */}
      <header className="border-line bg-surface flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <button
          onClick={onClose}
          className="btn-icon border-line text-ink-2 hover:bg-surface-2 shrink-0 border"
          aria-label={t('Exit cooking mode')}
          title={t('Exit cooking mode')}
        >
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold">{recipe.title}</p>
          <p className="meta">{t('Step {n} of {total}', { n: step + 1, total: steps.length })}</p>
        </div>
        {awake && (
          <span className="chip text-brand-700 dark:text-brand-300 shrink-0" title={t('Screen stays on while you cook')}>
            <i className="fa-solid fa-lightbulb" aria-hidden />
            <span className="hidden sm:inline">{t('Screen stays on')}</span>
          </span>
        )}
      </header>

      {/* Progress */}
      <div className="bg-surface-2 h-1.5 shrink-0">
        <div
          className="bg-brand-500 h-full transition-all duration-300"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Ingredients drawer */}
      <div className="border-line bg-surface shrink-0 border-b">
        <button
          onClick={() => setShowIngredients((v) => !v)}
          className="text-ink-2 flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-sm font-bold"
        >
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-basket-shopping text-brand-500" aria-hidden />
            {t('Ingredients')}
            <span className="meta font-normal">{t('{n} portions', { n: portions })}</span>
          </span>
          <i className={cx('fa-solid transition-transform', showIngredients ? 'fa-chevron-up' : 'fa-chevron-down')} aria-hidden />
        </button>
        {showIngredients && (
          <ul className="max-h-52 overflow-y-auto px-4 pb-3 text-sm">
            {recipe.ingredients.map((ing, i) => {
              const qty = scaleQty(ing.qty, ing.unit, factor)
              return (
                <li key={i} className="border-line flex gap-3 border-t py-2 first:border-t-0">
                  <span className="text-brand-700 dark:text-brand-300 w-24 shrink-0 font-bold">
                    {qty === null ? t('To taste') : `${fmtQty(qty)}${ing.unit ? ` ${ing.unit}` : ''}`}
                  </span>
                  <span className="text-ink-2">{text.ingredientNames[i]}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* The step — tapping the body advances, like turning a page */}
      <button
        onClick={next}
        className="flex min-h-0 flex-1 cursor-pointer flex-col justify-center overflow-y-auto px-5 py-6 text-left sm:px-10"
      >
        <span className="bg-brand-50 text-brand-700 dark:text-brand-300 mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold">
          {step + 1}
        </span>
        <p className="text-2xl leading-relaxed font-semibold sm:text-3xl sm:leading-relaxed">{steps[step]}</p>

        {text.tips?.length > 0 && last && (
          <span className="border-line mt-6 block border-t pt-4">
            <span className="text-amber-ink mb-2 flex items-center gap-2 text-sm font-bold">
              <i className="fa-solid fa-lightbulb" aria-hidden /> {t('Kitchen notes')}
            </span>
            {text.tips.map((tip, i) => (
              <span key={i} className="text-ink-2 mt-1 block text-base leading-relaxed">
                {tip}
              </span>
            ))}
          </span>
        )}
      </button>

      {/* Timer */}
      {duration && (
        <div className="border-line bg-surface shrink-0 border-t px-4 py-3">
          {remaining === null ? (
            <button onClick={startTimer} className="btn-soft w-full text-base">
              <i className="fa-solid fa-stopwatch" aria-hidden />
              {t('Start a {time} timer', { time: clock(duration.seconds) })}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span
                className={cx(
                  'flex-1 text-center text-3xl font-extrabold tabular-nums',
                  remaining === 0 ? 'text-amber-ink animate-pulse' : 'text-brand-700 dark:text-brand-300',
                )}
              >
                {remaining === 0 ? t('Time is up!') : clock(remaining)}
              </span>
              {remaining > 0 && (
                <button onClick={() => setRunning((v) => !v)} className="btn-ghost shrink-0">
                  <i className={`fa-solid ${running ? 'fa-pause' : 'fa-play'}`} aria-hidden />
                  {t(running ? 'Pause' : 'Resume')}
                </button>
              )}
              <button
                onClick={() => {
                  setRemaining(null)
                  setRunning(false)
                }}
                className="btn-ghost shrink-0"
              >
                <i className="fa-solid fa-rotate-left" aria-hidden />
                {t('Reset')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <footer className="border-line bg-surface flex shrink-0 items-center gap-3 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button onClick={back} disabled={step === 0} className="btn-ghost flex-1 py-3.5 text-base">
          <i className="fa-solid fa-chevron-left" aria-hidden />
          {t('Back')}
        </button>
        <button onClick={next} className="btn-primary flex-[2] py-3.5 text-base">
          {last ? (
            <>
              <i className="fa-solid fa-circle-check" aria-hidden />
              {t('Done cooking')}
            </>
          ) : (
            <>
              {t('Next step')}
              <i className="fa-solid fa-chevron-right" aria-hidden />
            </>
          )}
        </button>
      </footer>
    </div>
  )
}

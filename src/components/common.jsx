import { useEffect, useState } from 'react'
import { CUISINE_META, cx, fmtTime, imageFor, photoFor, totalTime } from '../lib/util.js'
import { useLang } from '../lib/i18n.js'

/** Colour dot standing in for a flag — flags don't render on Windows. */
export function CuisineDot({ cuisine, size = 8 }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ background: CUISINE_META[cuisine]?.dot ?? 'var(--color-brand-500)', width: size, height: size }}
      aria-hidden
    />
  )
}

/** Recipe artwork: real photo if someone dropped one in, otherwise the drawn plate. */
export function RecipeImage({ recipe, className = '', alt }) {
  const [src, setSrc] = useState(photoFor(recipe))
  useEffect(() => {
    setSrc(photoFor(recipe))
  }, [recipe.id])
  return (
    <img
      src={src}
      alt={alt ?? recipe.title}
      loading="lazy"
      onError={() => setSrc((current) => (current.endsWith('.jpg') ? imageFor(recipe) : current))}
      className={cx('bg-surface-2 object-cover', className)}
    />
  )
}

export function SpiceMeter({ level = 0, showLabel = true }) {
  const { t } = useLang()
  if (!level) {
    return (
      <span className="meta inline-flex items-center gap-1.5">
        <i className="fa-solid fa-seedling text-brand-500" aria-hidden />
        {showLabel && t('No heat')}
      </span>
    )
  }
  const labels = ['', 'Mild', 'Spicy', 'Very spicy']
  return (
    <span className="meta inline-flex items-center gap-1" title={`${t(labels[level])} (${level}/3)`}>
      {[1, 2, 3].map((n) => (
        <i
          key={n}
          className={cx('fa-solid fa-pepper-hot', n <= level ? 'text-red-500' : 'text-line')}
          aria-hidden
        />
      ))}
      {showLabel && <span className="ml-1">{t(labels[level])}</span>}
    </span>
  )
}

export function Stat({ icon, value, label, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 dark:text-brand-300',
    amber: 'bg-amber-soft text-amber-ink',
    plain: 'bg-surface-2 text-ink-2',
  }
  return (
    // The 2-up grid on a 360px phone leaves ~160px per tile, so the icon shrinks
    // and the value steps down a size rather than wrapping mid-phrase.
    <div className="card flex items-center gap-2.5 p-3 sm:gap-3 sm:p-3.5">
      <span
        className={cx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg',
          tones[tone],
        )}
      >
        <i className={`fa-solid ${icon}`} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-base leading-tight font-extrabold whitespace-nowrap sm:text-lg">{value}</span>
        <span className="meta mt-0.5 block leading-snug">{label}</span>
      </span>
    </div>
  )
}

export function Pill({ icon, children, className = '', title }) {
  return (
    <span className={cx('chip', className)} title={title}>
      {icon && <i className={`fa-solid ${icon}`} aria-hidden />}
      {children}
    </span>
  )
}

/** The prep/cook/serves line used on cards and in the detail header. */
export function TimeMeta({ recipe, withServes = true }) {
  const { t } = useLang()
  return (
    <>
      <Pill icon="fa-clock" title={`${fmtTime(recipe.prepMinutes)} prep + ${fmtTime(recipe.cookMinutes)} cook`}>
        {fmtTime(totalTime(recipe))}
      </Pill>
      <Pill icon="fa-fire-burner" title={t('Difficulty')}>
        {t(recipe.difficulty)}
      </Pill>
      {withServes && <Pill icon="fa-utensils">{t('{n} serves', { n: recipe.servings })}</Pill>}
    </>
  )
}

export function Modal({ open, onClose, title, subtitle, icon, children, footer, wide = false }) {
  const { t } = useLang()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cx(
          'card pop-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-b-none sm:rounded-3xl',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}
      >
        <div className="border-line flex items-start gap-3 border-b p-5">
          {icon && (
            <span className="bg-brand-50 text-brand-600 dark:text-brand-300 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              <i className={`fa-solid ${icon}`} aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg leading-tight font-extrabold">{title}</h2>
            {subtitle && <p className="meta mt-1">{subtitle}</p>}
          </div>
          <button className="btn-icon text-muted hover:bg-surface-2" onClick={onClose} aria-label={t('Close')}>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-line bg-surface-2 flex flex-wrap justify-end gap-2 border-t p-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Toasts({ toasts, dismiss }) {
  const tones = {
    ok: { icon: 'fa-circle-check', cls: 'bg-brand-600 text-white' },
    warn: { icon: 'fa-triangle-exclamation', cls: 'bg-amber-soft text-amber-ink border border-amber-ink/20' },
    info: { icon: 'fa-circle-info', cls: 'bg-surface text-ink border border-line' },
  }
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((t) => {
        const tone = tones[t.tone] ?? tones.ok
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={cx(
              'pop-in pointer-events-auto flex max-w-sm cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold shadow-lg',
              tone.cls,
            )}
          >
            <i className={`fa-solid ${tone.icon}`} aria-hidden />
            <span className="min-w-0">{t.message}</span>
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({ icon = 'fa-utensils', title, children, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="bg-brand-50 text-brand-500 flex h-16 w-16 items-center justify-center rounded-3xl text-2xl">
        <i className={`fa-solid ${icon}`} aria-hidden />
      </span>
      <h3 className="text-lg font-extrabold">{title}</h3>
      {children && <p className="text-ink-2 max-w-md text-sm">{children}</p>}
      {action}
    </div>
  )
}

export function SectionHeader({ title, hint, action }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="panel-title">{title}</h2>
        {hint && <p className="meta mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

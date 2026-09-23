import { categoryIcon, categoryLabel, cx, fmtTime, totalTime } from '../lib/util.js'
import { recipeText, useLang } from '../lib/i18n.js'
import { CuisineDot, RecipeImage, SpiceMeter } from './common.jsx'

export default function RecipeCard({ recipe, onOpen, onToggleMenu, inMenu, saved, onToggleSave }) {
  const { lang, t } = useLang()
  const text = recipeText(recipe, lang)
  const main = recipe.categories?.[0]

  return (
    <article className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <button
        onClick={() => onOpen(recipe)}
        className="relative block cursor-pointer text-left"
        aria-label={t('Open {title}', { title: recipe.title })}
      >
        <RecipeImage recipe={recipe} className="h-40 w-full transition-transform duration-300 group-hover:scale-[1.03]" />
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-xl bg-white/90 px-2.5 py-1 text-[11px] font-bold text-brand-800 shadow-sm">
          <CuisineDot cuisine={recipe.cuisine} />
          {recipe.cuisine}
        </span>
        {recipe.kidFriendly && (
          <span
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-sm text-amber-ink shadow-sm"
            title={t('Kid-approved')}
          >
            <i className="fa-solid fa-child-reaching" aria-hidden />
          </span>
        )}
      </button>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-4">
        <div>
          <button onClick={() => onOpen(recipe)} className="cursor-pointer text-left">
            <h3 className="line-clamp-2 leading-snug font-extrabold hover:text-brand-600">{recipe.title}</h3>
          </button>
          {recipe.localTitle && <p className="meta mt-0.5 italic">{recipe.localTitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="meta inline-flex items-center gap-1.5">
            <i className="fa-solid fa-clock text-brand-500" aria-hidden />
            {fmtTime(totalTime(recipe))}
          </span>
          {main && (
            <span className="meta inline-flex items-center gap-1.5">
              <i className={`fa-solid ${categoryIcon(main)} text-brand-500`} aria-hidden />
              {t(categoryLabel(main))}
            </span>
          )}
          <SpiceMeter level={recipe.spicy} showLabel={false} />
        </div>

        <p className="text-ink-2 line-clamp-2 text-xs leading-relaxed">{text.description}</p>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            onClick={() => onToggleMenu(recipe)}
            className={cx('flex-1 text-xs', inMenu ? 'btn-ghost' : 'btn-soft')}
            title={t(inMenu ? 'Remove from this week' : 'Add to this week')}
          >
            <i className={`fa-solid ${inMenu ? 'fa-circle-check text-brand-500' : 'fa-plus'}`} aria-hidden />
            {t(inMenu ? 'On the menu' : 'Add to week')}
          </button>
          <button
            onClick={() => onToggleSave(recipe)}
            className={cx(
              'btn-icon shrink-0 border',
              saved ? 'bg-amber-soft text-amber-ink border-transparent' : 'border-line text-muted hover:bg-surface-2',
            )}
            title={t(saved ? 'Remove from cookbook' : 'Save to cookbook')}
            aria-label={t(saved ? 'Remove from cookbook' : 'Save to cookbook')}
          >
            <i className={cx(saved ? 'fa-solid' : 'fa-regular', 'fa-bookmark')} aria-hidden />
          </button>
        </div>
      </div>
    </article>
  )
}

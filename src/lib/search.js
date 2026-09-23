// Weighted full-text search across titles, cuisines, categories, tags,
// ingredients and the step text — so "kalamansi", "30 minutes" or "simmer"
// all find something useful.
//
// Both languages are indexed at once, so "manok" finds the chicken dishes even
// while the app is in English, and "chicken" still works in Filipino mode.

import { recipeText } from './i18n.js'

const norm = (s = '') =>
  s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Pre-compute the search index once per recipe list. */
export function buildIndex(recipes) {
  return recipes.map((r) => {
    const fil = r.fil ?? {}
    return {
      recipe: r,
      title: norm(`${r.title} ${r.localTitle || ''}`),
      cuisine: norm(r.cuisine),
      cats: norm([...(r.categories || []), ...(r.tags || [])].join(' ')),
      ingredients: norm(
        [
          ...(r.ingredients || []).map((i) => `${i.item} ${i.note || ''}`),
          ...(fil.ingredients || []),
        ].join(' '),
      ),
      detail: norm(
        [
          r.description,
          ...(r.steps || []),
          ...(r.tips || []),
          fil.description || '',
          ...(fil.steps || []),
        ].join(' '),
      ),
    }
  })
}

const FIELD_WEIGHTS = [
  ['title', 100],
  ['cuisine', 40],
  ['cats', 30],
  ['ingredients', 18],
  ['detail', 8],
]

/**
 * Returns [{ recipe, score, hit }] sorted best-first.
 * `hit` says which field matched, so the UI can show *why* a row is there.
 */
export function searchIndex(index, query, limit = Infinity) {
  const q = norm(query)
  if (!q) return []
  const terms = q.split(' ').filter(Boolean)
  const results = []

  for (const entry of index) {
    let score = 0
    let hit = null
    let matchedAll = true

    for (const term of terms) {
      let termScore = 0
      let termHit = null
      for (const [field, weight] of FIELD_WEIGHTS) {
        const hay = entry[field]
        const at = hay.indexOf(term)
        if (at === -1) continue
        // Whole-word and prefix matches beat mid-word ones.
        const isStart = at === 0 || hay[at - 1] === ' '
        const value = weight * (isStart ? 1.6 : 1) + (entry.title === term ? 60 : 0)
        if (value > termScore) {
          termScore = value
          termHit = field
        }
      }
      if (!termScore) {
        matchedAll = false
        break
      }
      score += termScore
      if (!hit || FIELD_WEIGHTS.findIndex(([f]) => f === termHit) < FIELD_WEIGHTS.findIndex(([f]) => f === hit))
        hit = termHit
    }

    if (matchedAll && score > 0) results.push({ recipe: entry.recipe, score, hit })
  }

  results.sort((a, b) => b.score - a.score || a.recipe.title.localeCompare(b.recipe.title))
  return limit === Infinity ? results : results.slice(0, limit)
}

/** Human label for the matched field, shown in the suggestion dropdown. */
export const hitLabel = {
  title: 'recipe',
  cuisine: 'cuisine',
  cats: 'category',
  ingredients: 'ingredient',
  detail: 'in the steps',
}

/**
 * The bit of the recipe that explains the match, in the reading language.
 * Falls back to the description when the hit came from the other language.
 */
export function snippetFor(recipe, query, hit, lang = 'en') {
  const q = norm(query)
  const text = recipeText(recipe, lang)

  if (hit === 'ingredients') {
    const index = recipe.ingredients.findIndex(
      (ing, i) => norm(`${ing.item} ${ing.note || ''}`).includes(q) || norm(text.ingredientNames[i]).includes(q),
    )
    if (index >= 0) return text.ingredientNames[index]
  }

  if (hit === 'detail') {
    const found =
      text.steps.find((s) => norm(s).includes(q)) ??
      recipe.steps.find((s, i) => norm(s).includes(q) && text.steps[i])
    if (found) return found.length > 110 ? `${found.slice(0, 110)}…` : found
  }

  return text.description
}

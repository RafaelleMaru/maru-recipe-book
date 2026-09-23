// Small formatting + scaling helpers. No dependencies on React.

export const cx = (...parts) => parts.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ servings */

// Adult-equivalent portions. The kids eat real but smaller plates:
// 2 adults (1.0 each) + two 8-year-old girls (0.7 each) + one 6-year-old boy (0.6) = 4.0.
export const SERVING_MODES = {
  couple: { key: 'couple', label: '2 adults', portions: 2, icon: 'fa-user-group', hint: '2 adult portions' },
  family: {
    key: 'family',
    label: 'Family of 5',
    portions: 4,
    icon: 'fa-people-roof',
    hint: '2 adults + two 8-y-o girls + one 6-y-o boy ≈ 4 adult portions',
  },
}

export const portionsFor = (mode) => (SERVING_MODES[mode] ?? SERVING_MODES.family).portions

/* ---------------------------------------------------------------- quantities */

const FRACTIONS = [
  [0.125, '⅛'],
  [0.2, '⅕'],
  [0.25, '¼'],
  [0.333, '⅓'],
  [0.375, '⅜'],
  [0.5, '½'],
  [0.625, '⅝'],
  [0.667, '⅔'],
  [0.75, '¾'],
  [0.875, '⅞'],
]

const SPOONS = new Set(['tsp', 'tbsp', 'cup'])
const COUNTS = new Set(['pc', 'clove', 'slice', 'can', 'pack', 'bunch', 'stalk', ''])

const snap = (n, step) => Math.round(n / step) * step

/** Scale one ingredient quantity and round it to something a cook can actually measure. */
export function scaleQty(qty, unit = '', factor = 1) {
  if (qty === null || qty === undefined || !Number.isFinite(qty)) return null
  if (factor === 1) return qty
  const raw = qty * factor
  const u = (unit || '').toLowerCase()

  if (u === 'pinch') return Math.max(1, Math.round(raw))
  if (SPOONS.has(u)) return Math.max(0.125, snap(raw, raw < 1 ? 0.125 : 0.25))
  if (u === 'g' || u === 'ml') {
    if (raw >= 100) return Math.max(10, snap(raw, 10))
    if (raw >= 20) return Math.max(5, snap(raw, 5))
    return Math.max(1, Math.round(raw))
  }
  if (u === 'kg' || u === 'l') return Math.max(0.05, snap(raw, 0.05))
  if (COUNTS.has(u)) return Math.max(0.5, snap(raw, raw < 4 ? 0.5 : 1))
  return Math.round(raw * 100) / 100
}

/** 1.5 → "1½", 0.25 → "¼", 350 → "350". */
export function fmtQty(n) {
  if (n === null || n === undefined) return ''
  if (!Number.isFinite(n)) return String(n)
  const whole = Math.floor(n)
  const rest = n - whole
  if (rest < 0.02) return String(whole)
  for (const [value, glyph] of FRACTIONS) {
    if (Math.abs(rest - value) < 0.03) return whole ? `${whole}${glyph}` : glyph
  }
  return String(Math.round(n * 100) / 100)
}

/** Full "¾ cup soy sauce" line for one ingredient at a given scale. */
export function fmtIngredient(ing, factor = 1) {
  const qty = scaleQty(ing.qty, ing.unit, factor)
  const amount = qty === null ? '' : `${fmtQty(qty)}${ing.unit && ing.unit !== '' ? ` ${ing.unit}` : ''}`
  return [amount, ing.item].filter(Boolean).join(' ').trim()
}

/* --------------------------------------------------------------------- time */

export function fmtTime(mins) {
  const m = Math.max(0, Math.round(mins || 0))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h} hr ${rem} min` : `${h} hr`
}

export const totalTime = (r) => (r.prepMinutes || 0) + (r.cookMinutes || 0)

/* -------------------------------------------------------------------- misc */

export const titleCase = (s = '') => s.charAt(0).toUpperCase() + s.slice(1)

export const shuffle = (arr, rand = Math.random) => {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const uniqBy = (arr, key) => {
  const seen = new Set()
  return arr.filter((x) => {
    const k = key(x)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const CUISINES = ['Filipino', 'Japanese', 'Korean', 'Chinese', 'Mexican', 'Indian']

// Flag emoji don't render on Windows, so each cuisine gets a colour dot instead.
export const CUISINE_META = {
  Filipino: { dot: '#f2a33c', tint: 'from-amber-100 to-rose-100' },
  Japanese: { dot: '#e0596f', tint: 'from-rose-100 to-sky-100' },
  Korean: { dot: '#3f6bd8', tint: 'from-red-100 to-indigo-100' },
  Chinese: { dot: '#d8362a', tint: 'from-red-100 to-amber-100' },
  Mexican: { dot: '#2f9e52', tint: 'from-lime-100 to-orange-100' },
  Indian: { dot: '#e8821f', tint: 'from-orange-100 to-yellow-100' },
}

// Food types the user filters by, with the Font Awesome icon for each.
export const CATEGORY_META = {
  beef: { label: 'Beef', icon: 'fa-cow' },
  pork: { label: 'Pork', icon: 'fa-bacon' },
  chicken: { label: 'Chicken', icon: 'fa-drumstick-bite' },
  fish: { label: 'Fish', icon: 'fa-fish' },
  seafood: { label: 'Seafood', icon: 'fa-shrimp' },
  vegetable: { label: 'Vegetables', icon: 'fa-carrot' },
  tofu: { label: 'Tofu', icon: 'fa-cube' },
  egg: { label: 'Egg', icon: 'fa-egg' },
  noodle: { label: 'Noodles', icon: 'fa-bowl-food' },
  rice: { label: 'Rice', icon: 'fa-bowl-rice' },
  soup: { label: 'Soup', icon: 'fa-mug-hot' },
  dessert: { label: 'Dessert', icon: 'fa-ice-cream' },
  breakfast: { label: 'Breakfast', icon: 'fa-mug-saucer' },
}

export const categoryLabel = (c) => CATEGORY_META[c]?.label ?? titleCase(c)
export const categoryIcon = (c) => CATEGORY_META[c]?.icon ?? 'fa-utensils'

export const imageFor = (r) => `./images/recipes/${r.id}.svg`
export const photoFor = (r) => `./images/recipes/${r.id}.jpg`

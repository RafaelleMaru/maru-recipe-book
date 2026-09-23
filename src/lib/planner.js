// Weekly-menu generation and shopping-list aggregation.

import { CUISINES, scaleQty, shuffle, totalTime } from './util.js'

const QUICK_MINUTES = 35

/**
 * Pick `count` recipes for the menu.
 *
 * Uniqueness is enforced on three levels:
 *  1. never a recipe already on the menu (`excludeIds`),
 *  2. never a recipe cooked in the recent `history` — until the fresh pool runs dry,
 *  3. never the same recipe twice inside one batch.
 *
 * On top of that it balances the batch: spread across cuisines, a mix of proteins,
 * at least two vegetable-forward dishes and at least three fast ones.
 */
export function generateMenu(recipes, { count = 10, excludeIds = [], history = [], filters = {} } = {}) {
  const excluded = new Set(excludeIds)
  const historySet = new Set(history)

  const passesFilters = (r) => {
    if (filters.cuisines?.length && !filters.cuisines.includes(r.cuisine)) return false
    if (filters.kidSafeOnly && !r.kidFriendly) return false
    if (Number.isFinite(filters.maxSpice) && (r.spicy ?? 0) > filters.maxSpice) return false
    if (filters.quickOnly && totalTime(r) > QUICK_MINUTES) return false
    if (filters.vegetarianOnly && !isVegetarian(r)) return false
    return true
  }

  const eligible = recipes.filter((r) => !excluded.has(r.id) && passesFilters(r))
  const fresh = eligible.filter((r) => !historySet.has(r.id))

  // Prefer unseen recipes; only fall back to repeats when the fresh pool can't fill the batch.
  let pool = fresh
  let recycled = false
  if (pool.length < count) {
    recycled = pool.length > 0 || eligible.length > 0
    // Least-recently-cooked first: history is newest-first, so a later index = older.
    const repeats = eligible
      .filter((r) => historySet.has(r.id))
      .sort((a, b) => history.indexOf(b.id) - history.indexOf(a.id))
    pool = [...fresh, ...repeats]
  }

  const target = Math.min(count, pool.length)
  const perCuisineCap = Math.max(2, Math.ceil(target / CUISINES.length) + 1)

  const picked = []
  const cuisineCount = {}
  const categoryCount = {}
  let quickCount = 0
  let vegCount = 0
  let dessertCount = 0

  const candidates = shuffle(pool)

  // Greedy balance: each round, take the candidate that best fills the thinnest slot.
  while (picked.length < target) {
    let best = null
    let bestScore = -Infinity

    for (const r of candidates) {
      if (picked.includes(r)) continue
      if ((cuisineCount[r.cuisine] || 0) >= perCuisineCap) continue

      const main = r.categories?.[0] ?? 'other'
      if (main === 'dessert' && dessertCount >= 1) continue // one sweet per batch is plenty
      const remaining = target - picked.length
      let score = 0

      // Reward under-represented cuisines and proteins.
      score += 12 - (cuisineCount[r.cuisine] || 0) * 6
      score += 8 - (categoryCount[main] || 0) * 5

      // Quotas that make a week actually cookable.
      if (vegCount < 2 && main === 'vegetable') score += 14
      if (quickCount < 3 && totalTime(r) <= QUICK_MINUTES) score += 10
      if (remaining <= 3 && vegCount < 2 && main !== 'vegetable') score -= 8
      if (remaining <= 3 && quickCount < 3 && totalTime(r) > QUICK_MINUTES) score -= 6

      // Nudge towards food the kids will eat, without banning the grown-up dishes.
      if (r.kidFriendly) score += 3
      if ((r.spicy ?? 0) >= 3) score -= 4
      if (main === 'dessert') score -= 8 // a dinner slot beats a sweet

      score += Math.random() * 5 // keeps consecutive presses from looking identical

      if (score > bestScore) {
        bestScore = score
        best = r
      }
    }

    if (!best) {
      // Every remaining candidate hit the per-cuisine cap — relax it and finish the batch.
      const rest = candidates.find((r) => !picked.includes(r))
      if (!rest) break
      best = rest
    }

    picked.push(best)
    cuisineCount[best.cuisine] = (cuisineCount[best.cuisine] || 0) + 1
    const main = best.categories?.[0] ?? 'other'
    categoryCount[main] = (categoryCount[main] || 0) + 1
    if (totalTime(best) <= QUICK_MINUTES) quickCount += 1
    if (main === 'vegetable') vegCount += 1
    if (main === 'dessert') dessertCount += 1
  }

  return {
    picked,
    recycled,
    shortfall: count - picked.length,
    poolSize: eligible.length,
    freshSize: fresh.length,
  }
}

const MEAT_WORDS = [
  'chicken', 'pork', 'beef', 'bacon', 'ham', 'sausage', 'longganisa', 'chorizo', 'fish', 'shrimp',
  'prawn', 'squid', 'crab', 'mussel', 'clam', 'anchov', 'bonito', 'dashi', 'oyster sauce', 'fish sauce',
  'patis', 'bagoong', 'lard', 'tocino', 'liver', 'mince', 'ground meat', 'broth',
]

export function isVegetarian(r) {
  if ((r.categories || []).some((c) => ['beef', 'pork', 'chicken', 'fish', 'seafood'].includes(c))) return false
  const text = (r.ingredients || []).map((i) => i.item.toLowerCase()).join(' ')
  return !MEAT_WORDS.some((w) => text.includes(w))
}

/* ------------------------------------------------------------- shopping list */

// Listed in the order you actually walk a market. A row lands in the aisle whose
// longest keyword matches, so "fish sauce" beats "fish" and "coconut milk" beats "milk".
const AISLES = [
  {
    key: 'Produce',
    icon: 'fa-carrot',
    match: [
      'onion', 'garlic', 'ginger', 'tomato', 'potato', 'carrot', 'cabbage', 'pechay', 'bok choy', 'kangkong',
      'spinach', 'malunggay', 'eggplant', 'talong', 'okra', 'sitaw', 'green bean', 'string bean', 'squash',
      'kalabasa', 'ampalaya', 'radish', 'labanos', 'lemon', 'lime', 'calamansi', 'kalamansi', 'chilli', 'chili',
      'chile', 'chiles', 'siling', 'guajillo', 'ancho', 'chipotle', 'arbol', 'árbol', 'serrano', 'poblano',
      'jalapeno', 'jalapeño', 'habanero', 'bell pepper', 'scallion', 'spring onion', 'green onion', 'leek',
      'cucumber', 'papaya', 'banana', 'mango', 'pear', 'apple', 'pineapple', 'coriander', 'cilantro', 'basil',
      'mint', 'lettuce', 'mushroom', 'shiitake', 'kabocha', 'daikon', 'bean sprout', 'togue', 'broccoli',
      'cauliflower', 'gobi', 'tomatillo', 'avocado', 'corn', 'sayote', 'chayote', 'celery', 'chives', 'curry leaves', 'peas', 'parsley', 'taro', 'gabi', 'water chestnut', 'olives', 'orange', 'hominy', 'lemongrass', 'tanglad', 'bitter gourd', 'french bean', 'lotus root', 'nagaimo', 'mountain yam', 'nopales', 'nopalitos', 'pea shoot', 'pomegranate', 'jackfruit', 'langka', 'plantain', 'shallot', 'winter melon', 'gosari', 'fernbrake', 'lima', 'sprouts', 'pico de gallo', 'capsicum', 'drumstick', 'pumpkin', 'kalabasa', 'zucchini', 'calabacitas', 'bamboo shoot', 'gobo', 'burdock', 'ginseng', 'coconut', 'jujube',
    ],
  },
  {
    key: 'Meat & Seafood',
    icon: 'fa-drumstick-bite',
    match: [
      'chicken', 'pork', 'beef', 'liempo', 'ribeye', 'sirloin', 'brisket', 'chuck', 'short rib', 'flank',
      'skirt steak', 'bulgogi-cut', 'bacon', 'ham', 'sausage', 'longganisa', 'chorizo', 'mince', 'ground meat',
      'fish', 'bangus', 'tilapia', 'salmon', 'saba', 'mackerel', 'sea bass', 'snapper', 'shrimp', 'prawn',
      'squid', 'crab', 'mussel', 'clam', 'tuna', 'paneer', 'tofu', 'tokwa', 'egg', 'inari age', 'oxtail', 'buntot', 'liver spread', 'konnyaku', 'octopus', 'tripe', 'twalya', 'pusit', 'squid',
    ],
  },
  {
    key: 'Dairy & Chilled',
    icon: 'fa-cheese',
    match: [
      'milk', 'cream', 'yoghurt', 'yogurt', 'curd', 'cheese', 'queso', 'oaxaca', 'cheddar', 'condensed milk',
      'evaporated milk', 'kimchi', 'crema',
    ],
  },
  {
    key: 'Rice, Noodles & Bread',
    icon: 'fa-bowl-rice',
    match: [
      'rice', 'bihon', 'canton', 'noodle', 'pasta', 'udon', 'soba', 'ramen', 'somen', 'vermicelli',
      'dangmyeon', 'tortilla', 'bread', 'flour', 'atta', 'wrapper', 'lumpia', 'wonton', 'tteok', 'rice cake',
      'poha', 'semolina', 'sooji', 'masa', 'pav', 'puri', 'papdi', 'sev', 'wheat starch', 'bun', 'roll',
    ],
  },
  {
    key: 'Sauces & Pantry',
    icon: 'fa-bottle-droplet',
    match: [
      'soy sauce', 'toyo', 'vinegar', 'suka', 'fish sauce', 'patis', 'bagoong', 'shrimp paste', 'oyster sauce',
      'hoisin', 'sesame oil', 'cooking oil', 'vegetable oil', 'olive oil', 'chili oil', 'lard', 'ghee', 'butter',
      'mirin', 'sake', 'shaoxing', 'gochujang', 'gochugaru', 'doenjang', 'miso', 'doubanjiang', 'cornstarch',
      'cornflour', 'sugar', 'honey', 'coconut milk', 'gata', 'coconut cream', 'tamarind', 'sampalok', 'bouillon',
      'stock cube', 'chicken stock', 'chicken broth', 'beef broth', 'tomato sauce', 'tomato paste', 'canned',
      'peanut butter', 'peanut', 'cashew', 'almond', 'walnut', 'mayonnaise', 'ketchup', 'baking powder',
      'baking soda', 'yeast', 'vanilla', 'extract', 'lentil', 'dal', 'chickpea', 'garbanzo', 'kidney bean',
      'black bean', 'pinto bean', 'mung bean', 'refried bean', 'monggo', 'munggo', 'gelatin', 'agar', 'raisin', 'pumpkin seed', 'pepitas', 'mustard oil', 'salsa', 'youtiao', 'fried shallot', 'toothpick', ' oil', 'coffee', 'chocolate', 'mustard', 'okonomiyaki sauce', 'tonkatsu sauce', 'ssamjang', 'bean paste', 'bean sauce', 'anko', 'tenkasu', 'pine nut', 'chestnut', 'nuts', 'soybean', 'liquid seasoning', 'skewer', 'seeds', 'coconut oil', 'worcestershire', 'capers', 'sesame paste', 'curry roux', 'stock', 'broth', 'wine',
    ],
  },
  {
    key: 'Spices & Seasoning',
    icon: 'fa-mortar-pestle',
    match: [
      'salt', 'pepper', 'peppercorn', 'bay leaf', 'laurel', 'cumin', 'coriander seed', 'turmeric', 'garam masala',
      'chilli powder', 'chili powder', 'paprika', 'oregano', 'cinnamon', 'clove', 'cardamom', 'star anise',
      'fennel', 'mustard seed', 'curry powder', 'curry paste', 'sesame seed', 'furikake', 'nori', 'wakame',
      'kombu', 'katsuobushi', 'bonito', 'dashi', 'msg', 'annatto', 'atsuete', 'epazote', 'achiote', 'asafoetida',
      'hing', 'fenugreek', 'kasuri', 'togarashi', 'shichimi', 'sansho', 'five spice', 'chaat masala', 'rasam powder', 'sambar powder', 'kokum', 'jaggery', 'five-spice', 'saffron', 'wasabi', 'dasima', 'kelp', 'daechu', 'bay leaves', 'carom', 'ajwain', 'ya cai', 'miyeok', 'seaweed', 'gulaman',
    ],
  },
]

/** Longest keyword wins, so specific phrases outrank generic words. */
const aisleFor = (item) => {
  const s = item.toLowerCase()
  let best = { key: 'Other', length: 0 }
  for (const aisle of AISLES) {
    for (const word of aisle.match) {
      if (s.includes(word) && word.length > best.length) best = { key: aisle.key, length: word.length }
    }
  }
  return best.key
}

// Clauses that describe prep, not the thing you buy — in both languages.
const PREP_CLAUSE =
  /^(cut|sliced|slice|chopped|chop|minced|mince|diced|dice|crushed|grated|julienned|cracked|beaten|shredded|peeled|trimmed|cubed|halved|quartered|cleaned|scored|drained|rinsed|soaked|torn|pounded|deveined|deseeded|seeded|stemmed|toasted|rehydrated|thawed|at room temperature|room temperature|for |from |plus |divided|optional|to taste|as needed|to |or |o kung|kung kailangan|hiwain|hiniwa|hatiin|hinati|durugin|dinurog|tadtarin|tinadtad|balatan|binalatan|pitpitin|pinitpit|gadgarin|ginadgad|batihin|binati|linisin|nilinis|banlawan|ibabad|ibinabad|talupan|tinalupan|i-drain|i-toast|i-marinate|pinaghiwa|kada serving|per serving|depende sa panlasa|kung kailangan|optional lang)/i

// Things the market list shouldn't send you shopping for.
const NOT_SHOPPING = /^((ice[- ]?cold|iced|cold|hot|warm|boiling|room.?temperature|filtered|tap)\s+)?(water|ice|ice cubes)$/i

// Prep participles that lead a name — "chopped onion" is still just onion.
// "ground" is deliberately absent: ground beef and ground pork are their own cuts.
const LEADING_PREP =
  /^(chopped|sliced|minced|diced|grated|crushed|shredded|beaten|julienned|cubed|halved|quartered|toasted|cooked|steamed|boiled|peeled|deveined|hiniwang|dinurog na|tinadtad na|ginadgad na|binating|niluto na|pinakuluang|binalatan na)\s+/i

// Different names for the same purchase.
const SYNONYMS = [
  [/^(neutral|frying|canola|corn|sunflower|peanut|any neutral)?\s*(cooking\s*)?oil$/i, 'cooking oil'],
  [/^(granulated|white|caster)\s+sugar$/i, 'sugar'],
  [/^(kosher|table|sea|fine)\s+salt$/i, 'salt'],
  [/^(freshly\s+)?(cracked\s+|ground\s+)?black\s+pepper$/i, 'black pepper'],
  // One bunch of herbs covers all of these.
  [/^(fresh\s+)?(cilantro|coriander)(\s+(leaves|sprigs|stems))?$/i, 'coriander leaves (cilantro)'],
  [/^(fresh\s+)?(spring onion|green onion|scallion)s?(\s+.*)?$/i, 'spring onions'],
]

/** The name as it should appear on a shopping list. */
export function marketName(item) {
  // Strip the adverb before testing, so "finely chopped" is recognised as prep
  // just like a bare "chopped".
  const ADVERB = /^((finely|thinly|roughly|coarsely|freshly|lightly|well|very)\s+)+/i
  const kept = item
    .split(',')
    .map((part) => part.trim())
    .filter((part, i) => i === 0 || !PREP_CLAUSE.test(part.replace(ADVERB, '')))
    .join(', ')
    .replace(/\s*\(([^)]*(?:chopped|sliced|minced|optional|divided|to taste)[^)]*)\)/gi, '')
    .replace(/\b(finely|thinly|roughly|coarsely|freshly|lightly)\s+/gi, '')
    .replace(/\s+/g, ' ')
    .replace(LEADING_PREP, '')
    .trim()

  for (const [pattern, replacement] of SYNONYMS) if (pattern.test(kept)) return replacement
  return kept || item
}

const keyFor = (item, unit) => `${marketName(item).toLowerCase()}|${(unit || '').toLowerCase()}`

/**
 * Merge every ingredient on the menu into one market list, grouped by aisle.
 * Same item + same unit gets summed; "to taste" items are listed once without a number.
 */
export function buildShoppingList(recipes, factorFor, nameFor) {
  const bucket = new Map()

  for (const r of recipes) {
    const factor = typeof factorFor === 'function' ? factorFor(r) : factorFor || 1
    ;(r.ingredients || []).forEach((ing, index) => {
      // Merge and shelve by the English name so the two languages group identically,
      // but show whichever name the reader asked for.
      const name = marketName(ing.item)
      // Nobody buys tap water, in any phrasing — but water chestnuts are real.
      const isPlainWater = /^water\b/i.test(name) && !/chestnut/i.test(name)
      if (NOT_SHOPPING.test(name) || isPlainWater) {
        return
      }
      const label = nameFor ? marketName(nameFor(r, index)) : name
      const k = keyFor(ing.item, ing.unit)
      const scaled = scaleQty(ing.qty, ing.unit, factor)
      const existing = bucket.get(k)
      if (existing) {
        if (scaled !== null) existing.qty = (existing.qty ?? 0) + scaled
        if (!existing.recipes.includes(r.title)) existing.recipes.push(r.title)
      } else {
        bucket.set(k, {
          key: k,
          item: label,
          unit: ing.unit || '',
          qty: scaled,
          toTaste: ing.qty === null,
          recipes: [r.title],
          aisle: aisleFor(name),
        })
      }
    })
  }

  const rows = [...bucket.values()]
  const order = [...AISLES.map((a) => a.key), 'Other']

  return order
    .map((key) => ({
      key,
      icon: AISLES.find((a) => a.key === key)?.icon ?? 'fa-basket-shopping',
      items: rows.filter((x) => x.aisle === key).sort((a, b) => a.item.localeCompare(b.item)),
    }))
    .filter((group) => group.items.length > 0)
}

/** Headline numbers for the dashboard. */
export function menuStats(recipes) {
  const minutes = recipes.reduce((sum, r) => sum + totalTime(r), 0)
  const cuisines = new Set(recipes.map((r) => r.cuisine))
  const veg = recipes.filter((r) => isVegetarian(r)).length
  const quick = recipes.filter((r) => totalTime(r) <= QUICK_MINUTES).length
  const kid = recipes.filter((r) => r.kidFriendly).length
  return {
    count: recipes.length,
    minutes,
    avgMinutes: recipes.length ? Math.round(minutes / recipes.length) : 0,
    cuisines: cuisines.size,
    veg,
    quick,
    kid,
  }
}

export { QUICK_MINUTES }

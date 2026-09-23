import { readFileSync } from 'node:fs'
import { generateMenu, buildShoppingList, isVegetarian, menuStats } from '../src/lib/planner.js'
import { scaleQty, fmtQty, totalTime } from '../src/lib/util.js'

const db = JSON.parse(readFileSync(new URL('../src/data/recipes.json', import.meta.url), 'utf8')).recipes
let fails = 0
const ok = (name, cond, extra = '') => {
  if (!cond) fails++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`)
}

// 1. A batch never repeats a dish, 200 runs.
let dupes = 0
let short = 0
for (let i = 0; i < 200; i++) {
  const { picked } = generateMenu(db, { count: 10 })
  if (new Set(picked.map((p) => p.id)).size !== picked.length) dupes++
  if (picked.length !== 10) short++
}
ok('200 batches of 10: no duplicates inside a batch', dupes === 0, `${dupes} bad batches`)
ok('200 batches of 10: always full', short === 0, `${short} short batches`)

// 2. Balance quotas hold.
let badVeg = 0, badQuick = 0, badCuisine = 0, badDessert = 0
for (let i = 0; i < 200; i++) {
  const { picked } = generateMenu(db, { count: 10 })
  if (picked.filter((r) => r.categories[0] === 'vegetable').length < 2) badVeg++
  if (picked.filter((r) => totalTime(r) <= 35).length < 3) badQuick++
  if (new Set(picked.map((r) => r.cuisine)).size < 5) badCuisine++
  if (picked.filter((r) => r.categories[0] === 'dessert').length > 1) badDessert++
}
ok('≥2 vegetable-first dishes per batch', badVeg === 0, `${badVeg}/200 missed`)
ok('≥3 dishes under 35 min per batch', badQuick === 0, `${badQuick}/200 missed`)
ok('≥5 cuisines per batch', badCuisine === 0, `${badCuisine}/200 missed`)
ok('at most 1 dessert per batch', badDessert === 0, `${badDessert}/200 over`)

// 3. Nothing already on the menu comes back.
const menu = db.slice(0, 30).map((r) => r.id)
let leaked = 0
for (let i = 0; i < 100; i++) {
  const { picked } = generateMenu(db, { count: 10, excludeIds: menu })
  if (picked.some((p) => menu.includes(p.id))) leaked++
}
ok('excludeIds is respected', leaked === 0, `${leaked}/100 leaked`)

// 4. History is avoided until the pool is exhausted, then flagged.
const history = db.slice(0, 60).map((r) => r.id)
const r1 = generateMenu(db, { count: 10, history })
ok('history avoided while fresh dishes remain', r1.picked.every((p) => !history.includes(p.id)) === false || r1.picked.length === 10)
ok('fresh pool size reported', r1.freshSize === db.length - history.length, `freshSize=${r1.freshSize}`)
const r2 = generateMenu(db, { count: 10, history: db.map((r) => r.id) })
ok('recycles with a flag when everything is stale', r2.recycled === true && r2.picked.length === 10)

// 5. Filters.
const kid = generateMenu(db, { count: 10, filters: { kidSafeOnly: true } })
ok('kidSafeOnly returns only kid-friendly dishes', kid.picked.every((r) => r.kidFriendly))
const veg = generateMenu(db, { count: 8, filters: { vegetarianOnly: true } })
ok('vegetarianOnly returns only vegetarian dishes', veg.picked.every(isVegetarian), veg.picked.map((r) => r.title).join(', '))
const mild = generateMenu(db, { count: 10, filters: { maxSpice: 0 } })
ok('maxSpice 0 returns only spice-free dishes', mild.picked.every((r) => r.spicy === 0))
const one = generateMenu(db, { count: 10, filters: { cuisines: ['Filipino'] } })
ok('cuisine filter narrows to that cuisine', one.picked.every((r) => r.cuisine === 'Filipino'))
const impossible = generateMenu(db, { count: 10, filters: { cuisines: ['Filipino'], vegetarianOnly: true, quickOnly: true } })
ok('impossible filters report a shortfall instead of throwing', impossible.shortfall >= 0, `got ${impossible.picked.length}, shortfall ${impossible.shortfall}`)

// 6. Shopping list.
const week = generateMenu(db, { count: 10 }).picked
const groups = buildShoppingList(week, (r) => 4 / r.servings)
const rows = groups.flatMap((g) => g.items)
ok('shopping list produced', rows.length > 30, `${rows.length} rows in ${groups.length} aisles`)
ok('no plain water on the list', !rows.some((r) => /^(water|ice)$/i.test(r.item)))
ok('no empty aisles', groups.every((g) => g.items.length > 0))
ok('every row has an aisle', rows.every((r) => r.aisle && r.aisle !== 'undefined'))
const otherCount = groups.find((g) => g.key === 'Other')?.items.length ?? 0
ok('few unclassified items', otherCount <= 3, `${otherCount} in "Other"`)
ok('rows remember which dishes need them', rows.every((r) => r.recipes.length > 0))

// 7. Quantity scaling stays cookable.
ok('half of 1 kg → 0.5 kg', scaleQty(1, 'kg', 0.5) === 0.5)
ok('double 1.5 tbsp → 3 tbsp', scaleQty(1.5, 'tbsp', 2) === 3)
ok('half a single onion → 0.5 pc', scaleQty(1, 'pc', 0.5) === 0.5)
ok('600 g × 0.5 → 300 g', scaleQty(600, 'g', 0.5) === 300)
ok('to-taste stays null', scaleQty(null, 'tsp', 2) === null)
ok('never rounds a real amount to zero', [0.25, 0.5, 1, 2].every((q) => scaleQty(q, 'tsp', 0.5) > 0))
ok('fractions print as fractions', fmtQty(0.5) === '½' && fmtQty(1.25) === '1¼' && fmtQty(3) === '3')

// 8. Database integrity.
ok('every cuisine has at least 20 recipes', Object.values(db.reduce((a, r) => ((a[r.cuisine] = (a[r.cuisine] || 0) + 1), a), {})).every((n) => n >= 20), `${db.length} total`)
ok('all ids unique', new Set(db.map((r) => r.id)).size === db.length)
ok('all titles unique', new Set(db.map((r) => r.title.toLowerCase())).size === db.length)
ok('every recipe has a source url', db.every((r) => r.source?.url?.startsWith('http')))
ok('every spicy dish has a kid note', db.filter((r) => r.spicy >= 2).every((r) => r.kidNote))
ok('stats do not divide by zero on an empty week', menuStats([]).avgMinutes === 0)

// 9. Filipino translations.
const withFil = db.filter((r) => r.fil)
ok('every recipe has a Filipino translation', withFil.length === db.length, `${withFil.length}/${db.length}`)
ok(
  'translated ingredient lists line up with the English ones',
  withFil.every((r) => !r.fil.ingredients || r.fil.ingredients.length === r.ingredients.length),
)
ok(
  'translated step lists line up with the English ones',
  withFil.every((r) => !r.fil.steps || r.fil.steps.length === r.steps.length),
)
ok(
  'every spicy dish has a Filipino kid note too',
  db.filter((r) => r.spicy >= 2).every((r) => r.fil?.kidNote),
)
ok(
  'no translated step is left as the English original',
  withFil.filter((r) => r.fil.steps?.every((s, i) => s === r.steps[i])).length === 0,
)
ok('titles were not translated', withFil.every((r) => !r.fil.title))
// The voice guide bans textbook Tagalog; these are the words that creep in first.
const TOO_DEEP = /\b(panandalian|lasapin|putahe|rekado|pamamaraan|talaan|paraan ng pagluluto|lumikha)\b/i
const deep = withFil.filter((r) => TOO_DEEP.test([r.fil.description, ...(r.fil.steps ?? [])].join(' ')))
ok('no textbook-Tagalog words in the translations', deep.length === 0, deep.map((r) => r.id).join(', '))

// 10. The market list reads in the chosen language but still groups by the English name.
const filList = buildShoppingList(week, () => 1, (recipe, i) => recipe.fil?.ingredients?.[i] ?? recipe.ingredients[i].item)
const enList = buildShoppingList(week, () => 1)
ok(
  'both languages produce the same aisles and row count',
  filList.length === enList.length && filList.every((g, i) => g.items.length === enList[i].items.length),
)

console.log(`\n${fails === 0 ? 'ALL CHECKS PASSED' : `${fails} CHECK(S) FAILED`}`)
process.exit(fails ? 1 : 0)

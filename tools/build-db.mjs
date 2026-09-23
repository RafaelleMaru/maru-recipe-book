#!/usr/bin/env node
/**
 * Merges every data/cuisines/*.json file into public/data/recipes.json.
 *
 * This is the gate that keeps the database clean: it validates each recipe
 * against docs/RECIPE_SCHEMA.md and refuses duplicate ids or titles, which is
 * what makes "generate 10 more recipes" safe to run again and again.
 *
 *   node tools/build-db.mjs            # build, fail on errors
 *   node tools/build-db.mjs --force    # build anyway, keep only valid recipes
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'data', 'cuisines')
const FIL_DIR = path.join(ROOT, 'data', 'translations')
const OUT_FILE = path.join(ROOT, 'public', 'data', 'recipes.json')
const FORCE = process.argv.includes('--force')

const CUISINES = ['Filipino', 'Japanese', 'Korean', 'Chinese', 'Mexican', 'Indian']
const CATEGORIES = [
  'beef', 'pork', 'chicken', 'fish', 'seafood', 'vegetable', 'egg', 'tofu',
  'noodle', 'rice', 'soup', 'dessert', 'breakfast',
]
const UNITS = [
  'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'pc', 'clove', 'stalk', 'slice',
  'can', 'pack', 'bunch', 'pinch', '',
]
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

const errors = []
const warnings = []

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function validate(recipe, where) {
  const at = (msg) => `${where} → ${recipe?.id || recipe?.title || 'unknown recipe'}: ${msg}`
  const bad = (msg) => errors.push(at(msg))
  const meh = (msg) => warnings.push(at(msg))

  if (!recipe || typeof recipe !== 'object') return bad('not an object')

  for (const field of ['id', 'title', 'cuisine', 'description', 'difficulty', 'nutritionNote']) {
    if (typeof recipe[field] !== 'string' || !recipe[field].trim()) bad(`missing or empty "${field}"`)
  }
  if (recipe.id && !/^[a-z]{3}-[a-z0-9-]+$/.test(recipe.id)) bad(`id "${recipe.id}" must look like fil-chicken-adobo`)
  if (recipe.cuisine && !CUISINES.includes(recipe.cuisine)) bad(`cuisine "${recipe.cuisine}" is not one of ${CUISINES.join(', ')}`)
  if (recipe.difficulty && !DIFFICULTIES.includes(recipe.difficulty)) bad(`difficulty "${recipe.difficulty}" is not Easy/Medium/Hard`)

  if (!Array.isArray(recipe.categories) || recipe.categories.length === 0) bad('categories must be a non-empty array')
  else {
    if (recipe.categories.length > 3) meh(`${recipe.categories.length} categories — schema says 1-3`)
    for (const c of recipe.categories) if (!CATEGORIES.includes(c)) bad(`unknown category "${c}"`)
  }

  for (const field of ['servings', 'prepMinutes', 'cookMinutes', 'spicy']) {
    if (!Number.isFinite(recipe[field])) bad(`"${field}" must be a number`)
  }
  if (Number.isFinite(recipe.servings) && (recipe.servings < 2 || recipe.servings > 6)) meh(`servings ${recipe.servings} outside 2-6`)
  if (Number.isFinite(recipe.spicy) && (recipe.spicy < 0 || recipe.spicy > 3)) bad(`spicy ${recipe.spicy} outside 0-3`)
  if (typeof recipe.kidFriendly !== 'boolean') bad('kidFriendly must be true or false')

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 3) bad('needs at least 3 ingredients')
  else {
    if (recipe.ingredients.length > 20) meh(`${recipe.ingredients.length} ingredients — trim towards 18`)
    recipe.ingredients.forEach((ing, i) => {
      if (!ing || typeof ing !== 'object') return bad(`ingredient ${i + 1} is not an object`)
      if (ing.qty !== null && !Number.isFinite(ing.qty)) bad(`ingredient ${i + 1} ("${ing.item}") qty must be a number or null, got ${JSON.stringify(ing.qty)}`)
      if (typeof ing.unit !== 'string') bad(`ingredient ${i + 1} ("${ing.item}") unit must be a string`)
      else if (!UNITS.includes(ing.unit)) meh(`ingredient ${i + 1} uses unit "${ing.unit}" which is not in the unit list`)
      if (typeof ing.item !== 'string' || !ing.item.trim()) bad(`ingredient ${i + 1} has no item name`)
    })
  }

  if (!Array.isArray(recipe.steps) || recipe.steps.length < 3) bad('needs at least 3 steps')
  else {
    if (recipe.steps.length < 4) meh(`only ${recipe.steps.length} steps — schema asks for 4-10`)
    recipe.steps.forEach((s, i) => {
      if (typeof s !== 'string' || s.trim().length < 12) bad(`step ${i + 1} is too short to be useful`)
      else if (/^\s*\d+[.)]/.test(s)) meh(`step ${i + 1} starts with its own number — the UI adds those`)
    })
  }

  if ((recipe.spicy >= 2 || recipe.kidFriendly === false) && !recipe.kidNote) {
    meh('spicy or not kid-friendly, but no kidNote for the three kids')
  }
  if (!recipe.source?.name || !recipe.source?.url) meh('no source recorded')
  else if (!/^https?:\/\//.test(recipe.source.url)) meh(`source url "${recipe.source.url}" is not a URL`)

  if (recipe.image) meh('drop the "image" field — images resolve from the id')
  for (const junk of ['rating', 'ratings', 'reviews', 'stars', 'calories']) {
    if (junk in recipe) meh(`remove "${junk}" — this app has no ratings or reviews`)
  }

  return errors.length
}

function normalize(recipe) {
  return {
    id: recipe.id.trim(),
    title: recipe.title.trim(),
    localTitle: (recipe.localTitle || '').trim(),
    cuisine: recipe.cuisine,
    categories: recipe.categories.map((c) => c.toLowerCase().trim()),
    tags: (recipe.tags || []).map((t) => t.toLowerCase().trim()),
    description: recipe.description.trim(),
    servings: Math.round(recipe.servings),
    prepMinutes: Math.round(recipe.prepMinutes),
    cookMinutes: Math.round(recipe.cookMinutes),
    difficulty: recipe.difficulty,
    kidFriendly: Boolean(recipe.kidFriendly),
    spicy: Math.round(recipe.spicy),
    ingredients: recipe.ingredients.map((i) => ({
      qty: i.qty === null ? null : Number(i.qty),
      unit: (i.unit || '').trim(),
      item: i.item.trim(),
      ...(i.note ? { note: i.note.trim() } : {}),
      ...(i.group ? { group: i.group.trim() } : {}),
    })),
    steps: recipe.steps.map((s) => s.trim()),
    tips: (recipe.tips || []).map((t) => t.trim()).filter(Boolean),
    ...(recipe.kidNote ? { kidNote: recipe.kidNote.trim() } : {}),
    nutritionNote: recipe.nutritionNote.trim(),
    source: recipe.source?.url
      ? {
          name: recipe.source.name,
          url: recipe.source.url,
          // Provenance of the source page itself — a well-reviewed post is the best
          // authenticity signal we have. Not a rating of this app's recipe.
          ...(Number.isFinite(recipe.source.rating) ? { rating: recipe.source.rating } : {}),
          ...(Number.isFinite(recipe.source.ratingCount) ? { ratingCount: Math.round(recipe.source.ratingCount) } : {}),
        }
      : null,
  }
}

const main = async () => {
  if (!existsSync(SRC_DIR)) {
    console.error(`No source folder at ${SRC_DIR}`)
    process.exit(1)
  }

  const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith('.json')).sort()
  if (!files.length) {
    console.error('No cuisine files found in data/cuisines/. Nothing to build.')
    process.exit(1)
  }

  const byId = new Map()
  const byTitle = new Map()
  const kept = []

  for (const file of files) {
    const where = `data/cuisines/${file}`
    let parsed
    try {
      parsed = JSON.parse(await readFile(path.join(SRC_DIR, file), 'utf8'))
    } catch (err) {
      errors.push(`${where}: invalid JSON — ${err.message}`)
      continue
    }
    const list = Array.isArray(parsed) ? parsed : parsed.recipes
    if (!Array.isArray(list)) {
      errors.push(`${where}: expected a JSON array of recipes`)
      continue
    }

    for (const recipe of list) {
      const before = errors.length
      validate(recipe, where)
      if (errors.length > before) continue

      if (byId.has(recipe.id)) {
        errors.push(`${where} → duplicate id "${recipe.id}" (already from ${byId.get(recipe.id)})`)
        continue
      }
      const titleKey = slug(recipe.title)
      if (byTitle.has(titleKey)) {
        errors.push(`${where} → duplicate title "${recipe.title}" (already from ${byTitle.get(titleKey)})`)
        continue
      }
      byId.set(recipe.id, where)
      byTitle.set(titleKey, where)
      kept.push(normalize(recipe))
    }
  }

  // ---- Filipino (Taglish) translations, merged in from data/translations/*.fil.json
  const byRecipeId = new Map(kept.map((r) => [r.id, r]))
  let translated = 0

  if (existsSync(FIL_DIR)) {
    const filFiles = (await readdir(FIL_DIR)).filter((f) => f.endsWith('.fil.json')).sort()
    for (const file of filFiles) {
      const where = `data/translations/${file}`
      let dict
      try {
        dict = JSON.parse(await readFile(path.join(FIL_DIR, file), 'utf8'))
      } catch (err) {
        errors.push(`${where}: invalid JSON — ${err.message}`)
        continue
      }

      for (const [id, fil] of Object.entries(dict)) {
        const recipe = byRecipeId.get(id)
        if (!recipe) {
          warnings.push(`${where}: "${id}" is not a recipe id in the database`)
          continue
        }
        // Parallel arrays must line up or the UI would pair the wrong text with a quantity.
        if (fil.ingredients && fil.ingredients.length !== recipe.ingredients.length) {
          errors.push(
            `${where} → ${id}: ${fil.ingredients.length} translated ingredients for ${recipe.ingredients.length} English ones`,
          )
          continue
        }
        if (fil.steps && fil.steps.length !== recipe.steps.length) {
          errors.push(`${where} → ${id}: ${fil.steps.length} translated steps for ${recipe.steps.length} English ones`)
          continue
        }
        if (fil.tips && fil.tips.length !== (recipe.tips?.length ?? 0)) {
          warnings.push(`${where} → ${id}: tips count differs, so the English tips are kept`)
        }
        if (fil.title) warnings.push(`${where} → ${id}: dish titles are never translated, dropping "fil.title"`)

        recipe.fil = {
          ...(fil.description ? { description: fil.description.trim() } : {}),
          ...(fil.ingredients ? { ingredients: fil.ingredients.map((s) => String(s).trim()) } : {}),
          ...(fil.steps ? { steps: fil.steps.map((s) => String(s).trim()) } : {}),
          ...(fil.tips?.length === (recipe.tips?.length ?? 0) && fil.tips?.length
            ? { tips: fil.tips.map((s) => String(s).trim()) }
            : {}),
          ...(fil.kidNote ? { kidNote: fil.kidNote.trim() } : {}),
          ...(fil.nutritionNote ? { nutritionNote: fil.nutritionNote.trim() } : {}),
        }
        translated += 1
      }
    }
  }

  kept.sort((a, b) => a.cuisine.localeCompare(b.cuisine) || a.title.localeCompare(b.title))

  const counts = {}
  for (const r of kept) counts[r.cuisine] = (counts[r.cuisine] || 0) + 1

  if (warnings.length) {
    console.log(`\n⚠  ${warnings.length} warning(s):`)
    for (const w of warnings.slice(0, 40)) console.log(`   · ${w}`)
    if (warnings.length > 40) console.log(`   … and ${warnings.length - 40} more`)
  }

  if (errors.length) {
    console.error(`\n✗  ${errors.length} error(s):`)
    for (const e of errors.slice(0, 40)) console.error(`   · ${e}`)
    if (errors.length > 40) console.error(`   … and ${errors.length - 40} more`)
    if (!FORCE) {
      console.error('\nDatabase not written. Fix the errors above, or re-run with --force to skip bad recipes.\n')
      process.exit(1)
    }
    console.error('\n--force given: writing the database with the valid recipes only.\n')
  }

  await mkdir(path.dirname(OUT_FILE), { recursive: true })
  await writeFile(
    OUT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: kept.length,
        cuisineCounts: counts,
        translatedCount: translated,
        recipes: kept,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  const spread = Object.entries(counts).map(([c, n]) => `${c} ${n}`).join(' · ')
  console.log(`\n✓  ${kept.length} recipes → public/data/recipes.json`)
  console.log(`   ${spread}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

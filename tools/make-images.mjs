#!/usr/bin/env node
/**
 * Draws a placeholder plate illustration for every recipe that doesn't have one yet:
 *   public/images/recipes/<id>.svg
 *
 * The art is deterministic (seeded from the recipe id), tinted per cuisine and
 * plated per main category, so the grid looks composed instead of broken while
 * real photos are still missing.
 *
 * To use a real photo instead, drop public/images/recipes/<id>.jpg next to it —
 * the app prefers the .jpg and silently falls back to this .svg.
 *
 *   node tools/make-images.mjs           # only missing files
 *   node tools/make-images.mjs --force   # redraw everything
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DB = path.join(ROOT, 'src', 'data', 'recipes.json')
const OUT = path.join(ROOT, 'public', 'images', 'recipes')
const FORCE = process.argv.includes('--force')

const CUISINE_BG = {
  Filipino: ['#fff2d9', '#ffdcc4'],
  Japanese: ['#eef4fc', '#fce7ef'],
  Korean: ['#fdeceb', '#e9e9fa'],
  Chinese: ['#fdeaea', '#fdf3da'],
  Mexican: ['#f0fadd', '#ffe7cd'],
  Indian: ['#fff4dd', '#ffe1bf'],
}

const CATEGORY_COLORS = {
  beef: ['#a8503f', '#8d3f31', '#c9705c'],
  pork: ['#e0948e', '#c97a73', '#f0b9b3'],
  chicken: ['#e6b45f', '#d29b45', '#f2cd8c'],
  fish: ['#9cc0d8', '#7ba6c4', '#c2dcec'],
  seafood: ['#ef9a76', '#dd7f58', '#f7c0a6'],
  vegetable: ['#6fae57', '#568c43', '#9ccd85'],
  tofu: ['#f2e8cd', '#e2d4b2', '#fbf5e6'],
  egg: ['#f6c93f', '#e2b224', '#fde49a'],
  noodle: ['#e9cd7c', '#d7b85f', '#f5e4ae'],
  rice: ['#f4f1e6', '#e6e1cf', '#fbfaf4'],
  soup: ['#cf9450', '#b67c3c', '#e3b581'],
  dessert: ['#e2a3c6', '#cb85af', '#f2c9df'],
  breakfast: ['#f0c07a', '#dca85e', '#f8dcae'],
}

const GREENS = ['#5f9e49', '#74b45c', '#87c46f']
const BOWL_CATEGORIES = new Set(['soup', 'noodle', 'rice'])

// --- deterministic randomness ------------------------------------------------

const hash = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const rng = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// --- drawing -----------------------------------------------------------------

function drawSvg(recipe) {
  const rand = rng(hash(recipe.id))
  const main = recipe.categories?.[0] ?? 'vegetable'
  const [bg1, bg2] = CUISINE_BG[recipe.cuisine] ?? ['#eef2ef', '#dfe7e1']
  const palette = CATEGORY_COLORS[main] ?? CATEGORY_COLORS.vegetable
  const isBowl = BOWL_CATEGORIES.has(main)
  const hasVeg = (recipe.categories || []).includes('vegetable') || main === 'vegetable' || rand() > 0.35

  const W = 800
  const H = 560
  const cx = 400
  const cy = 290 // centred low so a 4:3 or banner crop still frames the plate
  const plateR = 186

  const parts = []

  // Confetti dots in the background for a bit of texture.
  const dots = []
  for (let i = 0; i < 26; i++) {
    const x = 20 + rand() * (W - 40)
    const y = 20 + rand() * (H - 40)
    const r = 3 + rand() * 9
    if (Math.hypot(x - cx, y - cy) < plateR + 40) continue
    dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${(0.18 + rand() * 0.3).toFixed(2)}"/>`)
  }
  parts.push(dots.join(''))

  // Plate or bowl.
  if (isBowl) {
    // Rice bowls need a warmer bowl colour or the cream mound vanishes into it.
    const broth = main === 'rice' ? '#e3b581' : palette[0]
    parts.push(`
    <circle cx="${cx}" cy="${cy}" r="${plateR + 10}" fill="#ffffff" opacity="0.96"/>
    <circle cx="${cx}" cy="${cy}" r="${plateR - 6}" fill="${broth}" opacity="0.82"/>
    <circle cx="${cx}" cy="${cy}" r="${plateR - 6}" fill="none" stroke="#000000" stroke-opacity="0.06" stroke-width="3"/>`)
  } else {
    parts.push(`
    <circle cx="${cx}" cy="${cy}" r="${plateR + 10}" fill="#ffffff" opacity="0.96"/>
    <circle cx="${cx}" cy="${cy}" r="${plateR - 22}" fill="#ffffff"/>
    <circle cx="${cx}" cy="${cy}" r="${plateR - 22}" fill="none" stroke="#000000" stroke-opacity="0.05" stroke-width="2"/>`)
  }

  // The food itself: blobs in a loose ring plus a centre mound.
  const blobs = []
  const count = 7 + Math.floor(rand() * 4)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.5
    const dist = (isBowl ? 42 : 34) + rand() * (isBowl ? 78 : 92)
    const x = cx + Math.cos(angle) * dist
    const y = cy + Math.sin(angle) * dist * 0.82
    const r = 20 + rand() * 26
    const useGreen = hasVeg && i % 3 === 2
    const fill = useGreen ? GREENS[Math.floor(rand() * GREENS.length)] : palette[Math.floor(rand() * palette.length)]
    const rot = Math.floor(rand() * 180)
    blobs.push(
      `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * (0.62 + rand() * 0.3)).toFixed(1)}" fill="${fill}" opacity="0.94" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"/>`,
    )
  }
  // Centre mound for rice/noodle bowls.
  if (isBowl) {
    blobs.unshift(
      `<ellipse cx="${cx}" cy="${cy + 6}" rx="74" ry="56" fill="${main === 'rice' ? '#fbfaf3' : palette[2]}" opacity="0.95"/>`,
    )
  }
  parts.push(blobs.join(''))

  // Sesame / herb speckles on top.
  const speck = []
  for (let i = 0; i < 16; i++) {
    const angle = rand() * Math.PI * 2
    const dist = rand() * (plateR - 60)
    speck.push(
      `<circle cx="${(cx + Math.cos(angle) * dist).toFixed(1)}" cy="${(cy + Math.sin(angle) * dist * 0.8).toFixed(1)}" r="${(1.6 + rand() * 2.4).toFixed(1)}" fill="${rand() > 0.5 ? '#3f6b32' : '#ffffff'}" opacity="0.7"/>`,
    )
  }
  parts.push(speck.join(''))

  // Steam for hot bowls.
  if (isBowl) {
    parts.push(`
    <g stroke="#ffffff" stroke-opacity="0.65" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M${cx - 46} ${cy - plateR - 6} c -14 -26 14 -42 0 -62"/>
      <path d="M${cx} ${cy - plateR - 18} c -16 -30 16 -48 0 -70"/>
      <path d="M${cx + 46} ${cy - plateR - 6} c -14 -26 14 -42 0 -62"/>
    </g>`)
  }

  // Only a cuisine pill. The dish name is deliberately NOT drawn: the app always
  // shows it as real text beside the image, and thumbnails crop the artwork, which
  // would slice any baked-in wordmark in half.
  const pillW = 74 + recipe.cuisine.length * 11
  parts.push(`
    <g>
      <rect x="40" y="36" rx="19" ry="19" width="${pillW}" height="38" fill="#ffffff" opacity="0.82"/>
      <text x="${40 + pillW / 2}" y="61" text-anchor="middle"
        font-family="Segoe UI, system-ui, sans-serif" font-size="19" font-weight="700" fill="#2b5a41"
        letter-spacing="0.6">${esc(recipe.cuisine.toUpperCase())}</text>
    </g>`)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(recipe.title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${parts.join('\n  ')}
</svg>
`
}

const APP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="16" fill="#268a55"/>
  <path d="M14 27h36v13a11 11 0 0 1-11 11H25a11 11 0 0 1-11-11V27z" fill="#ffffff"/>
  <rect x="10" y="22" width="44" height="6" rx="3" fill="#d8f2e4"/>
  <rect x="47" y="30" width="9" height="6" rx="3" fill="#d8f2e4"/>
  <path d="M26 17c0-3 4-3 4-6M34 17c0-3 4-3 4-6" stroke="#d8f2e4" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>
`

const main = async () => {
  if (!existsSync(DB)) {
    console.error('src/data/recipes.json is missing — run `npm run db` first.')
    process.exit(1)
  }
  const { recipes } = JSON.parse(await readFile(DB, 'utf8'))
  await mkdir(OUT, { recursive: true })

  const existing = new Set(await readdir(OUT).catch(() => []))
  let written = 0
  let skipped = 0
  let photos = 0

  for (const recipe of recipes) {
    if (existing.has(`${recipe.id}.jpg`) || existing.has(`${recipe.id}.png`)) photos += 1
    const file = path.join(OUT, `${recipe.id}.svg`)
    if (!FORCE && existsSync(file)) {
      skipped += 1
      continue
    }
    await writeFile(file, drawSvg(recipe), 'utf8')
    written += 1
  }

  await writeFile(path.join(ROOT, 'public', 'images', 'icon.svg'), APP_ICON, 'utf8')

  console.log(`\n✓  ${written} plate illustration(s) drawn, ${skipped} already there`)
  if (photos) console.log(`   ${photos} recipe(s) have a real photo that overrides the drawing`)
  console.log(`   → public/images/recipes/\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

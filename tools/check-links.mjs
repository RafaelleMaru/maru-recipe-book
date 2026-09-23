#!/usr/bin/env node
/**
 * Checks that every recipe's source link still resolves.
 *
 * Recipe sites reorganise and posts disappear, so a link that worked when the
 * recipe was researched can rot later. This is the tool that catches it.
 *
 *   node tools/check-links.mjs           # sample ~40 links (fast)
 *   node tools/check-links.mjs --all     # check every link (slow, be patient)
 */

import { readFileSync } from 'node:fs'

const DB = new URL('../public/data/recipes.json', import.meta.url)
const ALL = process.argv.includes('--all')
const CONCURRENCY = 8
const TIMEOUT_MS = 20000

const db = JSON.parse(readFileSync(DB, 'utf8')).recipes
const withSource = db.filter((r) => r.source?.url)
const missing = db.filter((r) => !r.source?.url)

const targets = ALL ? withSource : withSource.filter((_, i) => i % Math.ceil(withSource.length / 40) === 0)

const check = async (recipe) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  const opts = { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 (link check)' } }
  try {
    let res = await fetch(recipe.source.url, { ...opts, method: 'HEAD' })
    // Plenty of sites refuse HEAD but serve GET perfectly well.
    if (!res.ok && [403, 404, 405, 501].includes(res.status)) {
      res = await fetch(recipe.source.url, { ...opts, method: 'GET' })
    }
    if (res.ok) return null
    // Maangchi, The Kitchn and friends block scripted requests outright. That is
    // bot protection, not a dead link — these open fine in a real browser, so they
    // are reported separately instead of failing the run.
    if ([401, 403, 429].includes(res.status)) {
      return { blocked: true, line: `${res.status}  ${recipe.id}  ${recipe.source.url}` }
    }
    return { line: `${res.status}  ${recipe.id}  ${recipe.source.url}` }
  } catch (err) {
    return { line: `ERR   ${recipe.id}  ${recipe.source.url}  (${err.name})` }
  } finally {
    clearTimeout(timer)
  }
}

const queue = [...targets]
const failures = []
const blocked = []
let done = 0

const worker = async () => {
  while (queue.length) {
    const recipe = queue.shift()
    const problem = await check(recipe)
    done += 1
    if (problem?.blocked) blocked.push(problem.line)
    else if (problem) failures.push(problem.line)
    if (done % 20 === 0) process.stdout.write(`  …${done}/${targets.length}\n`)
  }
}

console.log(`\nChecking ${targets.length} of ${withSource.length} source links${ALL ? '' : ' (sample — use --all for everything)'}…\n`)
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

const rated = withSource.filter((r) => Number.isFinite(r.source.rating))
console.log(`\n${targets.length - failures.length - blocked.length}/${targets.length} links resolve`)
console.log(`${rated.length}/${db.length} recipes cite a source with a published rating`)
if (missing.length) console.log(`${missing.length} recipe(s) have no source at all: ${missing.map((r) => r.id).join(', ')}`)

if (blocked.length) {
  console.log(`\n${blocked.length} link(s) refused the script (bot protection — these open fine in a browser):`)
  blocked.forEach((b) => console.log('  ' + b))
}

if (failures.length) {
  console.log(`\n${failures.length} link(s) are genuinely broken:`)
  failures.forEach((f) => console.log('  ' + f))
  process.exit(1)
}
console.log('\nNo broken links.\n')

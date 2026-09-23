// Browser-side persistence. Everything the family changes (the menu, the cookbook,
// the cooked history, preferences) lives in localStorage and can be exported to a
// JSON file, so the plan moves to another PC with the folder.

import { useCallback, useEffect, useRef, useState } from 'react'

const PREFIX = 'maru.'
const VERSION = 1

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

const write = (key, value) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* private mode / quota — the app still works for this session */
  }
}

/** useState backed by localStorage. `initial` may be a lazy factory, as in useState. */
export function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    const stored = read(key, undefined)
    if (stored !== undefined) return stored
    return typeof initial === 'function' ? initial() : initial
  })
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    write(key, value)
  }, [key, value])

  return [value, setValue]
}

export const STORE_KEYS = ['menu', 'plan', 'cookbook', 'history', 'servings', 'theme', 'lang', 'checked']

/** Bundle every saved key into one portable object. */
export function snapshot() {
  const data = {}
  for (const key of STORE_KEYS) {
    const value = read(key, undefined)
    if (value !== undefined) data[key] = value
  }
  return { app: 'maru-recipe-book', version: VERSION, exportedAt: new Date().toISOString(), data }
}

export function downloadBackup() {
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `maru-menu-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Restore a backup file. Returns a {key, vars} pair the caller translates;
 * thrown messages are dictionary keys too, so both languages read naturally.
 */
export async function restoreBackup(file) {
  const text = await file.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (parsed?.app !== 'maru-recipe-book' || !parsed.data) {
    throw new Error('That file was not exported from Maru Recipe Book.')
  }
  let restored = 0
  for (const [key, value] of Object.entries(parsed.data)) {
    if (STORE_KEYS.includes(key)) {
      write(key, value)
      restored += 1
    }
  }
  return { key: 'Restored {n} section(s) from {file}.', vars: { n: restored, file: file.name } }
}

/** Prefer OS dark mode on first run, then remember the manual choice. */
export function initialTheme() {
  const saved = read('theme', null)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Tiny toast queue shared by the whole app. */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  return { toasts, push, dismiss }
}

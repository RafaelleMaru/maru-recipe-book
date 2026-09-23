# Adding more recipes

The database is plain JSON files in `data/cuisines/` — **every** `.json` file in that folder
is merged, so a cuisine can be split across several. That's the safe way to add a batch:
write the new dishes to their own file (`filipino-more.json`, `filipino-2024.json`, whatever)
and the researched files you already trust are never touched.

Nothing else needs to change to add a dish: the build merges the files, rejects duplicates,
draws a placeholder image and the site picks it up.

## The loop

```bash
npm run db       # merge + validate data/cuisines/*.json  →  public/data/recipes.json
npm run images   # draw a plate illustration for any recipe that doesn't have one
npm run dev      # look at it
```

`npm run build` runs `npm run db` first, so a broken recipe fails the deploy instead of
shipping quietly. If a file has errors the database is **not** rewritten — fix the errors, or
run `node tools/build-db.mjs --force` to build with only the valid recipes.

## Asking Claude to research the next batch

Paste this into Claude Code in this folder. It is the same brief every recipe in the book was
written from, so the results stay consistent.

> Research 10 more authentic **&lt;cuisine&gt;** recipes and write them to a NEW file,
> `data/cuisines/&lt;cuisine&gt;-more.json`. Do not modify the existing cuisine files.
>
> - Read `docs/RECIPE_SCHEMA.md` first and follow it exactly.
> - Read the existing cuisine file and **do not repeat any dish already in it** — check ids
>   and titles, and avoid dishes that are essentially the same thing under another name.
> - Verify every method against a real, authoritative source (use web search; prefer that
>   country's own home cooks) and record it in the `source` field. No ratios from memory.
> - We cook for 2 adults plus three kids (girls aged 8 and 8, boy aged 6). Set `spicy` and
>   `kidFriendly` honestly and write a `kidNote` wherever the dish is spicy, sour or bitter.
> - Keep it cookable in Metro Manila; put local substitutions in the ingredient `note`.
> - Then run `npm run db && npm run images` and fix anything the validator complains about.

Swap `<cuisine>` for Filipino, Japanese, Korean, Chinese, Mexican or Indian. To add a cuisine
that isn't in the app yet, add it to `CUISINES` in `src/lib/util.js`, `CUISINE_META` in the
same file (pick a dot colour), and to the `CUISINES` list in `tools/build-db.mjs`.

## Translating the new batch

New recipes show up in Filipino mode with their English text until they're translated. To
fill the gap:

> Translate the new recipes in `data/cuisines/<file>.json` into Taglish and add them to
> `data/translations/<file>.fil.json` (same base name, keyed by recipe id). Read `docs/FILIPINO-STYLE.md` first and follow the
> voice exactly — casual Metro Manila Taglish, never textbook Tagalog. Keep the ingredient and
> step arrays exactly the same length as the English ones, don't translate dish titles, and
> leave every number and time as written. Then run `npm run db && npm test`.

`npm test` checks that every recipe has a translation, that the arrays line up, that no
"translated" step is just the English copied over, and that no textbook-Tagalog words crept in.

## Adding one recipe by hand

Open the cuisine file, copy an existing entry, change the fields. The rules that actually
bite:

- `id` must be unique and start with the cuisine prefix (`fil-`, `jpn-`, `kor-`, `chn-`,
  `mex-`, `ind-`).
- `qty` is a **number or `null`** — never `"2-3"` or `"a handful"`. Put ranges and
  "to taste" in `note`, with `qty: null`.
- `servings` is the portion count the quantities are written for. The app scales from there,
  so getting it right matters more than the quantities themselves.
- No `image`, no ratings, no reviews.

## Real photos

Drop a photo at `public/images/recipes/<recipe-id>.jpg` and run `npm run db`. The build notes
which recipes have a photo, so the app loads it directly; without that step the app keeps
showing the drawn plate. Roughly 800×560 or any 4:3-ish crop
looks right. Anything you own, shot yourself, or that is properly licensed for the purpose is
fine; don't paste in photos scraped from other people's recipe sites.

To redraw all the placeholder illustrations after changing the art in
`tools/make-images.mjs`:

```bash
npm run images -- --force
```

# Maru Recipe Book

A weekly menu planner for the family, built on 252 researched home recipes from six cuisines —
Filipino, Japanese, Korean, Chinese, Mexican and Indian. Press one button and it builds a
balanced ten-dish week, then turns that week into a market list.

No ratings, no reviews, no accounts. React + Vite + Tailwind, a JSON database, deployable free
on Vercel.

![stack](https://img.shields.io/badge/React-18-2b8f59) ![stack](https://img.shields.io/badge/Vite-5-2b8f59) ![stack](https://img.shields.io/badge/Tailwind-4-2b8f59)

## What it does

- **Generate a week.** One button picks 10 dishes that are never duplicated, spread across
  cuisines and proteins, with at least two vegetable-forward dishes and three fast ones. It
  remembers the last 40 dishes you cooked and skips them until the fresh pool runs out. You
  can reroll individual picks before committing them.
- **Search everything.** Titles, native names, cuisines, categories, ingredients *and* the
  step text. The dropdown says why each result matched ("ingredient", "in the steps"). `Ctrl+K`
  focuses it.
- **Filter and sort.** Six cuisines, thirteen food types (beef, chicken, fish, seafood, pork,
  vegetables, tofu, egg, noodles, rice, soup, dessert, breakfast), plus kid-approved,
  meat-free, 35-minutes-or-less and not-spicy toggles.
- **Scale portions.** Switch between **2 adults** and **family of 5** (2 adults + two 8-year-old
  girls + one 6-year-old boy ≈ 4 adult portions) and every quantity in the app rescales, with
  cook-friendly rounding — `½ cup`, `350 g`, `1½ tbsp`. Any recipe can also be scaled on its own
  page for guests.
- **Plan the days.** Drop each dish onto a day of the week, swap one out for a fresh
  suggestion, or leave it in the pool.
- **Market list.** Every ingredient on the week merged into one list, scaled to your portions,
  grouped the way you walk a market (Produce → Meat & Seafood → Dairy → Rice & Noodles →
  Sauces & Pantry → Spices), with tick-boxes, a copy button and a print layout.
- **Every recipe carries** prep/cook/total time, difficulty, spice level, step-by-step
  instructions, kitchen notes, a **for the kids** note where the dish is spicy or sour, a
  dietitian's balance note, and a tappable link to the source the method was checked against —
  with that page's own star rating and rating count where it publishes one, so you can see how
  many cooks stood behind it.
- **Cooking mode.** Tap **Cook this now** on any recipe for a full-screen, phone-on-the-counter
  view: one step at a time in large type, the screen kept awake with the Wake Lock API, the
  scaled ingredients a tap away, and a timer for any step that mentions a duration — "simmer
  for 20 minutes" offers a 20:00 countdown that beeps and vibrates when it's done. Tap the step
  to advance, or use the arrow keys on a laptop.
- **English or Filipino**, switched from the top bar like light/dark mode. The Filipino
  version is conversational Taglish — the way a Manila teenager actually talks, not textbook
  Tagalog — and it covers the whole app *and* all 252 recipes: descriptions, ingredients,
  steps, tips and the kid notes. Dish names, measurements and techniques stay in the words
  people really use. Search works across both languages at once, so *manok* finds the chicken
  dishes even in English mode.

## Run it

Needs [Node.js](https://nodejs.org) 18 or newer. Nothing else — no database server, no PHP.

```bash
npm install
npm run dev
```

Then open http://localhost:4000.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Validates the database, then builds to `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run db` | Merges `data/cuisines/*.json` → `public/data/recipes.json` |
| `npm run images` | Draws a plate illustration for any recipe missing one |
| `npm test` | Runs the checks over the planner, market list and translations |
| `npm run links` | Verifies the source links still resolve (`-- --all` for every one) |

## Deploy free on Vercel

The app is a static build, so the free Hobby plan covers it.

**Option A — from a Git repo (recommended: auto-deploys on every push)**

```bash
git init && git add -A && git commit -m "Maru Recipe Book"
```

Push that to GitHub, then at [vercel.com/new](https://vercel.com/new) import the repo. Vercel
reads `vercel.json`, runs `npm run build` and serves `dist/`. Accept the defaults.

**Option B — straight from this folder, no Git**

```bash
npx vercel          # first run links the project and asks a few questions
npx vercel --prod   # ship it
```

**Option C — drag and drop**

Run `npm run build` and drag the `dist/` folder onto
[vercel.com/new](https://vercel.com/new). No CLI, no repo.

The build is also happy on Netlify, Cloudflare Pages or GitHub Pages — `base` is relative, so
it works from a sub-path too.

## Where the data lives

```
data/cuisines/*.json          the database — several files per cuisine, hand-editable
data/translations/*.fil.json  the Filipino text, keyed by recipe id
public/data/recipes.json      generated by `npm run db`; the app fetches this at runtime
src/lib/i18n.js               every UI string, in both languages
public/images/recipes/        <recipe-id>.svg drawn placeholders, <recipe-id>.jpg real photos
docs/RECIPE_SCHEMA.md         the contract every recipe follows
docs/FILIPINO-STYLE.md        the Taglish voice guide the translations follow
docs/ADDING-RECIPES.md        how to add the next batch (including the Claude prompt)
tools/build-db.mjs            merge + validate + reject duplicates
tools/make-images.mjs         the plate illustrator
tools/check.mjs               `npm test` — checks on the planner, lists, data and translations
tools/check-links.mjs         `npm run links` — verifies every source link still resolves
```

The build **refuses duplicate ids and duplicate titles**, which is what keeps "generate 10
more" safe to run forever. It also checks types, enums, quantity formats and step counts, and
warns when a spicy dish has no note for the kids.

### Why the data is fetched, not bundled

The recipe database is the largest asset by far. Bundling it into the JS meant a phone had to
download every recipe before it could paint anything. It now lives in `public/data/` and is
fetched after the shell renders, which took the JS bundle from 958 kB to 231 kB (73 kB
gzipped) and lets the browser cache the data separately from the code.

### The images

Each dish has a generated SVG "plate" — tinted per cuisine, plated per main ingredient,
deterministic from the recipe id. They are placeholders that look deliberate.

To use a real photo, drop `public/images/recipes/<recipe-id>.jpg` and run `npm run db` — the
build records which recipes have a photo so the app loads it directly instead of probing for
one that isn’t there.

## Moving it to another PC

Two separate things travel separately:

- **The recipes and the code** live in this folder. Copy it (or clone the repo) and run
  `npm install`.
- **Your week, your cookbook and your preferences** live in the browser, per device. Use
  **Backup / restore** in the top bar to export a JSON file and load it on the other machine.

Once it's deployed, the URL itself is the portable version: open it on any phone or PC, and
that device keeps its own plan in its own browser.

## Notes on the recipes

Every dish was researched against that cuisine's own well-regarded home cooks — Panlasang
Pinoy and Kawaling Pinoy, Just One Cookbook, Maangchi and Korean Bapsang, The Woks of Life and
Made With Lau, Mexico in My Kitchen and Pati Jinich, Dassana Amit and Swasthi's Recipes —
and each recipe links the page its method was checked against. Spice levels and the kid notes
were written for this family specifically: three young kids, so the fix for a hot dish is
always "hold the chilli, serve the heat at the table".

They are still recipes, not laws. Taste as you go.

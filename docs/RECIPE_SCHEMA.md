# Recipe schema (v1)

Every cuisine file lives at `data/cuisines/<cuisine>.json` and is a JSON array of recipe
objects. `npm run db` merges all of them into `src/data/recipes.json`, which the React app
imports at build time. The merge step **rejects duplicate `id`s and duplicate `title`s**, so
new recipes must be unique across the whole database.

## Shape

```json
[
  {
    "id": "fil-adobong-manok",
    "title": "Chicken Adobo",
    "localTitle": "Adobong Manok",
    "cuisine": "Filipino",
    "categories": ["chicken"],
    "tags": ["one-pot", "make-ahead", "budget"],
    "description": "Chicken braised in soy sauce, vinegar, garlic and bay leaf until glossy — the Philippines' default weeknight dinner.",
    "servings": 4,
    "prepMinutes": 15,
    "cookMinutes": 45,
    "difficulty": "Easy",
    "kidFriendly": true,
    "spicy": 0,
    "ingredients": [
      { "qty": 1, "unit": "kg", "item": "bone-in chicken thighs and drumsticks", "group": "Main" },
      { "qty": 0.5, "unit": "cup", "item": "soy sauce" },
      { "qty": null, "unit": "", "item": "freshly cracked black pepper", "note": "to taste" }
    ],
    "steps": [
      "Marinate the chicken in soy sauce, crushed garlic and pepper for 30 minutes.",
      "Sear the chicken skin-side down in a dry pot until the fat renders and the skin browns."
    ],
    "tips": ["Do not stir after adding the vinegar until it has boiled for 2 minutes, or it tastes raw."],
    "kidNote": "Serve the kids' portions before adding extra chilli; thin the sauce with a splash of water for rice-mixing.",
    "nutritionNote": "Protein-heavy; pair with steamed rice and a cucumber-tomato salad for fibre.",
    "source": { "name": "Panlasang Pinoy", "url": "https://panlasangpinoy.com/..." }
  }
]
```

## Field rules

| Field | Required | Rule |
|---|---|---|
| `id` | yes | `<prefix>-<kebab-slug>`; prefixes: `fil`, `jpn`, `kor`, `chn`, `mex`, `ind`. Unique. |
| `title` | yes | English/common name, Title Case. Unique across the whole DB. |
| `localTitle` | no | Native name (`Adobong Manok`, `Tonjiru`, `Dakdoritang`). Empty string if none. |
| `cuisine` | yes | Exactly one of `Filipino`, `Japanese`, `Korean`, `Chinese`, `Mexican`, `Indian`. |
| `categories` | yes | 1–3 from: `beef`, `pork`, `chicken`, `fish`, `seafood`, `vegetable`, `egg`, `tofu`, `noodle`, `rice`, `soup`, `dessert`, `breakfast`. First entry = the main protein/type used for filtering. |
| `tags` | no | Free kebab/lowercase labels: `one-pot`, `30-minutes`, `make-ahead`, `budget`, `grill`, `no-oven`, `packed-lunch`, `party`. |
| `description` | yes | 1–2 sentences, 120–220 chars. What it tastes like and when you'd cook it. No marketing fluff. |
| `servings` | yes | Integer 2–6. The serving count the `qty` values are written for. Use `4` unless the dish only makes sense bigger. |
| `prepMinutes` | yes | Integer, hands-on prep only. |
| `cookMinutes` | yes | Integer, cooking/braising/baking. Include marinating only if unattended time is mandatory, and say so in `tips`. |
| `difficulty` | yes | `Easy`, `Medium` or `Hard`. |
| `kidFriendly` | yes | Boolean. `true` only if a 6-year-old will actually eat it (mild, not bitter, no hard-to-chew offal, not numbing-spicy). |
| `spicy` | yes | `0` none, `1` mild warmth, `2` properly spicy, `3` very spicy. If `spicy >= 2`, `kidNote` is required. |
| `ingredients` | yes | 5–18 entries, in the order they are used. |
| `ingredients[].qty` | yes | Number (decimals allowed, e.g. `0.5`, `1.5`) or `null` for "to taste"/"for frying". **Never** a string, never a range. |
| `ingredients[].unit` | yes | One of `g`, `kg`, `ml`, `l`, `cup`, `tbsp`, `tsp`, `pc`, `clove`, `stalk`, `slice`, `can`, `pack`, `bunch`, `pinch`, or `""` for bare counts. Metric or cups — not ounces. |
| `ingredients[].item` | yes | Lowercase ingredient name with prep state (`thinly sliced onion`, `bone-in chicken thighs`). |
| `ingredients[].note` | no | Substitutions or "to taste". Put PH-supermarket substitutes here (e.g. `or use calamansi instead of lime`). |
| `ingredients[].group` | no | Sub-recipe heading: `Main`, `Marinade`, `Sauce`, `Garnish`, `Dough`. Omit for single-group recipes. |
| `steps` | yes | 4–10 strings. One action per step, imperative mood, include pan temperature/time/visual cue. No step numbers inside the text. |
| `tips` | no | 0–3 strings. Real technique notes, not filler. |
| `kidNote` | conditional | Required when `spicy >= 2` or `kidFriendly` is `false`. How to serve it to the three kids (2 girls aged 8, 1 boy aged 6). |
| `nutritionNote` | yes | One sentence a dietitian would sign off on: what it's heavy in, what to pair for balance. No calorie numbers. |
| `source` | yes | `{ "name": ..., "url": ... }` — the most authoritative source you actually verified the method against. |

## Do not include

`image` (resolved automatically from `id`), ratings, reviews, star scores, comment counts,
author fields, or calorie counts.

## Quality bar

- **Authentic, not fusion.** The version a home cook in that country would recognise.
- **Cookable in Metro Manila.** If an ingredient is hard to find locally, keep it but add a
  substitution in `note`.
- **No duplicate concepts.** One adobo, one sinigang, one ramen — vary the protein and method
  instead (e.g. `Chicken Adobo` and `Pork Sinigang` are fine; two soy-braised chicken dishes are not).
- **Balanced across the file.** Aim for a spread of protein categories and at least 2 recipes
  with `vegetable` as the first category, and at least 3 recipes at 30 minutes or under.

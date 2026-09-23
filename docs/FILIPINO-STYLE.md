# Filipino (Taglish) style guide

The app ships in two languages: **English** and **Filipino**. The Filipino version is the
conversational Taglish a Manila teenager actually speaks and reads — *hindi* the deep,
formal Tagalog of a textbook or a news broadcast.

If a sentence sounds like a DepEd module, it's wrong. If it sounds like a cousin explaining
the recipe over chat, it's right.

## The rule of thumb

> Would a 16-year-old in Metro Manila say this out loud without laughing?

## Keep in English

Don't translate these — nobody says the Tagalog version:

- **Measurements and numbers:** cup, tbsp, tsp, grams, kilo, 20 minutes, medium heat
- **Kitchen equipment when that's what people call it:** pan, kawali is fine, but *strainer*,
  *blender*, *oven*, *baking sheet*, *chopping board*, *tongs* stay English
- **Cooking techniques with no natural Tagalog:** marinate, simmer, sauté (or *igisa*),
  blanch, deglaze, velveting, toast, drain, reduce, room temperature
- **Dish names:** Adobo, Oyakodon, Mapo Tofu, Tinga de Pollo. Never invent a Tagalog name.
- **Ingredient proper nouns:** gochujang, dashi, mirin, garam masala, epazote, doubanjiang
- **Modern words:** menu, recipe (or *recipe* / *resipe*), list, week, search, save, share

## Say in Filipino

The everyday verbs and nouns people genuinely use in a Filipino kitchen:

| English | Use this | Not this |
|---|---|---|
| chicken / pork / beef / fish | manok, baboy, baka, isda | — |
| onion, garlic, ginger | sibuyas, bawang, luya | — |
| cook / boil / fry | lutuin, pakuluan, iprito | — |
| stir | haluin | — |
| until tender | hanggang lumambot | hanggang maging malambot ang tekstura |
| slice thinly | hiwain nang manipis | gawing mga manipis na pirasong hiwa |
| taste it | tikman | lasapin |
| serve with rice | kainin with rice / isabay sa kanin | ihain kasama ng sinaing |
| set aside | itabi muna | ilagay sa gilid at hintayin |

## The Taglish verb pattern

Prefix English verbs when it's natural — this is how people actually talk:

- **i-** + English verb: *i-marinate*, *i-drain*, *i-toss*, *i-chill*, *i-preheat*, *i-mix*
- **mag-** for the doer form: *mag-simmer*, *mag-saute*
- Native verbs stay native: *haluin*, *takpan*, *budburan*, *lagyan*, *ilagay*, *hanguin*

Good: `I-marinate ang manok sa toyo, bawang at paminta for 30 minutes.`
Bad: `Ibabad ang karne ng manok sa timpla ng toyo, bawang at durog na paminta sa loob ng
tatlumpung minuto.`

## Sentence rules

1. **Short sentences.** One action each, same as the English steps.
2. **Keep the numbers and times exactly as they are** — they're the part people scan for.
3. **Contractions and particles are fine:** *na*, *lang*, *muna*, *nang*, *pa*, *tapos*, *kasi*.
   They make it sound human.
4. **No honorific padding.** Skip *po* and *ho* — the app isn't talking to your lola, it's
   labelling a button.
5. **Don't over-translate the technical bits.** `Cook for 3-4 minutes hanggang mag-golden
   brown` is better Filipino than a fully-Tagalog version nobody would say.
6. **Buttons stay short.** `Idagdag sa linggo`, not `Idagdag sa listahan ng lingguhang menu`.

## Worked examples

| English | ✅ Filipino | ❌ Too deep |
|---|---|---|
| Add to week | Idagdag sa linggo | Isama sa lingguhang talaan |
| Market list | Listahan sa palengke | Talaan ng mga bibilhing sangkap |
| Search dishes, ingredients or steps… | Hanapin ang ulam, sangkap o steps… | Maghanap ng putahe, rekado o pamamaraan… |
| Generate 10 recipes | Bumuo ng 10 recipe | Lumikha ng sampung panlutong paraan |
| Kid-approved | Kakainin ng bata | Angkop sa panlasa ng kabataan |
| No heat | Hindi maanghang | Walang taglay na anghang |
| Heat oil in a wok over high heat. | Painitin ang mantika sa wok sa high heat. | Painitin ang langis sa kawali sa mataas na apoy. |
| Simmer for 20 minutes until the pork is tender. | I-simmer for 20 minutes hanggang lumambot ang baboy. | Pakuluan nang dahan-dahan sa loob ng dalawampung minuto hanggang maging malambot ang karne ng baboy. |
| Serve with steamed rice. | Kainin with hot rice. | Ihain kasabay ng sinaing na kanin. |

## Where the translations live

**UI text** lives in `src/lib/i18n.js`, keyed by the English string:

```js
'Add to week': 'Idagdag sa linggo',
```

A missing key falls back to English, so the app never shows a blank label.

**Recipe text** lives in a **separate file per cuisine**, so the researched English data is
never touched: `data/translations/<cuisine>.fil.json`, keyed by recipe id.

```json
{
  "fil-adobong-manok": {
    "description": "Manok na ni-braise sa toyo, suka, bawang at bay leaf...",
    "ingredients": ["bone-in na hita at paa ng manok", "toyo", "..."],
    "steps": ["I-marinate ang manok sa toyo...", "..."],
    "tips": ["..."],
    "kidNote": "...",
    "nutritionNote": "..."
  }
}
```

`npm run db` merges these into each recipe as a `fil` block and enforces:

- `ingredients` must have **exactly the same number of entries, in the same order** as the
  English `ingredients` — only the item name is translated; qty and unit are shared.
- `steps` and `tips` must match their English array lengths.
- Every key must be a recipe id that actually exists.
- `title` is never translated (that's what `localTitle` is for).
- Everything is optional and falls back to English **per field**, so a half-finished
  translation file still works.

// Two languages: English and Filipino (conversational Taglish — see docs/FILIPINO-STYLE.md).
//
// Keys are the English string itself, so components stay readable and a missing
// translation silently falls back to English instead of showing a blank label.
// `{placeholders}` are filled from the vars object.

import { createContext, createElement, useContext, useMemo } from 'react'

export const LANGS = {
  en: { key: 'en', short: 'EN', label: 'English' },
  fil: { key: 'fil', short: 'FIL', label: 'Filipino' },
}

const FIL = {
  /* ---------------------------------------------------------------- navigation */
  Dashboard: 'Dashboard',
  Browse: 'Mga Recipe',
  Week: 'Linggo',
  Market: 'Palengke',
  Saved: 'Naka-save',
  Generate: 'Gumawa',
  'Generate 10 recipes for the week': 'Gumawa ng 10 recipe para sa linggo',
  'Maru Recipe Book': 'Maru Recipe Book',

  /* ------------------------------------------------------------------- top bar */
  'Search dishes, ingredients or steps…': 'Hanapin ang ulam, sangkap o steps…',
  'Search recipes': 'Maghanap ng recipe',
  'Clear search': 'Burahin ang hinahanap',
  Search: 'Hanapin',
  Back: 'Balik',
  'See all results for “{q}”': 'Tingnan lahat ng result para sa “{q}”',
  '2 adults': '2 adults',
  'Family of 5': 'Pamilya (5)',
  '2 adult portions': '2 adult portions',
  '2 adults + two 8-y-o girls + one 6-y-o boy ≈ 4 adult portions':
    '2 adults + dalawang 8-anyos na babae + isang 6-anyos na lalaki ≈ 4 adult portions',
  'Backup or restore this plan': 'I-backup o i-restore ang plano',
  'Backup or restore': 'Backup o restore',
  'Switch to light': 'Lipat sa light mode',
  'Switch to dark': 'Lipat sa dark mode',
  'Toggle theme': 'Palitan ang theme',
  'Switch to Filipino': 'Lipat sa Filipino',
  'Switch to English': 'Lipat sa English',
  // why a search result matched
  recipe: 'recipe',
  cuisine: 'cuisine',
  category: 'category',
  ingredient: 'sangkap',
  'in the steps': 'nasa steps',

  /* ----------------------------------------------------------------- dashboard */
  'What are we cooking this week?': 'Ano ang lulutuin natin ngayong linggo?',
  '{total} authentic home recipes across {n} cuisines. Hit generate and the planner builds a balanced ten-dish week — no repeats, spread across cuisines and proteins, with two vegetable-forward dishes and at least three fast ones. Portions are set for {mode}.':
    '{total} authentic na home recipes mula sa {n} cuisines. Pindutin lang ang generate at gagawa ang planner ng balanced na sampung ulam para sa linggo — walang paulit-ulit, hati sa iba-ibang cuisine at protein, may dalawang gulay ang bida at at least tatlong mabilis lutuin. Naka-set ang portions para sa {mode}.',
  'Generate 10 recipes': 'Gumawa ng 10 recipe',
  'Browse the book': 'Tingnan ang lahat',
  'Market list': 'Listahan sa palengke',
  dish: 'ulam',
  dishes: 'ulam',
  'dish on the menu': 'ulam sa menu',
  'dishes on the menu': 'ulam sa menu',
  'total cooking time': 'total na oras ng luto',
  'cuisines this week': 'cuisines ngayong linggo',
  'kid-approved': 'kakainin ng bata',
  "This week's menu": 'Menu ngayong linggo',
  '{quick} quick · {veg} meat-free · avg {avg} per dish':
    '{quick} mabilis · {veg} walang karne · avg {avg} kada ulam',
  'Nothing picked yet': 'Wala pang napipili',
  'Plan the days': 'Ayusin ang araw',
  'The week is empty': 'Walang laman ang linggo',
  'Generate a balanced ten-dish week, or browse and add dishes one by one. Everything stays on this computer and can be exported to a file.':
    'Gumawa ng balanced na sampung ulam para sa linggo, o mag-browse at magdagdag isa-isa. Nasa computer mo lang lahat at pwedeng i-export sa file.',
  'Search by cuisine': 'Hanapin per cuisine',
  "Each collection is researched from that country's own home cooks":
    'Galing mismo sa mga home cook ng bawat bansa ang bawat koleksyon',
  '{n} recipes': '{n} recipe',
  'Weeknight rescue': 'Pang-rescue sa weeknight',
  'Ready in {n} minutes or less, not on the menu yet':
    'Luto sa {n} minuto pababa, wala pa sa menu',
  'Remove from the week': 'Alisin sa linggo',
  'Add to the week': 'Idagdag sa linggo',
  'Remove {title} from the week': 'Alisin si {title} sa linggo',
  'Add {title} to the week': 'Idagdag si {title} sa linggo',

  /* -------------------------------------------------------------------- browse */
  'Browse recipes': 'Lahat ng recipe',
  '{n} of {total} recipes': '{n} sa {total} recipe',
  '{n} of {total} recipes matching “{q}”': '{n} sa {total} recipe na tugma sa “{q}”',
  Sort: 'Sort',
  'Best match': 'Pinaka-bagay',
  'A → Z': 'A → Z',
  'Fastest first': 'Pinakamabilis muna',
  'By cuisine': 'Per cuisine',
  'Mildest first': 'Hindi maanghang muna',
  'Clear ({n})': 'I-clear ({n})',
  'Kid-approved': 'Kakainin ng bata',
  'Meat-free': 'Walang karne',
  '35 min or less': '35 min pababa',
  'Not spicy': 'Hindi maanghang',
  'Nothing matches that yet': 'Wala pang tugma diyan',
  'Try a single word like': 'Subukan ang isang salita tulad ng',
  'or drop one of the filters above.': 'o tanggalin ang isa sa mga filter sa taas.',
  'Reset the filters': 'I-reset ang filters',
  'Saved cookbook': 'Naka-save na cookbook',
  '{n} of {total} saved recipes': '{n} sa {total} na naka-save',
  'Tap the bookmark on any recipe to keep it here':
    'Pindutin ang bookmark sa kahit anong recipe para ma-save dito',

  /* --------------------------------------------------------------- recipe card */
  'On the menu': 'Nasa menu na',
  'Add to week': 'Idagdag sa linggo',
  'Add to this week': 'Idagdag ngayong linggo',
  'Remove from this week': 'Alisin ngayong linggo',
  'Save to cookbook': 'I-save sa cookbook',
  'Saved in cookbook': 'Naka-save na',
  'Remove from cookbook': 'Alisin sa cookbook',
  'Open {title}': 'Buksan si {title}',
  'kid-ok': 'ok sa bata',

  /* ------------------------------------------------------------- recipe detail */
  'Back to browsing': 'Balik sa listahan',
  'Print this recipe': 'I-print ang recipe',
  Print: 'I-print',
  Prep: 'Prep',
  Cook: 'Luto',
  Total: 'Total',
  Steps: 'Steps',
  'Kitchen notes': 'Tips sa kusina',
  Ingredients: 'Sangkap',
  '{n} portions': '{n} portions',
  'Fewer portions': 'Bawasan ang portions',
  'More portions': 'Dagdagan ang portions',
  'Scaled ×{factor} from the original {n}-portion recipe.':
    'Ni-scale ×{factor} mula sa orihinal na {n}-portion na recipe.',
  'To taste': 'Depende sa panlasa',
  'For the kids': 'Para sa mga bata',
  'Balance it': 'Para balanse',
  'Method checked against {source}': 'Sinangguni sa {source}',
  Easy: 'Madali',
  Medium: 'Medium',
  Hard: 'Mahirap',

  /* ----------------------------------------------------------------- week plan */
  'No dishes on the week yet': 'Wala pang ulam ngayong linggo',
  'Generate a balanced week or add dishes from the book, then drop each one onto a day.':
    'Gumawa ng balanced na linggo o magdagdag mula sa listahan, tapos ilagay bawat isa sa araw.',
  'Browse instead': 'Mag-browse na lang',
  '{n} dishes · {time} total cooking · {c} cuisines · cooking for {mode} ({p} portions)':
    '{n} ulam · {time} total na luto · {c} cuisines · para sa {mode} ({p} portions)',
  'Generate more': 'Dagdagan pa',
  'Clear week': 'Linisin ang linggo',
  'Day by day': 'Araw-araw',
  'Pick a day for each dish — anything left over sits in the pool below':
    'Pumili ng araw para sa bawat ulam — ang matitira ay nasa listahan sa baba',
  'Nothing planned': 'Wala pang plano',
  'Choose a dish…': 'Pumili ng ulam…',
  'Any day': 'Kahit anong araw',
  'Day for {title}': 'Araw para kay {title}',
  'Choose a dish for {day}': 'Pumili ng ulam para sa {day}',
  'Swap for a different dish': 'Palitan ng ibang ulam',
  'Swap {title}': 'Palitan si {title}',
  'Remove {title}': 'Alisin si {title}',
  'Still to schedule': 'Wala pang araw',
  '{n} dish on the menu without a day': '{n} ulam sa menu na walang araw',
  '{n} dishes on the menu without a day': '{n} ulam sa menu na walang araw',
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miyerkules',
  Thursday: 'Huwebes',
  Friday: 'Biyernes',
  Saturday: 'Sabado',
  Sunday: 'Linggo',

  /* --------------------------------------------------------------- market list */
  'Nothing to buy yet': 'Wala pang bibilhin',
  'The market list builds itself from whatever is on the week’s menu, merged by ingredient and scaled to your serving size.':
    'Kusang gagawin ang listahan base sa kung ano ang nasa menu ngayong linggo, pinagsama-sama per sangkap at naka-scale sa dami ng kakain.',
  '{n} items for {m} dishes · scaled for {mode} ({p} portions)':
    '{n} bibilhin para sa {m} ulam · naka-scale para sa {mode} ({p} portions)',
  Copy: 'I-copy',
  'Uncheck all': 'Alisin lahat ng check',
  '{done} of {n} in the basket': '{done} sa {n} nasa basket na',
  '{n} item': '{n} bibilhin',
  '{n} items': '{n} bibilhin',
  'for {recipes}': 'para sa {recipes}',
  '+{n} more': '+{n} pa',
  'to taste': 'depende sa panlasa',
  Produce: 'Gulay at Prutas',
  'Meat & Seafood': 'Karne at Isda',
  'Dairy & Chilled': 'Dairy at Chilled',
  'Rice, Noodles & Bread': 'Kanin, Noodles at Tinapay',
  'Sauces & Pantry': 'Sauces at Pantry',
  'Spices & Seasoning': 'Pampalasa',
  Other: 'Iba pa',
  'Market list copied — paste it into Messenger or Notes.':
    'Na-copy ang listahan — i-paste mo na sa Messenger o Notes.',
  'Could not reach the clipboard. Use Print instead.':
    'Hindi ma-access ang clipboard. I-print mo na lang.',

  /* ----------------------------------------------------------- generate dialog */
  'Generate {n} recipes': 'Gumawa ng {n} recipe',
  "Balanced across cuisines and proteins, and never a dish that's already on the week.":
    'Balanse sa cuisines at protein, at hinding-hindi mauulit ang nasa menu na.',
  'Reroll all': 'Bagong set',
  'Add {n} to the week': 'Idagdag ang {n} sa linggo',
  'How many dishes': 'Ilang ulam',
  'All cuisines': 'Lahat ng cuisine',
  'Kid-approved only': 'Kakainin lang ng bata',
  'Meat-free only': 'Walang karne lang',
  'Skip recently cooked': 'Iwasan ang kaluluto lang',
  'Apply and reroll': 'I-apply at bagong set',
  'Only {n} dishes fit those filters right now ({pool} available in total). Loosen a filter, or ask Claude to research more recipes for the database.':
    '{n} ulam lang ang pasok sa filters na iyan ({pool} lahat-lahat). Bawasan ang filter, o pahanap kay Claude ng mas marami pang recipe.',
  'The fresh pool ran out, so some dishes you’ve cooked before are back in the mix.':
    'Naubos na ang bago, kaya may ilang naluto mo na na bumalik sa listahan.',
  'Swap this one': 'Palitan ito',
  'Drop this one': 'Tanggalin ito',

  /* --------------------------------------------------------- toasts and modals */
  '{title} added to the week.': 'Nadagdag si {title} sa linggo.',
  '{title} taken off the week.': 'Naalis si {title} sa linggo.',
  '{title} saved to the cookbook.': 'Na-save si {title} sa cookbook.',
  '{title} removed from the cookbook.': 'Naalis si {title} sa cookbook.',
  '{n} dishes added to the week.': 'Nadagdag ang {n} ulam sa linggo.',
  'Those dishes are already on the week.': 'Nasa menu na ang mga ulam na iyan.',
  'Swapped {from} for {to}.': 'Pinalitan si {from} ng {to}.',
  'Every recipe in the book is already on the week.':
    'Nasa linggo na lahat ng recipe sa libro.',
  'Week cleared.': 'Nalinis na ang linggo.',
  'Backup file downloaded.': 'Na-download ang backup file.',
  'Clear the whole week?': 'Linisin ang buong linggo?',
  'The menu and the day assignments go away. Your cookbook and the recipe database are untouched.':
    'Mawawala ang menu at ang mga araw. Hindi maaapektuhan ang cookbook at ang recipe database.',
  'Clear the week': 'Linisin ang linggo',
  Cancel: 'Cancel',
  'Backup & restore': 'Backup at restore',
  'The week, the cookbook and your preferences live in this browser. Export a file to carry them to another PC.':
    'Nasa browser na ito ang linggo, ang cookbook at ang settings mo. Mag-export ng file para madala sa ibang PC.',
  'Export my plan to a file': 'I-export ang plano sa file',
  'Restore from a backup file': 'I-restore mula sa backup file',
  'The {n} recipes themselves live in the project folder ({path}), so they travel with the code. This backup only covers what you’ve planned and saved.':
    'Nasa project folder ({path}) ang {n} recipe, kaya kasama sila sa code. Ang backup na ito ay para lang sa napili at na-save mo.',
  'That file is not valid JSON.': 'Hindi valid na JSON ang file na iyan.',
  'That file was not exported from Maru Recipe Book.':
    'Hindi galing sa Maru Recipe Book ang file na iyan.',
  'Restored {n} section(s) from {file}.': 'Na-restore ang {n} section mula sa {file}.',
  'Reloading…': 'Nirerefresh…',
  '{n} recipes · {c} cuisines · database built {date}':
    '{n} recipe · {c} cuisines · ginawa ang database noong {date}',

  /* --------------------------------------------------------------- shared bits */
  or: 'o',
  match: 'tugma',
  // Ingredient group headings on a recipe page. Technique words that everyone
  // says in English stay in English; the ones with a real Filipino word don't.
  Main: 'Main',
  Marinade: 'Marinade',
  Sauce: 'Sauce',
  Garnish: 'Pang-garnish',
  Dough: 'Dough',
  Seasoning: 'Pampalasa',
  Broth: 'Sabaw',
  Filling: 'Palaman',
  Stuffing: 'Palaman',
  Dip: 'Sawsawan',
  'Dipping Sauce': 'Sawsawan',
  Meatballs: 'Bola-bola',
  Frying: 'Pangprito',
  Topping: 'Topping',
  Toppings: 'Toppings',
  Batter: 'Batter',
  Basting: 'Basting',
  Glaze: 'Glaze',
  Dressing: 'Dressing',
  Caramel: 'Caramel',
  Custard: 'Custard',
  Tempering: 'Tempering',
  Masala: 'Masala',
  Tadka: 'Tadka',
  Sabzi: 'Sabzi',
  'No heat': 'Hindi maanghang',
  Mild: 'Konting anghang',
  Spicy: 'Maanghang',
  'Very spicy': 'Sobrang anghang',
  Close: 'Isara',
  Confirm: 'Sige',
  Beef: 'Baka',
  Pork: 'Baboy',
  Chicken: 'Manok',
  Fish: 'Isda',
  Seafood: 'Seafood',
  Vegetables: 'Gulay',
  Tofu: 'Tokwa',
  Egg: 'Itlog',
  Noodles: 'Noodles',
  Rice: 'Kanin',
  Soup: 'Sabaw',
  Dessert: 'Panghimagas',
  Breakfast: 'Almusal',
  '{n} serves': '{n} serves',
  Difficulty: 'Level',
}

const DICTIONARIES = { en: {}, fil: FIL }

/** Build a translator for a language. Unknown keys fall through as English. */
export function makeT(lang) {
  const dict = DICTIONARIES[lang] ?? DICTIONARIES.en
  return function t(key, vars) {
    let out = dict[key] ?? key
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        out = out.split(`{${name}}`).join(String(value))
      }
    }
    return out
  }
}

const LangContext = createContext({ lang: 'en', t: makeT('en') })

export function LangProvider({ lang, children }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang])
  return createElement(LangContext.Provider, { value }, children)
}

export const useLang = () => useContext(LangContext)

/**
 * Recipe text in the chosen language, falling back per field so a partial
 * translation still renders. Ingredient names come back as a parallel array
 * matching `recipe.ingredients` — quantities and units are shared.
 */
export function recipeText(recipe, lang) {
  const fil = lang === 'fil' ? recipe.fil : null
  const names = recipe.ingredients.map((ing, i) => fil?.ingredients?.[i] || ing.item)
  return {
    description: fil?.description || recipe.description,
    steps: fil?.steps?.length === recipe.steps.length ? fil.steps : recipe.steps,
    tips: fil?.tips?.length === (recipe.tips?.length ?? 0) ? fil.tips : recipe.tips,
    kidNote: fil?.kidNote || recipe.kidNote,
    nutritionNote: fil?.nutritionNote || recipe.nutritionNote,
    ingredientNames: names,
    translated: Boolean(fil),
  }
}

/** Ingredient name in the chosen language, used by search and the market list. */
export const ingredientName = (recipe, index, lang) =>
  (lang === 'fil' && recipe.fil?.ingredients?.[index]) || recipe.ingredients[index].item

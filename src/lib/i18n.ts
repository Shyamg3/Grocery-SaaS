export type Lang = 'ta' | 'en'

export type StringKey =
  | 'nav.billing'
  | 'nav.products'
  | 'nav.stock'
  | 'nav.reports'
  | 'common.comingSoon'

const strings: Record<StringKey, Record<Lang, string>> = {
  'nav.billing': { ta: 'பில்', en: 'Billing' },
  'nav.products': { ta: 'பொருட்கள்', en: 'Products' },
  'nav.stock': { ta: 'சரக்கு', en: 'Stock' },
  'nav.reports': { ta: 'அறிக்கை', en: 'Reports' },
  'common.comingSoon': { ta: 'விரைவில் வரும்…', en: 'Coming soon…' },
}

let lang: Lang = 'ta'

export function setLang(l: Lang): void {
  lang = l
}

export function t(key: StringKey): string {
  return strings[key][lang]
}

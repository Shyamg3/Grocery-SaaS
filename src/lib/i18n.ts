export type Lang = 'ta' | 'en'

export const LANG_NAMES: Record<Lang, string> = {
  ta: 'தமிழ்',
  en: 'English',
}

export type StringKey =
  | 'nav.billing'
  | 'nav.products'
  | 'nav.stock'
  | 'nav.reports'
  | 'common.comingSoon'
  | 'common.loading'
  | 'common.retry'
  | 'common.signOut'
  | 'common.cancel'
  | 'auth.signInTitle'
  | 'auth.signUpTitle'
  | 'auth.email'
  | 'auth.password'
  | 'auth.signInBtn'
  | 'auth.signUpBtn'
  | 'auth.needAccount'
  | 'auth.haveAccount'
  | 'auth.checkEmail'
  | 'auth.backToSignIn'
  | 'shop.createTitle'
  | 'shop.name'
  | 'shop.namePlaceholder'
  | 'shop.type'
  | 'shop.type.grocery'
  | 'shop.type.general'
  | 'shop.type.stationery'
  | 'shop.type.fancy'
  | 'shop.createBtn'
  | 'error.fillRequired'
  | 'error.invalidCredentials'
  | 'error.invalidEmail'
  | 'error.emailInUse'
  | 'error.emailNotConfirmed'
  | 'error.weakPassword'
  | 'error.network'
  | 'error.generic'
  | 'products.title'
  | 'products.searchPlaceholder'
  | 'products.empty'
  | 'products.noResults'
  | 'products.loadError'
  | 'products.add'
  | 'products.import'
  | 'products.quickAdd'
  | 'products.fullForm'
  | 'products.addTitle'
  | 'products.editTitle'
  | 'products.name'
  | 'products.nameTa'
  | 'products.aliases'
  | 'products.aliasesPlaceholder'
  | 'products.unit'
  | 'products.sellPrice'
  | 'products.costPrice'
  | 'products.stockQty'
  | 'products.reorderLevel'
  | 'products.save'
  | 'products.delete'
  | 'products.deleteConfirm'
  | 'products.err.price'
  | 'products.err.qty'
  | 'unit.kg'
  | 'unit.g'
  | 'unit.l'
  | 'unit.ml'
  | 'unit.pcs'
  | 'unit.pack'
  | 'import.title'
  | 'import.choose'
  | 'import.format'
  | 'import.badHeader'
  | 'import.validCount'
  | 'import.errorCount'
  | 'import.importBtn'
  | 'import.noValid'
  | 'import.done'
  | 'import.err.name'
  | 'import.err.unit'
  | 'import.err.price'
  | 'import.err.stock'
  | 'import.err.duplicate'

const strings: Record<StringKey, Record<Lang, string>> = {
  'nav.billing': { ta: 'பில்', en: 'Billing' },
  'nav.products': { ta: 'பொருட்கள்', en: 'Products' },
  'nav.stock': { ta: 'சரக்கு', en: 'Stock' },
  'nav.reports': { ta: 'அறிக்கை', en: 'Reports' },
  'common.comingSoon': { ta: 'விரைவில் வரும்…', en: 'Coming soon…' },
  'common.loading': { ta: 'ஏற்றுகிறது…', en: 'Loading…' },
  'common.retry': { ta: 'மீண்டும் முயற்சி', en: 'Try again' },
  'common.signOut': { ta: 'வெளியேறு', en: 'Sign out' },
  'common.cancel': { ta: 'ரத்து', en: 'Cancel' },
  'auth.signInTitle': { ta: 'உள்நுழையவும்', en: 'Sign in' },
  'auth.signUpTitle': { ta: 'புதிய கணக்கு', en: 'New account' },
  'auth.email': { ta: 'மின்னஞ்சல்', en: 'Email' },
  'auth.password': { ta: 'கடவுச்சொல்', en: 'Password' },
  'auth.signInBtn': { ta: 'உள்நுழை', en: 'Sign in' },
  'auth.signUpBtn': { ta: 'கணக்கை உருவாக்கு', en: 'Create account' },
  'auth.needAccount': { ta: 'கணக்கு இல்லையா? புதிய கணக்கு உருவாக்க தட்டவும்', en: 'No account? Tap to create one' },
  'auth.haveAccount': { ta: 'ஏற்கனவே கணக்கு உண்டா? உள்நுழைய தட்டவும்', en: 'Already have an account? Tap to sign in' },
  'auth.checkEmail': { ta: 'மின்னஞ்சலைச் சரிபார்க்கவும் — உறுதிப்படுத்தும் இணைப்பு அனுப்பப்பட்டுள்ளது', en: 'Check your email — we sent you a confirmation link' },
  'auth.backToSignIn': { ta: 'உள்நுழையத் திரும்பு', en: 'Back to sign in' },
  'shop.createTitle': { ta: 'உங்கள் கடையை உருவாக்குங்கள்', en: 'Create your shop' },
  'shop.name': { ta: 'கடையின் பெயர்', en: 'Shop name' },
  'shop.namePlaceholder': { ta: 'எ.கா. ஸ்ரீ ஸ்டோர்ஸ்', en: 'e.g. Sri Stores' },
  'shop.type': { ta: 'கடை வகை', en: 'Shop type' },
  'shop.type.grocery': { ta: 'மளிகை கடை', en: 'Grocery' },
  'shop.type.general': { ta: 'பொது கடை', en: 'General store' },
  'shop.type.stationery': { ta: 'எழுதுபொருள் கடை', en: 'Stationery' },
  'shop.type.fancy': { ta: 'ஃபேன்சி கடை', en: 'Fancy store' },
  'shop.createBtn': { ta: 'கடையை உருவாக்கு', en: 'Create shop' },
  'error.fillRequired': { ta: 'தேவையான தகவலை நிரப்பவும்', en: 'Please fill in the required info' },
  'error.invalidCredentials': { ta: 'மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு', en: 'Wrong email or password' },
  'error.invalidEmail': { ta: 'மின்னஞ்சல் முகவரி சரியில்லை', en: 'That email address looks wrong' },
  'error.emailInUse': { ta: 'இந்த மின்னஞ்சல் ஏற்கனவே பயன்பாட்டில் உள்ளது', en: 'This email is already in use' },
  'error.emailNotConfirmed': { ta: 'முதலில் மின்னஞ்சலை உறுதிப்படுத்தவும்', en: 'Please confirm your email first' },
  'error.weakPassword': { ta: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்', en: 'Password must be at least 6 characters' },
  'error.network': { ta: 'இணைய இணைப்பைச் சரிபார்க்கவும்', en: 'Check your internet connection' },
  'error.generic': { ta: 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்', en: 'Something went wrong. Please try again' },
  'products.title': { ta: 'பொருட்கள்', en: 'Products' },
  'products.searchPlaceholder': { ta: 'பொருளைத் தேடு…', en: 'Search items…' },
  'products.empty': { ta: 'பொருட்கள் இல்லை. முதல் பொருளைச் சேர்க்கவும்', en: 'No items yet. Add your first item' },
  'products.noResults': { ta: 'பொருட்கள் கிடைக்கவில்லை', en: 'No matching items' },
  'products.loadError': { ta: 'பொருட்களை ஏற்ற முடியவில்லை', en: 'Could not load items' },
  'products.add': { ta: 'பொருள் சேர்', en: 'Add item' },
  'products.import': { ta: 'CSV இறக்குமதி', en: 'Import CSV' },
  'products.quickAdd': { ta: 'விரைவு சேர்ப்பு', en: 'Quick add' },
  'products.fullForm': { ta: 'முழு படிவம்', en: 'Full form' },
  'products.addTitle': { ta: 'புதிய பொருள்', en: 'New item' },
  'products.editTitle': { ta: 'பொருளைத் திருத்து', en: 'Edit item' },
  'products.name': { ta: 'பெயர்', en: 'Name' },
  'products.nameTa': { ta: 'தமிழ் பெயர்', en: 'Tamil name' },
  'products.aliases': { ta: 'மாற்று பெயர்கள்', en: 'Aliases' },
  'products.aliasesPlaceholder': { ta: 'எ.கா. arisi, rice', en: 'e.g. arisi, rice' },
  'products.unit': { ta: 'அலகு', en: 'Unit' },
  'products.sellPrice': { ta: 'விற்பனை விலை (₹)', en: 'Selling price (₹)' },
  'products.costPrice': { ta: 'வாங்கிய விலை (₹)', en: 'Cost price (₹)' },
  'products.stockQty': { ta: 'சரக்கு அளவு', en: 'Stock qty' },
  'products.reorderLevel': { ta: 'மீண்டும் ஆர்டர் அளவு', en: 'Reorder level' },
  'products.save': { ta: 'சேமி', en: 'Save' },
  'products.delete': { ta: 'நீக்கு', en: 'Delete' },
  'products.deleteConfirm': { ta: 'இந்த பொருளை நீக்கவா?', en: 'Delete this item?' },
  'products.err.price': { ta: 'விலையை சரியாக உள்ளிடவும் (எ.கா. 55.99)', en: 'Enter a valid price (e.g. 55.99)' },
  'products.err.qty': { ta: 'அளவை சரியாக உள்ளிடவும்', en: 'Enter a valid quantity' },
  'unit.kg': { ta: 'கிலோ', en: 'kg' },
  'unit.g': { ta: 'கிராம்', en: 'g' },
  'unit.l': { ta: 'லிட்டர்', en: 'l' },
  'unit.ml': { ta: 'மில்லி', en: 'ml' },
  'unit.pcs': { ta: 'எண்', en: 'pcs' },
  'unit.pack': { ta: 'பேக்', en: 'pack' },
  'import.title': { ta: 'CSV இறக்குமதி', en: 'Import CSV' },
  'import.choose': { ta: 'CSV கோப்பைத் தேர்ந்தெடுக்க தட்டவும்', en: 'Tap to choose a CSV file' },
  'import.format': { ta: 'நெடுவரிசங்கள்: name, name_ta, unit, sell_price, stock', en: 'Columns: name, name_ta, unit, sell_price, stock' },
  'import.badHeader': { ta: 'CSV தலைப்பு சரியில்லை. name மற்றும் sell_price தேவை', en: 'Wrong CSV header. name and sell_price are required' },
  'import.validCount': { ta: '{n} வரிகள் சரி', en: '{n} valid rows' },
  'import.errorCount': { ta: '{n} வரிகளில் பிழை', en: '{n} rows with errors' },
  'import.importBtn': { ta: '{n} வரிகளை இறக்கு', en: 'Import {n} rows' },
  'import.noValid': { ta: 'இறக்குமதி செய்ய சரியான வரிகள் இல்லை', en: 'No valid rows to import' },
  'import.done': { ta: '{n} பொருட்கள் சேர்க்கப்பட்டன', en: '{n} items added' },
  'import.err.name': { ta: 'பெயர் இல்லை', en: 'Missing name' },
  'import.err.unit': { ta: 'தவறான அலகு', en: 'Bad unit' },
  'import.err.price': { ta: 'தவறான விலை', en: 'Bad price' },
  'import.err.stock': { ta: 'தவறான சரக்கு', en: 'Bad stock' },
  'import.err.duplicate': { ta: 'ஏற்கனவே உள்ளது', en: 'Already exists' },
}

const LANG_STORAGE_KEY = 'app.lang'

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'en' ? 'en' : 'ta'
  } catch {
    return 'ta'
  }
}

let lang: Lang = readStoredLang()

export function getLang(): Lang {
  return lang
}

export function setLang(l: Lang): void {
  lang = l
  try {
    localStorage.setItem(LANG_STORAGE_KEY, l)
  } catch {
    // private browsing may block storage; language still applies for this session
  }
}

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  let s = strings[key][lang]
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      s = s.replaceAll(`{${name}}`, String(value))
    }
  }
  return s
}

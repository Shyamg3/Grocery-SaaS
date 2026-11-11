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

const strings: Record<StringKey, Record<Lang, string>> = {
  'nav.billing': { ta: 'பில்', en: 'Billing' },
  'nav.products': { ta: 'பொருட்கள்', en: 'Products' },
  'nav.stock': { ta: 'சரக்கு', en: 'Stock' },
  'nav.reports': { ta: 'அறிக்கை', en: 'Reports' },
  'common.comingSoon': { ta: 'விரைவில் வரும்…', en: 'Coming soon…' },
  'common.loading': { ta: 'ஏற்றுகிறது…', en: 'Loading…' },
  'common.retry': { ta: 'மீண்டும் முயற்சி', en: 'Try again' },
  'common.signOut': { ta: 'வெளியேறு', en: 'Sign out' },
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

export function t(key: StringKey): string {
  return strings[key][lang]
}

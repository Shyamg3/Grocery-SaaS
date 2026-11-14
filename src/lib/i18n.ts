export type Lang = 'ta' | 'en'

// 'both' = Tamil primary with English underneath
export type LangMode = Lang | 'both'

export const LANG_NAMES: Record<Lang, string> = {
  ta: 'தமிழ்',
  en: 'English',
}

export type StringKey =
  | 'nav.billing'
  | 'nav.products'
  | 'nav.stock'
  | 'stock.tabAdd'
  | 'stock.tabCorrect'
  | 'stock.title'
  | 'stock.tabAll'
  | 'stock.tabLow'
  | 'stock.daysLeft'
  | 'stock.noSales'
  | 'stock.avgPerDay'
  | 'stock.buy'
  | 'stock.makeList'
  | 'stock.listTitle'
  | 'stock.shareWhatsapp'
  | 'stock.copy'
  | 'stock.copied'
  | 'stock.scan'
  | 'stock.scanTitle'
  | 'stock.scanHint'
  | 'stock.scanDenied'
  | 'stock.scanUnsupported'
  | 'stock.scanFailed'
  | 'stock.addBySearch'
  | 'stock.addByVoice'
  | 'stock.voiceTitle'
  | 'stock.voiceHint'
  | 'stock.voiceHeard'
  | 'stock.voiceNoMatch'
  | 'stock.voiceUnsupported'
  | 'stock.voiceDenied'
  | 'stock.voiceFailed'
  | 'stock.unknownBarcode'
  | 'stock.addThisProduct'
  | 'stock.productsEntry'
  | 'stock.noProductsTitle'
  | 'stock.noProductsBody'
  | 'stock.addProduct'
  | 'stock.search'
  | 'stock.lowTitle'
  | 'stock.lowNone'
  | 'stock.lowTag'
  | 'stock.linesTitle'
  | 'stock.note'
  | 'stock.reason'
  | 'stock.notePlaceholder'
  | 'stock.costOptional'
  | 'stock.editQty'
  | 'stock.removeLine'
  | 'stock.save'
  | 'stock.saved'
  | 'stock.saveError'
  | 'stock.needsUpdate'
  | 'stock.offline'
  | 'stock.current'
  | 'stock.newQty'
  | 'stock.tapToSet'
  | 'stock.correctTitle'
  | 'stock.correctHint'
  | 'stock.noteRequired'
  | 'stock.correctDone'
  | 'stock.saveCorrect'
  | 'reports.title'
  | 'reports.today'
  | 'reports.thisWeek'
  | 'reports.thisMonth'
  | 'reports.listen'
  | 'reports.listenAction'
  | 'reports.totalSales'
  | 'reports.billsCount'
  | 'reports.stockCostSold'
  | 'reports.grossProfit'
  | 'reports.whenDidYouSell'
  | 'reports.paymentsReceived'
  | 'reports.vsYesterday'
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
  | 'products.coverDays'
  | 'products.barcode'
  | 'products.save'
  | 'products.delete'
  | 'products.deleteConfirm'
  | 'products.err.price'
  | 'products.err.qty'
  | 'products.err.cover'
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
  | 'sync.online'
  | 'sync.offline'
  | 'sync.waiting'
  | 'sync.error'
  | 'sync.retryNow'
  | 'nav.home'
  | 'nav.bill'
  | 'bills.title'
  | 'bills.search'
  | 'bills.emptyTitle'
  | 'bills.emptyBody'
  | 'bills.noResults'
  | 'bills.count'
  | 'bills.today'
  | 'bills.yesterday'
  | 'bills.pending'
  | 'bills.voidTag'
  | 'bills.itemCount'
  | 'invoice.title'
  | 'invoice.billNo'
  | 'invoice.pending'
  | 'invoice.pendingNote'
  | 'invoice.date'
  | 'invoice.subtotal'
  | 'invoice.discount'
  | 'invoice.total'
  | 'invoice.payment'
  | 'invoice.customer'
  | 'invoice.share'
  | 'invoice.print'
  | 'invoice.newBill'
  | 'invoice.void'
  | 'invoice.voidConfirmTitle'
  | 'invoice.voidConfirmBody'
  | 'invoice.voidConfirm'
  | 'invoice.voidDone'
  | 'invoice.voidOffline'
  | 'invoice.voidAfterSync'
  | 'invoice.voidNeedsUpdate'
  | 'invoice.voidError'
  | 'invoice.voidedBanner'
  | 'invoice.receiptWidth'
  | 'invoice.notFound'
  | 'invoice.backToBills'
  | 'common.back'
  | 'lang.ta'
  | 'lang.en'
  | 'lang.both'
  | 'common.save'
  | 'common.close'
  | 'common.done'
  | 'home.greeting'
  | 'home.greetingName'
  | 'home.greetingPlain'
  | 'home.sub'
  | 'home.voiceTitle'
  | 'home.voiceHint'
  | 'home.voiceStart'
  | 'home.scanStock'
  | 'home.scanStockHint'
  | 'home.lowStock'
  | 'home.lowStockHint'
  | 'home.lowStockCount'
  | 'home.lowStockNone'
  | 'home.voiceFootnote'
  | 'home.kuralKadai'
  | 'billing.heard'
  | 'billing.heardEmpty'
  | 'billing.heardSummary'
  | 'billing.tapToAdd'
  | 'billing.noCachedProducts'
  | 'billing.emptyTitle'
  | 'billing.emptyBody'
  | 'billing.speakMore'
  | 'billing.hearBack'
  | 'billing.discount'
  | 'billing.addDiscount'
  | 'billing.payment'
  | 'billing.creditNeedsCustomer'
  | 'billing.chooseCustomer'
  | 'billing.customerTitle'
  | 'billing.customerSearch'
  | 'billing.noCustomers'
  | 'billing.newCustomer'
  | 'billing.customerPhone'
  | 'billing.customerAddOffline'
  | 'billing.customerAdded'
  | 'billing.customerSaveError'
  | 'billing.tabNew'
  | 'billing.tabHistory'
  | 'billing.editHint'
  | 'billing.saveBill'
  | 'billing.savedToast'
  | 'billing.saveError'
  | 'billing.removeLine'
  | 'billing.total'
  | 'billing.qty'
  | 'billing.qtyInvalid'
  | 'billing.discountInvalid'
  | 'billing.backspace'
  | 'billing.voice.title'
  | 'billing.voice.hint'
  | 'billing.voice.start'
  | 'billing.voice.stop'
  | 'billing.voice.listening'
  | 'billing.voice.processing'
  | 'billing.voice.offline'
  | 'billing.voice.auth'
  | 'billing.voice.forbidden'
  | 'billing.voice.limit'
  | 'billing.voice.audio'
  | 'billing.voice.failed'
  | 'billing.voice.nothingHeard'
  | 'billing.voice.retry'
  | 'billing.voice.micDenied'
  | 'billing.voice.unsupported'
  | 'billing.voice.draftTitle'
  | 'billing.voice.pick'
  | 'billing.voice.lowConfidence'
  | 'billing.voice.otherItem'
  | 'billing.voice.alternatives'
  | 'billing.voice.teach'
  | 'billing.voice.taught'
  | 'billing.voice.teachFailed'
  | 'billing.voice.teachOffline'
  | 'billing.voice.addToBill'
  | 'billing.voice.finalSaveError'
  | 'billing.voice.confirmHint'
  | 'billing.voice.noCatalog'
  | 'payment.cash'
  | 'payment.upi'
  | 'payment.card'
  | 'payment.credit'
  | 'stat.todaySales'
  | 'stat.billsMade'
  | 'stat.stockCost'
  | 'stat.grossProfit'
  | 'stat.vsYesterday'
  | 'period.today'
  | 'period.week'
  | 'period.month'
  | 'demo.rice'
  | 'demo.riceSub'
  | 'demo.sugar'
  | 'demo.sugarSub'
  | 'demo.milk'
  | 'demo.milkSub'
  | 'design.title'
  | 'design.subtitle'
  | 'design.section.tokens'
  | 'design.section.type'
  | 'design.section.nav'
  | 'design.section.actions'
  | 'design.section.stats'
  | 'design.section.rows'
  | 'design.section.pills'
  | 'design.section.feedback'
  | 'design.section.confirm'
  | 'design.section.compare'
  | 'design.swatch.brand'
  | 'design.swatch.brandDark'
  | 'design.swatch.brandSoft'
  | 'design.swatch.page'
  | 'design.swatch.cream'
  | 'design.swatch.warning'
  | 'design.swatch.danger'
  | 'design.swatch.ink'
  | 'design.type.tamil'
  | 'design.type.english'
  | 'design.toastSaved'
  | 'design.toastError'
  | 'design.showToast'
  | 'design.emptyTitle'
  | 'design.emptyBody'
  | 'design.emptyAction'
  | 'design.offlineText'
  | 'design.offlinePending'
  | 'design.confirmHint'
  | 'design.confirmSave'
  | 'design.micLabel'
  | 'design.micHint'
  | 'design.compareTa'
  | 'design.compareEn'
  | 'design.tokensNote'
  | 'design.type.sampleTitle'
  | 'design.type.sampleBody'
  | 'design.type.sampleMuted'
  | 'design.type.englishBody'
  | 'design.navNote'

const strings: Record<StringKey, Record<Lang, string>> = {
  'nav.billing': { ta: 'பில்', en: 'Billing' },
  'nav.products': { ta: 'பொருட்கள்', en: 'Products' },
  'nav.stock': { ta: 'சரக்கு', en: 'Stock' },
  'reports.title': { ta: 'வியாபார அறிக்கை', en: 'Business report' },
  'reports.today': { ta: 'இன்று', en: 'Today' },
  'reports.thisWeek': { ta: 'இந்த வாரம்', en: 'This week' },
  'reports.thisMonth': { ta: 'இந்த மாதம்', en: 'This month' },
  'reports.listen': { ta: 'அறிக்கையைக் கேளுங்கள்', en: 'Listen to report' },
  'reports.listenAction': { ta: 'கேள்', en: 'Listen' },
  'reports.totalSales': { ta: 'மொத்த விற்பனை', en: 'Total sales' },
  'reports.billsCount': { ta: '{n} பில்கள்', en: '{n} bills' },
  'reports.stockCostSold': { ta: 'விற்ற சரக்கு அடக்கம்', en: 'Stock cost sold' },
  'reports.grossProfit': { ta: 'மொத்த லாபம்', en: 'Gross profit' },
  'reports.whenDidYouSell': { ta: 'எப்போது அதிகம் விற்றது?', en: 'When did you sell?' },
  'reports.paymentsReceived': { ta: 'பெறப்பட்ட பணம்', en: 'Payments received' },
  'reports.vsYesterday': { ta: 'நேற்றை விட', en: 'vs yesterday' },
  'nav.reports': { ta: 'அறிக்கை', en: 'Reports' },
  'stock.tabAdd': { ta: 'சரக்கு சேர்', en: 'Add stock' },
  'stock.tabCorrect': { ta: 'திருத்தம்', en: 'Correct' },
  'stock.title': { ta: 'சரக்கு இருப்பு', en: 'Your stock' },
  'stock.tabAll': { ta: 'அனைத்தும்', en: 'All stock' },
  'stock.tabLow': { ta: 'குறைவு', en: 'Low stock' },
  'stock.daysLeft': { ta: '{n} நாட்கள்', en: '{n} days' },
  'stock.noSales': { ta: 'விற்பனை இல்லை', en: 'No sales yet' },
  'stock.avgPerDay': { ta: '{n}/நாள்', en: '{n}/day' },
  'stock.buy': { ta: 'வாங்க {qty} {unit}', en: 'Buy {qty} {unit}' },
  'stock.makeList': { ta: 'ஷாப்பிங் லிஸ்ட் உருவாக்கு', en: 'Make shopping list' },
  'stock.listTitle': { ta: 'சப்ளையர் பட்டியல்', en: 'Supplier list' },
  'stock.shareWhatsapp': { ta: 'WhatsApp இல் அனுப்பு', en: 'Share on WhatsApp' },
  'stock.copy': { ta: 'நகலெடு', en: 'Copy' },
  'stock.copied': { ta: 'நகலெடுக்கப்பட்டது', en: 'Copied' },
  'stock.scan': { ta: 'ஸ்கேன்', en: 'Scan' },
  'stock.scanTitle': { ta: 'பார்கோடு ஸ்கேன்', en: 'Scan barcode' },
  'stock.scanHint': {
    ta: 'பேக் செய்யப்பட்ட பொருட்களை மட்டும் ஸ்கேன் செய்யவும்',
    en: 'Scan packaged items only',
  },
  'stock.scanDenied': {
    ta: 'கேமரா அனுமதி இல்லை — ஃபோன் அமைப்புகளில் அனுமதித்து மீண்டும் முயற்சிக்கவும்',
    en: 'Camera permission denied — allow it in phone settings and try again',
  },
  'stock.scanUnsupported': {
    ta: 'இந்த ஃபோனில் ஸ்கேன் ஆதரவு இல்லை — தேடி சேர்க்கவும்',
    en: 'Scanning is not supported on this phone — add by search',
  },
  'stock.scanFailed': { ta: 'கேமராவைத் தொடங்க முடியவில்லை', en: 'Could not start the camera' },
  'stock.addBySearch': { ta: 'தேடி சேர்', en: 'Add by search' },
  'stock.addByVoice': { ta: 'குரலில் சேர்', en: 'Add by voice' },
  'stock.voiceTitle': { ta: 'பொருள் பெயரைச் சொல்லுங்கள்', en: 'Say the item name' },
  'stock.voiceHint': { ta: 'எ.கா. அரிசி அல்லது rice', en: 'e.g. arisi or rice' },
  'stock.voiceHeard': { ta: 'கேட்டது', en: 'Heard' },
  'stock.voiceNoMatch': {
    ta: 'பொருள் கிடைக்கவில்லை — தேடி சேர்க்கவும்',
    en: 'No matching item — try search',
  },
  'stock.voiceUnsupported': {
    ta: 'இந்த உலாவியில் குரல் ஆதரவு இல்லை',
    en: 'Voice is not supported in this browser',
  },
  'stock.voiceDenied': { ta: 'மைக் அனுமதி இல்லை', en: 'Microphone permission denied' },
  'stock.voiceFailed': { ta: 'கேட்க முடியவில்லை — மீண்டும் முயற்சிக்கவும்', en: 'Could not listen — try again' },
  'stock.unknownBarcode': { ta: 'இந்த பார்கோடு தெரியவில்லை', en: 'Unknown barcode' },
  'stock.addThisProduct': { ta: 'இந்தப் பொருளைச் சேர்', en: 'Add this product' },
  'stock.productsEntry': { ta: 'பொருட்கள்', en: 'Products' },
  'stock.noProductsTitle': { ta: 'பொருட்கள் இல்லை', en: 'No products yet' },
  'stock.noProductsBody': {
    ta: 'சரக்கைக் கணக்கிட முதலில் பொருட்களைச் சேர்க்கவும்',
    en: 'Add products first to track stock',
  },
  'stock.addProduct': { ta: 'பொருள் சேர்', en: 'Add product' },
  'stock.search': { ta: 'பொருளைத் தேடு…', en: 'Search items…' },
  'stock.lowTitle': { ta: 'குறைந்த சரக்கு', en: 'Running low' },
  'stock.lowNone': { ta: 'குறைந்த சரக்கு இல்லை', en: 'No items running low' },
  'stock.lowTag': { ta: 'குறைவு', en: 'LOW' },
  'stock.linesTitle': { ta: 'சேர்க்க வேண்டியவை', en: 'Adding to stock' },
  'stock.note': { ta: 'குறிப்பு (விரும்பினால்)', en: 'Note (optional)' },
  'stock.reason': { ta: 'காரணம்', en: 'Reason' },
  'stock.notePlaceholder': { ta: 'எ.கா. சப்ளையர் பெயர்', en: 'e.g. supplier name' },
  'stock.costOptional': { ta: 'வாங்கிய விலை (விரும்பினால்)', en: 'Cost price (optional)' },
  'stock.editQty': { ta: 'அளவை மாற்று', en: 'Change quantity' },
  'stock.removeLine': { ta: 'நீக்கு', en: 'Remove' },
  'stock.save': { ta: 'சரக்கைச் சேமி', en: 'Save stock' },
  'stock.saved': { ta: '{n} பொருட்களின் சரக்கு சேர்க்கப்பட்டது', en: '{n} items restocked' },
  'stock.saveError': { ta: 'சரக்கைச் சேமிக்க முடியவில்லை', en: 'Could not save stock' },
  'stock.needsUpdate': {
    ta: 'இந்த அம்சத்திற்கு தரவுத்தள புதுப்பிப்பு தேவை',
    en: 'This feature needs the latest database update',
  },
  'stock.offline': {
    ta: 'சரக்கு மாற்றத்திற்கு இணையம் தேவை — இணைப்பு வந்ததும் முயற்சிக்கவும்',
    en: 'Stock changes need internet — try again when you are connected',
  },
  'stock.current': { ta: 'தற்போதைய சரக்கு', en: 'Current stock' },
  'stock.newQty': { ta: 'புதிய சரக்கு அளவு', en: 'New stock qty' },
  'stock.tapToSet': { ta: 'அளவை உள்ளிட தட்டவும்', en: 'Tap to enter the quantity' },
  'stock.correctTitle': { ta: 'சரக்கைத் திருத்து', en: 'Correct stock' },
  'stock.correctHint': {
    ta: 'எண்ணிய அளவை உள்ளிட்டு காரணம் எழுதவும்',
    en: 'Enter the counted quantity and a reason',
  },
  'stock.noteRequired': { ta: 'காரணம் அவசியம்', en: 'A reason is required' },
  'stock.correctDone': { ta: 'சரக்கு திருத்தப்பட்டது', en: 'Stock corrected' },
  'stock.saveCorrect': { ta: 'திருத்தத்தைச் சேமி', en: 'Save correction' },
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
  'products.coverDays': { ta: 'சரக்கு நாட்கள்', en: 'Stock cover (days)' },
  'products.barcode': { ta: 'பார்கோடு', en: 'Barcode' },
  'products.save': { ta: 'சேமி', en: 'Save' },
  'products.delete': { ta: 'நீக்கு', en: 'Delete' },
  'products.deleteConfirm': { ta: 'இந்த பொருளை நீக்கவா?', en: 'Delete this item?' },
  'products.err.price': { ta: 'விலையை சரியாக உள்ளிடவும் (எ.கா. 55.99)', en: 'Enter a valid price (e.g. 55.99)' },
  'products.err.qty': { ta: 'அளவை சரியாக உள்ளிடவும்', en: 'Enter a valid quantity' },
  'products.err.cover': {
    ta: 'சரக்கு நாட்களை சரியாக உள்ளிடவும் (எ.கா. 7)',
    en: 'Enter a valid number of days (e.g. 7)',
  },
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
  'sync.online': { ta: 'ஆன்லைன்', en: 'Online' },
  'sync.offline': { ta: 'இணைப்பு இல்லை', en: 'Offline' },
  'sync.waiting': { ta: '{n} பில்கள் ஒத்திசைக்க காத்திருக்கின்றன', en: '{n} bills waiting to sync' },
  'sync.error': { ta: 'ஒத்திசைவில் பிழை', en: 'Sync error' },
  'sync.retryNow': { ta: 'மீண்டும் ஒத்திசை', en: 'Retry sync' },
  'nav.home': { ta: 'முகப்பு', en: 'Home' },
  'nav.bill': { ta: 'பில்', en: 'Bill' },
  'bills.title': { ta: 'பில் வரலாறு', en: 'Bill history' },
  'bills.search': { ta: 'பில் எண், பொருள் அல்லது தொகையைத் தேடு…', en: 'Search bill no., item or amount…' },
  'bills.emptyTitle': { ta: 'இன்னும் பில் இல்லை', en: 'No bills yet' },
  'bills.emptyBody': { ta: 'பில் சேமித்ததும் இங்கே தோன்றும்', en: 'Saved bills will appear here' },
  'bills.noResults': { ta: 'பில் கிடைக்கவில்லை', en: 'No matching bills' },
  'bills.count': { ta: '{n} பில்கள்', en: '{n} bills' },
  'bills.today': { ta: 'இன்று', en: 'Today' },
  'bills.yesterday': { ta: 'நேற்று', en: 'Yesterday' },
  'bills.pending': { ta: 'ஒத்திசைவு நிலுவை', en: 'Pending sync' },
  'bills.voidTag': { ta: 'ரத்து', en: 'VOID' },
  'bills.itemCount': { ta: '{n} பொருட்கள்', en: '{n} items' },
  'invoice.title': { ta: 'பில் விவரம்', en: 'Bill details' },
  'invoice.billNo': { ta: 'பில் எண்', en: 'Bill no.' },
  'invoice.pending': { ta: 'நிலுவை', en: 'Pending' },
  'invoice.pendingNote': { ta: 'ஒத்திசைவுக்குப் பின் பில் எண் வழங்கப்படும்', en: 'Bill number is assigned after sync' },
  'invoice.date': { ta: 'தேதி & நேரம்', en: 'Date & time' },
  'invoice.subtotal': { ta: 'கூட்டுத்தொகை', en: 'Subtotal' },
  'invoice.discount': { ta: 'தள்ளுபடி', en: 'Discount' },
  'invoice.total': { ta: 'மொத்தம்', en: 'Total' },
  'invoice.payment': { ta: 'பணம் செலுத்தும் முறை', en: 'Payment' },
  'invoice.customer': { ta: 'வாடிக்கையாளர்', en: 'Customer' },
  'invoice.share': { ta: 'WhatsApp இல் அனுப்பு', en: 'Share on WhatsApp' },
  'invoice.print': { ta: 'அச்சிடு', en: 'Print' },
  'invoice.newBill': { ta: 'புதிய பில்', en: 'New bill' },
  'invoice.void': { ta: 'பில் ரத்து', en: 'Void bill' },
  'invoice.voidConfirmTitle': { ta: 'இந்த பில்லை ரத்து செய்யவா?', en: 'Void this bill?' },
  'invoice.voidConfirmBody': {
    ta: 'பில் அழிக்கப்படாது — சரக்கு திரும்பவும், மொத்த விற்பனையிலிருந்து நீக்கப்படும்.',
    en: "The bill is not deleted — stock is returned and it's removed from sales totals.",
  },
  'invoice.voidConfirm': { ta: 'ஆம், ரத்து செய்', en: 'Yes, void it' },
  'invoice.voidDone': { ta: 'பில் ரத்து செய்யப்பட்டது', en: 'Bill voided' },
  'invoice.voidOffline': { ta: 'ரத்து செய்ய இணையம் தேவை', en: 'Internet is needed to void a bill' },
  'invoice.voidAfterSync': {
    ta: 'ஒத்திசைவுக்குப் பின் ரத்து செய்யலாம்',
    en: 'Can be voided after it syncs',
  },
  'invoice.voidNeedsUpdate': {
    ta: 'இந்த அம்சத்திற்கு தரவுத்தள புதுப்பிப்பு தேவை',
    en: 'This feature needs the latest database update',
  },
  'invoice.voidError': { ta: 'ரத்து செய்ய முடியவில்லை', en: 'Could not void the bill' },
  'invoice.voidedBanner': {
    ta: 'ரத்து செய்யப்பட்ட பில் — விற்பனைக் கணக்கில் சேராது',
    en: 'Voided bill — not counted in sales',
  },
  'invoice.receiptWidth': { ta: 'ரசீது அகலம்', en: 'Receipt width' },
  'invoice.notFound': { ta: 'பில் கிடைக்கவில்லை', en: 'Bill not found' },
  'invoice.backToBills': { ta: 'பில் பட்டியலுக்கு', en: 'Back to bills' },
  'common.back': { ta: 'திரும்பு', en: 'Back' },
  'lang.ta': { ta: 'தமிழ்', en: 'Tamil' },
  'lang.en': { ta: 'English', en: 'English' },
  'lang.both': { ta: 'இரண்டும்', en: 'Both' },
  'common.save': { ta: 'சேமி', en: 'Save' },
  'common.close': { ta: 'மூடு', en: 'Close' },
  'common.done': { ta: 'சரி', en: 'Done' },
  'home.greeting': { ta: 'வணக்கம், முருகன்!', en: 'Welcome back, Murugan!' },
  'home.greetingName': { ta: 'வணக்கம், {name}!', en: 'Welcome back, {name}!' },
  'home.greetingPlain': { ta: 'வணக்கம்!', en: 'Welcome back!' },
  'home.sub': { ta: 'உங்கள் கடை, எளிதாக', en: 'Your shop, made simple.' },
  'home.voiceTitle': { ta: 'பேச்சில் பில் போடலாம்', en: 'Bill by voice' },
  'home.voiceHint': { ta: 'மைக்கை தட்டவும். பொருள் + அளவு சொல்லவும்', en: 'Tap the mic. Say the item and quantity.' },
  'home.voiceStart': { ta: 'குரல் பில் தொடங்கு', en: 'Start voice bill' },
  'home.scanStock': { ta: 'ஸ்கேன் செய்து சரக்கு சேர்', en: 'Scan and add stock' },
  'home.scanStockHint': { ta: 'பார்கோடு / QR ஸ்கேன்', en: 'Scan barcode / QR' },
  'home.lowStock': { ta: '3 பொருட்கள் குறைவு', en: '3 items running low' },
  'home.lowStockHint': { ta: 'அடுத்து வாங்க வேண்டியவற்றைப் பார்', en: 'Check what to buy next' },
  'home.lowStockCount': { ta: '{n} பொருட்கள் குறைவாக உள்ளன', en: '{n} items running low' },
  'home.lowStockNone': { ta: 'சரக்கு நிலை நல்லா உள்ளது', en: 'Stock levels look fine' },
  'home.voiceFootnote': { ta: 'தமிழில் அல்லது English-ல் பேசலாம்', en: 'Speak in Tamil or English' },
  'home.kuralKadai': { ta: 'குரல் கடை', en: 'Kural kadai' },
  'billing.heard': { ta: 'நான் கேட்டது', en: 'I heard' },
  'billing.heardEmpty': { ta: 'இன்னும் ஒன்றும் இல்லை — கீழே தேடி அல்லது பேசி சேர்க்கவும்', en: 'Nothing yet — search below or speak to add' },
  'billing.heardSummary': { ta: '{n} பொருட்கள் இந்த பில்லில்', en: '{n} items in this bill' },
  'billing.tapToAdd': { ta: 'பொருளைத் தட்டி சேர்', en: 'Tap an item to add' },
  'billing.noCachedProducts': { ta: 'பொருட்கள் இன்னும் சேமிக்கப்படவில்லை. இணையத்தில் Products பக்கத்தை ஒருமுறை திறக்கவும்.', en: 'Items are not cached yet. Open Products once while online.' },
  'billing.emptyTitle': { ta: 'புதிய பில்', en: 'New bill' },
  'billing.emptyBody': { ta: 'பொருளைத் தேடி அல்லது மைக்கில் பேசி சேர்க்கவும்', en: 'Search an item or use the mic to add' },
  'billing.speakMore': { ta: 'மேலும் சேர்க்க பேசுங்கள்', en: 'Speak to add more' },
  'billing.hearBack': { ta: 'மீண்டும் கேட்க', en: 'Hear it back' },
  'billing.discount': { ta: 'தள்ளுபடி', en: 'Discount' },
  'billing.addDiscount': { ta: 'தள்ளுபடி சேர்', en: 'Add discount' },
  'billing.payment': { ta: 'பணம் செலுத்தும் முறை', en: 'Payment' },
  'billing.creditNeedsCustomer': { ta: 'கடன் பில்லுக்கு வாடிக்கையாளர் தேர்ந்தெடுக்கவும்', en: 'Credit needs a customer' },
  'billing.chooseCustomer': { ta: 'வாடிக்கையாளரைத் தேர்ந்தெடு', en: 'Choose customer' },
  'billing.customerTitle': { ta: 'வாடிக்கையாளர்', en: 'Customer' },
  'billing.customerSearch': { ta: 'வாடிக்கையாளரைத் தேடு…', en: 'Search customers…' },
  'billing.noCustomers': { ta: 'வாடிக்கையாளர் இல்லை', en: 'No customers yet' },
  'billing.newCustomer': { ta: 'புதிய வாடிக்கையாளர்', en: 'New customer' },
  'billing.customerPhone': { ta: 'தொலைபேசி எண்', en: 'Phone number' },
  'billing.customerAddOffline': { ta: 'இணையம் இல்லை — இப்போது புதிய வாடிக்கையாளரை சேர்க்க முடியாது', en: "No internet — a new customer can't be added right now" },
  'billing.customerAdded': { ta: 'வாடிக்கையாளர் சேர்க்கப்பட்டார்', en: 'Customer added' },
  'billing.customerSaveError': { ta: 'வாடிக்கையாளரை சேமிக்க முடியவில்லை', en: 'Could not save customer' },
  'billing.tabNew': { ta: 'புதிய பில்', en: 'New bill' },
  'billing.tabHistory': { ta: 'வரலாறு', en: 'History' },
  'billing.editHint': { ta: 'எந்தப் பொருளையும் திருத்தலாம்', en: 'Edit any item' },
  'billing.saveBill': { ta: 'பில் சேமி', en: 'Save bill' },
  'billing.savedToast': { ta: 'பில் #{n} சேமிக்கப்பட்டது', en: 'Bill #{n} saved' },
  'billing.saveError': { ta: 'பில் சேமிக்க முடியவில்லை', en: 'Could not save bill' },
  'billing.removeLine': { ta: 'வரியை நீக்கு', en: 'Remove line' },
  'billing.total': { ta: 'மொத்தம்', en: 'Total' },
  'billing.qty': { ta: 'அளவு', en: 'Quantity' },
  'billing.qtyInvalid': { ta: 'சரியான அளவை உள்ளிடவும்', en: 'Enter a valid quantity' },
  'billing.discountInvalid': { ta: 'சரியான தள்ளுபடியை உள்ளிடவும்', en: 'Enter a valid discount' },
  'billing.backspace': { ta: 'நீக்கு', en: 'Backspace' },
  'billing.voice.title': { ta: 'குரலில் பில்', en: 'Bill by voice' },
  'billing.voice.hint': { ta: 'மைக்கைத் தட்டி 15 வினாடி வரை பேசுங்கள்', en: 'Tap the mic and speak for up to 15 seconds' },
  'billing.voice.start': { ta: 'பேசுங்கள்', en: 'Speak' },
  'billing.voice.stop': { ta: 'நிறுத்து', en: 'Stop' },
  'billing.voice.listening': { ta: 'கேட்கிறது… {s} வி', en: 'Listening… {s}s' },
  'billing.voice.processing': { ta: 'பொருட்களைப் படிக்கிறது…', en: 'Reading items…' },
  'billing.voice.offline': { ta: 'இணையம் இல்லை — கைமுறையாக பில் போடுங்கள்', en: 'No internet — you can still bill manually' },
  'billing.voice.auth': { ta: 'மீண்டும் உள்நுழையவும்', en: 'Please sign in again' },
  'billing.voice.forbidden': { ta: 'இந்தக் கடைக்கு அனுமதி இல்லை', en: 'No access to this shop' },
  'billing.voice.limit': { ta: 'இன்றைய குரல் வரம்பு முடிந்தது — நாளை முயற்சிக்கவும்', en: "Today's voice limit is used up — try tomorrow" },
  'billing.voice.audio': { ta: 'ஒலியைப் புரிந்து கொள்ள முடியவில்லை — மீண்டும் பேசுங்கள்', en: 'Could not read the audio — try again' },
  'billing.voice.failed': { ta: 'குரல் சேவை தோல்வி — கைமுறையாக பில் போடுங்கள்', en: 'Voice service failed — bill manually' },
  'billing.voice.nothingHeard': { ta: 'எந்தப் பொருளும் கேட்கவில்லை — மீண்டும் பேசுங்கள்', en: 'No items heard — try again' },
  'billing.voice.retry': { ta: 'மீண்டும் பேசு', en: 'Try again' },
  'billing.voice.micDenied': { ta: 'மைக் அனுமதி இல்லை — ஃபோன் அமைப்புகளில் அனுமதிக்கவும்', en: 'Microphone permission denied — allow it in phone settings' },
  'billing.voice.unsupported': { ta: 'இந்த ஃபோனில் குரல் பதிவு இல்லை — கைமுறையாக போடுங்கள்', en: 'Voice recording is not supported on this phone — bill manually' },
  'billing.voice.draftTitle': { ta: 'சரிபார்த்து சேர்க்கவும்', en: 'Check and add' },
  'billing.voice.pick': { ta: 'பொருளைத் தேர்ந்தெடுக்கவும்', en: 'Pick the item' },
  'billing.voice.lowConfidence': { ta: 'உறுதி குறைவு', en: 'Low confidence' },
  'billing.voice.otherItem': { ta: 'வேறு பொருள்…', en: 'Other item…' },
  'billing.voice.alternatives': { ta: 'மற்றவை', en: 'Alternatives' },
  'billing.voice.teach': { ta: "'{word}' புதிய பெயராகச் சேமி", en: "Save '{word}' as another name" },
  'billing.voice.taught': { ta: 'புதிய பெயர் சேமிக்கப்பட்டது', en: 'New name saved' },
  'billing.voice.teachFailed': { ta: 'பெயரைச் சேமிக்க முடியவில்லை', en: 'Could not save the name' },
  'billing.voice.teachOffline': { ta: 'பெயர் சேமிக்க இணையம் தேவை', en: 'Internet is needed to save the name' },
  'billing.voice.addToBill': { ta: 'பில்லில் சேர்', en: 'Add to bill' },
  'billing.voice.finalSaveError': { ta: 'திருத்தங்கள் சேமிக்கப்படவில்லை', en: 'Corrections were not saved' },
  'billing.voice.confirmHint': { ta: 'ஒவ்வொரு பொருளையும் சரிபார்க்கவும்', en: 'Check every item first' },
  'billing.voice.noCatalog': { ta: 'பொருட்கள் சேமிக்கப்படவில்லை — Products பக்கத்தை இணையத்தில் ஒருமுறை திறக்கவும்', en: 'No products cached — open Products once while online' },
  'payment.cash': { ta: 'பணம்', en: 'Cash' },
  'payment.upi': { ta: 'UPI', en: 'UPI' },
  'payment.card': { ta: 'கார்டு', en: 'Card' },
  'payment.credit': { ta: 'கடன்', en: 'Credit' },
  'stat.todaySales': { ta: 'இன்றைய விற்பனை', en: "Today's sales" },
  'stat.billsMade': { ta: 'பில்கள்', en: 'Bills made' },
  'stat.stockCost': { ta: 'சரக்கு விலை', en: 'Stock cost' },
  'stat.grossProfit': { ta: 'மொத்த லாபம்', en: 'Gross profit' },
  'stat.vsYesterday': { ta: 'நேற்றை விட ↑12%', en: '↑12% vs yesterday' },
  'period.today': { ta: 'இன்று', en: 'Today' },
  'period.week': { ta: 'இந்த வாரம்', en: 'This week' },
  'period.month': { ta: 'இந்த மாதம்', en: 'This month' },
  'demo.rice': { ta: 'அரிசி', en: 'Rice' },
  'demo.riceSub': { ta: '2 கிலோ × ₹60', en: '2 kg × ₹60' },
  'demo.sugar': { ta: 'சர்க்கரை', en: 'Sugar' },
  'demo.sugarSub': { ta: '1 கிலோ × ₹45', en: '1 kg × ₹45' },
  'demo.milk': { ta: 'பால்', en: 'Milk' },
  'demo.milkSub': { ta: '2 பாக்கெட் × ₹30', en: '2 packs × ₹30' },
  'design.title': { ta: 'வடிவமைப்பு அமைப்பு', en: 'Design system' },
  'design.subtitle': { ta: 'கூறுகள் — தமிழ், English', en: 'Components in Tamil and English' },
  'design.section.tokens': { ta: 'நிறங்கள்', en: 'Colors' },
  'design.section.type': { ta: 'எழுத்துரு', en: 'Typography' },
  'design.section.nav': { ta: 'கீழ் பட்டி', en: 'Bottom nav' },
  'design.section.actions': { ta: 'செயல் அழைப்புகள்', en: 'Action cards' },
  'design.section.stats': { ta: 'புள்ளிவிவரங்கள்', en: 'Stats' },
  'design.section.rows': { ta: 'பட்டியல் வரிகள்', en: 'List rows' },
  'design.section.pills': { ta: 'வடிகட்டி தாவல்கள்', en: 'Pill tabs' },
  'design.section.feedback': { ta: 'நிலைச் செய்திகள்', en: 'Feedback' },
  'design.section.confirm': { ta: 'உறுதிப்படுத்தல் பட்டி', en: 'Confirm bar' },
  'design.section.compare': { ta: 'மொழி ஒப்பீடு', en: 'Language compare' },
  'design.swatch.brand': { ta: 'முதன்மை பச்சை', en: 'Primary' },
  'design.swatch.brandDark': { ta: 'அடர் பச்சை', en: 'Dark green' },
  'design.swatch.brandSoft': { ta: 'வெளிர் பச்சை', en: 'Soft green' },
  'design.swatch.page': { ta: 'பின்னணி', en: 'Page bg' },
  'design.swatch.cream': { ta: 'கிரீம்', en: 'Cream' },
  'design.swatch.warning': { ta: 'எச்சரிக்கை', en: 'Warning' },
  'design.swatch.danger': { ta: 'பிழை', en: 'Error' },
  'design.swatch.ink': { ta: 'எழுத்து', en: 'Text' },
  'design.type.tamil': { ta: 'தமிழ் எழுத்துரு — Noto Sans Tamil', en: 'Tamil type — Noto Sans Tamil' },
  'design.type.english': { ta: 'ஆங்கில எழுத்துரு — Inter', en: 'English type — Inter' },
  'design.toastSaved': { ta: 'பில் சேமிக்கப்பட்டது', en: 'Bill saved' },
  'design.toastError': { ta: 'சேமிக்க முடியவில்லை', en: 'Could not save' },
  'design.showToast': { ta: 'செய்தியைக் காட்டு', en: 'Show toast' },
  'design.emptyTitle': { ta: 'இன்னும் பொருட்கள் இல்லை', en: 'No items yet' },
  'design.emptyBody': { ta: 'முதல் பொருளைச் சேர்த்து தொடங்குங்கள்', en: 'Add your first item to start' },
  'design.emptyAction': { ta: 'பொருள் சேர்', en: 'Add item' },
  'design.offlineText': { ta: 'இணைப்பு இல்லை', en: 'Offline' },
  'design.offlinePending': { ta: '{n} காத்திருக்கிறது', en: '{n} waiting' },
  'design.confirmHint': { ta: 'சேமிப்பதற்கு முன் பொருட்களைச் சரிபார்க்கவும்', en: 'Check items before saving' },
  'design.confirmSave': { ta: 'பில் சேமி', en: 'Save bill' },
  'design.micLabel': { ta: 'பேசுங்கள்', en: 'Speak' },
  'design.micHint': { ta: 'மைக்கை அழுத்திப் பேசுங்கள்', en: 'Press the mic and speak' },
  'design.compareTa': { ta: 'தமிழ் மட்டும்', en: 'Tamil only' },
  'design.compareEn': { ta: 'ஆங்கிலம் மட்டும்', en: 'English only' },
  'design.tokensNote': { ta: 'மூலை 24 / 16 · மென்மையான நிழல் · அடிப்படை 16px', en: 'Radius 24 / 16 · soft shadow · 16px base' },
  'design.type.sampleTitle': { ta: 'அரிசி 2 கிலோ', en: 'Rice 2 kg' },
  'design.type.sampleBody': { ta: 'பேச்சில் பில் போடலாம்', en: 'Bill by voice' },
  'design.type.sampleMuted': { ta: 'குறைந்த சரக்கு — வாங்க வேண்டும்', en: 'Low stock — buy more' },
  'design.type.englishBody': { ta: 'பில் போடு — இணையம் இல்லாமலும் வேலை செய்யும்', en: 'Bill by voice — works offline' },
  'design.navNote': { ta: 'தமிழ் + English லேபிள்கள், 48px+ டச்', en: 'Bilingual labels, 48px+ targets' },
}

const LANG_STORAGE_KEY = 'app.lang'

export const LANG_MODES: LangMode[] = ['ta', 'en', 'both']

function readStoredMode(): LangMode {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    if (stored === 'en' || stored === 'both') return stored
    return 'ta'
  } catch {
    return 'ta'
  }
}

let mode: LangMode = readStoredMode()
const listeners = new Set<(m: LangMode) => void>()

export function getLangMode(): LangMode {
  return mode
}

export function setLangMode(m: LangMode): void {
  mode = m
  try {
    localStorage.setItem(LANG_STORAGE_KEY, m)
  } catch {
    // private browsing may block storage; language still applies for this session
  }
  listeners.forEach((fn) => fn(m))
}

export function subscribeLangMode(fn: (m: LangMode) => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// language used for plain t() lookups: 'both' reads Tamil as the primary
export function getLang(): Lang {
  return mode === 'en' ? 'en' : 'ta'
}

export function setLang(l: Lang): void {
  setLangMode(l)
}

/** Both languages for one key, for use with <T ta={...} en={...} />. */
export function bi(key: StringKey): { ta: string; en: string } {
  return strings[key]
}

function fill(s: string, vars: Record<string, string | number>): string {
  let out = s
  for (const [name, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${name}}`, String(value))
  }
  return out
}

/** Both languages with {placeholders} filled in, for use with <T />. */
export function biVars(key: StringKey, vars: Record<string, string | number>): { ta: string; en: string } {
  return { ta: fill(strings[key].ta, vars), en: fill(strings[key].en, vars) }
}

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const s = strings[key][getLang()]
  return vars ? fill(s, vars) : s
}

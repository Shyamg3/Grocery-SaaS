import { t } from '../lib/i18n'

export default function StockPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{t('nav.stock')}</h1>
      <p className="mt-2 text-sm text-neutral-500">{t('common.comingSoon')}</p>
    </div>
  )
}

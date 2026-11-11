import { t } from '../lib/i18n'

export default function ProductsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{t('nav.products')}</h1>
      <p className="mt-2 text-sm text-neutral-500">{t('common.comingSoon')}</p>
    </div>
  )
}

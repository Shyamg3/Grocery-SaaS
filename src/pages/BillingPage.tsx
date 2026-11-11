import { t } from '../lib/i18n'

export default function BillingPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{t('nav.billing')}</h1>
      <p className="mt-2 text-sm text-neutral-500">{t('common.comingSoon')}</p>
    </div>
  )
}

import { t } from '../lib/i18n'

export default function LoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"
        aria-hidden="true"
      />
      <p className="text-sm text-neutral-500">{t('common.loading')}</p>
    </div>
  )
}

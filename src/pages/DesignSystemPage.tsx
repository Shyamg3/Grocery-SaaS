import { useState, type ReactNode } from 'react'
import BottomNav from '../components/ui/BottomNav'
import BigActionCard from '../components/ui/BigActionCard'
import ConfirmBar from '../components/ui/ConfirmBar'
import EmptyState from '../components/ui/EmptyState'
import LanguageToggle from '../components/ui/LanguageToggle'
import ListRow from '../components/ui/ListRow'
import MicButton from '../components/ui/MicButton'
import OfflineBadge from '../components/ui/OfflineBadge'
import PillTabs from '../components/ui/PillTabs'
import StatCard from '../components/ui/StatCard'
import Toast from '../components/ui/Toast'
import T from '../components/ui/T'
import { ScanIcon, StockIcon } from '../components/ui/icons'
import { bi, t, type StringKey } from '../lib/i18n'
import { LangScope, useLangMode } from '../lib/useLanguage'

const swatches: { className: string; labelKey: StringKey }[] = [
  { className: 'bg-brand', labelKey: 'design.swatch.brand' },
  { className: 'bg-brand-dark', labelKey: 'design.swatch.brandDark' },
  { className: 'bg-brand-soft border border-line', labelKey: 'design.swatch.brandSoft' },
  { className: 'bg-page border border-line', labelKey: 'design.swatch.page' },
  { className: 'bg-cream border border-line', labelKey: 'design.swatch.cream' },
  { className: 'bg-warning', labelKey: 'design.swatch.warning' },
  { className: 'bg-danger', labelKey: 'design.swatch.danger' },
  { className: 'bg-ink', labelKey: 'design.swatch.ink' },
]

function Section({ titleKey, children }: { titleKey: StringKey; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
        <T {...bi(titleKey)} />
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function LangLabel({ modeKey }: { modeKey: StringKey }) {
  return (
    <div className="text-[13px] font-semibold text-ink-muted">
      <T {...bi(modeKey)} />
    </div>
  )
}

export default function DesignSystemPage() {
  // subscribing here re-renders the demo strings that use t()
  const mode = useLangMode()
  const [period, setPeriod] = useState('today')
  const [toastOpen, setToastOpen] = useState(false)
  const [listening, setListening] = useState(false)

  return (
    <div className="min-h-dvh bg-page">
      <div className="mx-auto min-h-dvh w-full max-w-[360px] border-x border-line bg-page px-4 pb-6">
        <header className="sticky top-0 z-30 -mx-4 bg-page/95 px-4 pt-4 pb-3 backdrop-blur">
          <T className="text-xl font-bold text-brand" subClassName="text-ink-muted" {...bi('design.title')} />
          <p className="mt-0.5 text-[13px] text-ink-muted">
            <T {...bi('design.subtitle')} />
          </p>
          <div className="mt-3 flex justify-end">
            <LanguageToggle />
          </div>
        </header>

        <Section titleKey="design.section.tokens">
          <div className="rounded-card border border-line bg-surface p-4">
            <dl className="grid grid-cols-4 gap-2">
              {swatches.map(({ className, labelKey }) => (
                <div key={labelKey}>
                  <div className={`h-12 rounded-control ${className}`} aria-hidden="true" />
                  <dt className="mt-1 text-[11px] leading-tight text-ink-muted">
                    <T {...bi(labelKey)} />
                  </dt>
                </div>
              ))}
            </dl>
            <p className="mt-3 border-t border-line pt-2 text-[12px] text-ink-muted">
              {t('design.tokensNote')}
            </p>
          </div>
        </Section>

        <Section titleKey="design.section.type">
          <div className="space-y-3 rounded-card border border-line bg-surface p-4">
            <div>
              <LangLabel modeKey="design.type.tamil" />
              <p className="font-tamil text-3xl font-bold leading-snug text-ink">
                {bi('design.type.sampleTitle').ta}
              </p>
              <p className="font-tamil text-lg leading-snug text-ink">
                {bi('design.type.sampleBody').ta}
              </p>
              <p className="font-tamil text-base leading-snug text-ink-muted">
                {bi('design.type.sampleMuted').ta}
              </p>
            </div>
            <div className="border-t border-line pt-3">
              <LangLabel modeKey="design.type.english" />
              <p className="text-2xl font-bold text-ink">{bi('design.type.sampleTitle').en}</p>
              <p className="text-base text-ink-muted">{bi('design.type.englishBody').en}</p>
            </div>
          </div>
        </Section>

        <Section titleKey="design.section.compare">
          <div className="rounded-card border border-line bg-surface p-3">
            <LangLabel modeKey="design.compareTa" />
            <LangScope lang="ta">
              <BigActionCard
                variant="plain"
                titleKey="home.scanStock"
                subtitleKey="home.scanStockHint"
                icon={<ScanIcon className="h-6 w-6" />}
              />
            </LangScope>
          </div>
          <div className="rounded-card border border-line bg-surface p-3">
            <LangLabel modeKey="design.compareEn" />
            <LangScope lang="en">
              <BigActionCard
                variant="plain"
                titleKey="home.scanStock"
                subtitleKey="home.scanStockHint"
                icon={<ScanIcon className="h-6 w-6" />}
              />
            </LangScope>
          </div>
        </Section>

        <Section titleKey="design.section.actions">
          <BigActionCard
            variant="voice"
            titleKey="home.voiceTitle"
            subtitleKey="home.voiceHint"
            icon={<StockIcon className="h-7 w-7" />}
          />
          <BigActionCard
            titleKey="home.scanStock"
            subtitleKey="home.scanStockHint"
            icon={<ScanIcon className="h-6 w-6" />}
          />
          <div className="flex justify-center rounded-card border border-line bg-surface py-5">
            <MicButton
              labelKey="design.micLabel"
              hintKey="design.micHint"
              listening={listening}
              onClick={() => setListening((v) => !v)}
            />
          </div>
        </Section>

        <Section titleKey="design.section.stats">
          <StatCard labelKey="stat.todaySales" value="₹4,850" hintKey="stat.vsYesterday" tone="brand" />
          <div className="grid grid-cols-2 gap-3">
            <StatCard labelKey="stat.todaySales" value="₹4,850" />
            <StatCard labelKey="stat.billsMade" value="32" />
          </div>
        </Section>

        <Section titleKey="design.section.pills">
          <PillTabs
            items={[
              { id: 'today', labelKey: 'period.today' },
              { id: 'week', labelKey: 'period.week' },
              { id: 'month', labelKey: 'period.month' },
            ]}
            value={period}
            onChange={setPeriod}
          />
        </Section>

        <Section titleKey="design.section.rows">
          <div className="rounded-card border border-line bg-surface px-4">
            <ListRow
              title={<T {...bi('demo.rice')} />}
              subtitle={t('demo.riceSub')}
              value="₹120"
              onEdit={() => undefined}
            />
            <ListRow
              title={<T {...bi('demo.sugar')} />}
              subtitle={t('demo.sugarSub')}
              value="₹45"
              onEdit={() => undefined}
            />
            <ListRow
              title={<T {...bi('demo.milk')} />}
              subtitle={t('demo.milkSub')}
              value="₹60"
              onEdit={() => undefined}
            />
          </div>
        </Section>

        <Section titleKey="design.section.feedback">
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4">
            <OfflineBadge online={false} />
            <OfflineBadge online pending={2} />
          </div>
          <EmptyState
            titleKey="design.emptyTitle"
            bodyKey="design.emptyBody"
            actionKey="design.emptyAction"
            onAction={() => undefined}
            icon={<StockIcon className="h-6 w-6" />}
          />
          <button
            type="button"
            onClick={() => setToastOpen(true)}
            className="min-h-[48px] w-full rounded-control border border-line bg-surface px-4 text-base font-semibold text-ink active:bg-brand-tint"
          >
            <T {...bi('design.showToast')} />
          </button>
          <Toast
            visible={toastOpen}
            message={bi('design.toastSaved')[mode === 'en' ? 'en' : 'ta']}
            onDismiss={() => setToastOpen(false)}
          />
        </Section>

        <Section titleKey="design.section.confirm">
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="h-16 bg-cream" />
            <ConfirmBar labelKey="design.confirmSave" hintKey="design.confirmHint" onClick={() => undefined} />
          </div>
        </Section>

        <Section titleKey="design.section.nav">
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            <BottomNav active="bill" />
          </div>
          <p className="px-1 text-[13px] text-ink-muted">{t('design.navNote')}</p>
        </Section>
      </div>
    </div>
  )
}

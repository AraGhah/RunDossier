import { Linkedin, Calendar } from 'lucide-react'
import { PUBLIC_PROFILES } from '../lib/site-data'
import { useTranslation } from '../context/LanguageContext'

const ICONS = {
  linkedin: Linkedin,
  cal: Calendar,
}

function profileRel(profile) {
  return profile.rel ? `noopener noreferrer ${profile.rel}` : 'noopener noreferrer'
}

/** Sitewide public profile links — LinkedIn, Cal.com, etc. */
export default function PublicProfiles({ variant = 'strip', className = '' }) {
  const { t } = useTranslation()

  if (variant === 'compact') {
    return (
      <ul className={`flex flex-wrap items-center gap-3 ${className}`}>
        {PUBLIC_PROFILES.map((profile) => {
          const Icon = ICONS[profile.id]
          return (
            <li key={profile.id}>
              <a
                href={profile.url}
                target="_blank"
                rel={profileRel(profile)}
                className="inline-flex items-center gap-2 text-sm font-medium text-navy underline underline-offset-[3px] decoration-navy/40 hover:decoration-navy transition-colors"
                aria-label={`${profile.platform}: ${profile.displayUrl}`}
              >
                {Icon ? <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> : null}
                <span>{profile.platform}</span>
                <span className="text-muted-2 font-normal hidden sm:inline">— {profile.displayUrl}</span>
              </a>
            </li>
          )
        })}
      </ul>
    )
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
        {PUBLIC_PROFILES.map((profile) => {
          const Icon = ICONS[profile.id]
          return (
            <a
              key={profile.id}
              href={profile.url}
              target="_blank"
              rel={profileRel(profile)}
              className="group rounded-xl border border-border bg-white/80 p-5 hover:border-navy/20 hover:shadow-card transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy/[0.06] border border-navy/[0.04] flex items-center justify-center flex-shrink-0">
                  {Icon ? <Icon className="w-5 h-5 text-navy" aria-hidden="true" /> : null}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink text-sm">{t(profile.titleKey)}</p>
                  <p className="mt-1 text-sm text-muted leading-relaxed">{t(profile.bodyKey)}</p>
                  <p className="mt-3 text-sm font-semibold text-navy group-hover:underline underline-offset-2 break-all">
                    {t(profile.actionKey)} — {profile.displayUrl}
                  </p>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    )
  }

  return (
    <section className={`border-y border-border bg-cream-2 py-8 sm:py-10 ${className}`} aria-labelledby="public-profiles-heading">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-gold mb-2">
              {t('publicProfiles.eyebrow')}
            </p>
            <h2 id="public-profiles-heading" className="font-display text-[clamp(1.35rem,3vw,1.75rem)] font-bold text-ink">
              {t('publicProfiles.title')}
            </h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">{t('publicProfiles.sub')}</p>
          </div>
          <PublicProfiles variant="compact" />
        </div>
      </div>
    </section>
  )
}

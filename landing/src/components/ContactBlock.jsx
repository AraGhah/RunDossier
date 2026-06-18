import { LEGAL_EMAIL, LEGAL_PHONE, legalPhoneDisplay, legalPhoneTel } from '../lib/legal'
import { LINKEDIN_URL, PUBLIC_PROFILES, SITE_URL } from '../lib/site-data'
import { useTranslation } from '../context/LanguageContext'

/** Structured public contact — email, scheduling, LinkedIn, and optional phone. */
export default function ContactBlock({ className = '', showLocation = true }) {
  const { t } = useTranslation()
  const phone = LEGAL_PHONE.trim()
  const linkedin = PUBLIC_PROFILES.find((p) => p.id === 'linkedin')

  return (
    <address className={`not-italic ${className}`}>
      {showLocation && (
        <p className="text-xs text-muted-2 sm:text-sm">
          {t('contact.location')}
        </p>
      )}
      <p className="mt-2 text-xs text-muted-2 sm:text-sm">
        {t('contact.hoursLabel')} {t('contact.hoursValue')}
      </p>
      <p className="mt-2 text-xs sm:text-sm">
        <span className="text-muted-2">{t('contact.emailLabel')} </span>
        <a
          href={`mailto:${LEGAL_EMAIL}`}
          className="break-all text-navy underline underline-offset-2 hover:text-navy-2"
          aria-label={`Email Dossier at ${LEGAL_EMAIL}`}
        >
          {LEGAL_EMAIL}
        </a>
      </p>
      {phone ? (
        <p className="mt-1 text-xs sm:text-sm">
          <span className="text-muted-2">{t('contact.phoneLabel')} </span>
          <a href={`tel:${legalPhoneTel()}`} className="text-navy underline underline-offset-2 hover:text-navy-2">
            {legalPhoneDisplay()}
          </a>
        </p>
      ) : null}
      <p className="mt-1 text-xs sm:text-sm">
        <span className="text-muted-2">{t('contact.scheduleLabel')} </span>
        <a href={`${SITE_URL}/book-call`} className="text-navy underline underline-offset-2 hover:text-navy-2">
          {SITE_URL}/book-call
        </a>
      </p>
      {linkedin ? (
        <p className="mt-1 text-xs sm:text-sm">
          <span className="text-muted-2">{t('contact.linkedinLabel')} </span>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer me"
            className="text-navy underline underline-offset-2 hover:text-navy-2 break-all"
          >
            {linkedin.displayUrl}
          </a>
        </p>
      ) : null}
    </address>
  )
}

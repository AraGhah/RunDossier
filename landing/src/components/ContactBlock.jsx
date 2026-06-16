import { LEGAL_EMAIL, LEGAL_PHONE, legalPhoneDisplay, legalPhoneTel } from '../lib/legal'
import { useTranslation } from '../context/LanguageContext'

/** Structured public contact, keeps email/phone separate for crawlers and audits. */
export default function ContactBlock({ className = '', showLocation = true }) {
  const { t } = useTranslation()

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
      {LEGAL_PHONE ? (
        <p className="mt-1 text-xs sm:text-sm">
          <span className="text-muted-2">{t('contact.phoneLabel')} </span>
          <a href={`tel:${legalPhoneTel()}`} className="text-navy underline underline-offset-2 hover:text-navy-2">
            {legalPhoneDisplay()}
          </a>
        </p>
      ) : null}
    </address>
  )
}

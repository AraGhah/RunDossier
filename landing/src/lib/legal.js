/** Shared legal identifiers — keep Privacy, Terms, and contact pages in sync. */
export const LEGAL_ENTITY = 'Dossier'
export const LEGAL_OPERATOR = 'Ara Ghahramanyan'
export const LEGAL_WEBSITE = 'https://rundossier.co'
export const LEGAL_EMAIL = 'ara@getdossier.co'
/** E.164 or display format — set VITE_CONTACT_PHONE in production for public tel: links. */
const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined
export const LEGAL_PHONE = (viteEnv?.VITE_CONTACT_PHONE || '').trim()
export const LEGAL_LAST_UPDATED = 'June 13, 2026'
/** Principal place of business for governing law (update if incorporated elsewhere). */
export const LEGAL_JURISDICTION = 'Province of Quebec, Canada'
export const LEGAL_CITY = 'Montreal'
export const LEGAL_REGION = 'Quebec'
export const LEGAL_COUNTRY = 'CA'
export const LEGAL_BUSINESS_HOURS = 'Monday to Friday, 9:00 AM to 5:00 PM Eastern Time'

export function legalPhoneTel() {
  if (!LEGAL_PHONE) return ''
  const digits = LEGAL_PHONE.replace(/[^\d+]/g, '')
  return digits.startsWith('+') ? digits : `+${digits.replace(/^\+/, '')}`
}

export function legalPhoneDisplay() {
  return LEGAL_PHONE
}

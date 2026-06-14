/**
 * Cal.com event slugs (username/event-type).
 * Account: cal.com/preframe — override per platform via Vite env in production.
 */
const DEFAULT_CAL_LINK = 'preframe/30min'

export const CAL_MEETING_DURATION_LABEL = '20–30 minutes'

export const CAL_HOST_NAME = 'Ara Ghahramanyan'
export const CAL_HOST_ROLE = 'Founder, Dossier'
/** Organizer notification email — set the same address in Cal.com account settings */
export const CAL_HOST_EMAIL = 'ara@getdossier.co'

export const calLinks = {
  zoom: import.meta.env.VITE_CAL_ZOOM_LINK?.trim() || DEFAULT_CAL_LINK,
  teams: import.meta.env.VITE_CAL_TEAMS_LINK?.trim() || DEFAULT_CAL_LINK,
}

export const calLinksDiffer = calLinks.zoom !== calLinks.teams

export const calBookingUrl = (platform = 'zoom') =>
  `https://cal.com/${calLinks[platform] || DEFAULT_CAL_LINK}`

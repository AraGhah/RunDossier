import { useEffect, useState } from 'react'
import Cal, { getCalApi } from '@calcom/embed-react'
import { calLinks, calLinksDiffer, calBookingUrl, CAL_MEETING_DURATION_LABEL, CAL_HOST_NAME, CAL_HOST_ROLE } from '../lib/cal'

const platforms = [
  {
    id: 'zoom',
    label: 'Zoom',
    desc: 'Video call via Zoom',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M17 10l4-2v8l-4-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'teams',
    label: 'Microsoft Teams',
    desc: 'Video call via Teams',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 8h2a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
]

export default function CalBookingEmbed({ className = '' }) {
  const [platform, setPlatform] = useState('zoom')
  const calLink = calLinks[platform]

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const cal = await getCalApi()
      if (cancelled) return
      cal('ui', {
        theme: 'light',
        layout: 'month_view',
        hideEventTypeDetails: true,
        showTimezoneWhenEventDetailsHidden: true,
        styles: {
          branding: { brandColor: '#0F1B2D' },
        },
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={className}>
      <div className="mb-5 pb-4 border-b border-border/70">
        <p className="font-display text-lg font-semibold text-ink">{CAL_HOST_NAME}</p>
        <p className="text-xs text-muted mt-0.5">
          {CAL_HOST_ROLE} · {CAL_MEETING_DURATION_LABEL}
        </p>
      </div>

      {calLinksDiffer ? (
        <>
          <p className="text-sm text-muted mb-3">Choose your video platform:</p>
          <div className="grid grid-cols-2 gap-2 mb-4" role="tablist" aria-label="Meeting platform">
            {platforms.map((p) => {
              const active = platform === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                    active
                      ? 'border-navy bg-navy/5 text-navy shadow-sm'
                      : 'border-border text-ink hover:border-navy/40 hover:bg-navy/[0.03]'
                  }`}
                >
                  <span className={`flex items-center gap-2 text-sm font-semibold ${active ? 'text-navy' : 'text-ink'}`}>
                    {p.icon}
                    {p.label}
                  </span>
                  <span className="text-[0.7rem] text-muted leading-snug">{p.desc}</span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted mb-4">
          30-minute fit call. You can choose <strong className="text-ink font-medium">Zoom</strong> or{' '}
          <strong className="text-ink font-medium">Microsoft Teams</strong> in the booking form.
        </p>
      )}

      <p className="text-sm text-muted mb-3">Pick a date, then choose an available time:</p>
      <div
        className="min-h-[420px] rounded-xl border border-border/80 overflow-hidden bg-cream/30"
        key={platform}
      >
        <Cal
          calLink={calLink}
          config={{
            layout: 'month_view',
            theme: 'light',
            useSlotsViewOnSmallScreen: 'true',
            hideEventTypeDetails: true,
          }}
          style={{ width: '100%', minHeight: '420px', height: '100%', overflow: 'auto' }}
        />
      </div>
      <p className="text-center text-xs text-muted-2 mt-3">
        Powered by Cal.com ·{' '}
        <a
          href={calBookingUrl(platform)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-navy hover:underline"
        >
          Open booking page
        </a>
      </p>
    </div>
  )
}

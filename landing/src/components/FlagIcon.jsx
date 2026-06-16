const FLAG_CLASS = 'w-5 h-[14px] rounded-[2px] ring-1 ring-black/10 flex-shrink-0'

function FlagUS() {
  return (
    <svg className={FLAG_CLASS} viewBox="0 0 19 13" aria-hidden>
      <rect width="19" height="13" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map(y => (
        <rect key={y} y={y} width="19" height="1" fill="#B22234" />
      ))}
      <rect width="8" height="7" fill="#3C3B6E" />
      <g fill="#fff">
        <circle cx="1.2" cy="1.2" r="0.35" />
        <circle cx="2.6" cy="1.2" r="0.35" />
        <circle cx="4" cy="1.2" r="0.35" />
        <circle cx="5.4" cy="1.2" r="0.35" />
        <circle cx="6.8" cy="1.2" r="0.35" />
        <circle cx="1.9" cy="2.4" r="0.35" />
        <circle cx="3.3" cy="2.4" r="0.35" />
        <circle cx="4.7" cy="2.4" r="0.35" />
        <circle cx="6.1" cy="2.4" r="0.35" />
        <circle cx="1.2" cy="3.6" r="0.35" />
        <circle cx="2.6" cy="3.6" r="0.35" />
        <circle cx="4" cy="3.6" r="0.35" />
        <circle cx="5.4" cy="3.6" r="0.35" />
        <circle cx="6.8" cy="3.6" r="0.35" />
        <circle cx="1.9" cy="4.8" r="0.35" />
        <circle cx="3.3" cy="4.8" r="0.35" />
        <circle cx="4.7" cy="4.8" r="0.35" />
        <circle cx="6.1" cy="4.8" r="0.35" />
        <circle cx="1.2" cy="6" r="0.35" />
        <circle cx="2.6" cy="6" r="0.35" />
        <circle cx="4" cy="6" r="0.35" />
        <circle cx="5.4" cy="6" r="0.35" />
        <circle cx="6.8" cy="6" r="0.35" />
      </g>
    </svg>
  )
}

function FlagFrance() {
  return (
    <svg className={FLAG_CLASS} viewBox="0 0 3 2" aria-hidden>
      <rect width="1" height="2" fill="#002395" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ED2939" />
    </svg>
  )
}

const FLAGS = {
  en: FlagUS,
  fr: FlagFrance,
}

export default function FlagIcon({ code }) {
  const Flag = FLAGS[code]
  if (!Flag) return null
  return <Flag />
}

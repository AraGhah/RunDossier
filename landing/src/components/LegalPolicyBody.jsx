import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeUp } from './ui'

function renderSegments(segments) {
  if (!segments) return null
  return segments.map((seg, i) => {
    if (seg.to) {
      return (
        <Link key={i} to={seg.to} className="text-navy hover:underline">
          {seg.text}
        </Link>
      )
    }
    if (seg.href) {
      return (
        <a key={i} href={seg.href} className="text-navy hover:underline">
          {seg.text}
        </a>
      )
    }
    if (seg.em) {
      return <em key={i}>{seg.text}</em>
    }
    return <span key={i}>{seg.text}</span>
  })
}

function PolicyBlock({ block }) {
  if (block.type === 'h3') {
    return <p className="font-semibold text-ink mt-2 mb-1">{block.text}</p>
  }
  if (block.type === 'ul') {
    return (
      <ul className="list-disc list-inside space-y-1.5 pl-1">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    )
  }
  if (block.type === 'p') {
    const className = block.className || undefined
    if (block.segments) {
      return <p className={className}>{renderSegments(block.segments)}</p>
    }
    return <p className={className}>{block.text}</p>
  }
  return null
}

export function PolicySection({ title, children }) {
  return (
    <motion.section {...fadeUp} className="mb-10">
      <h2 className="font-display text-xl font-bold text-ink mb-4 pb-3 border-b border-border">{title}</h2>
      <div className="text-muted leading-relaxed text-[0.95rem] space-y-3">{children}</div>
    </motion.section>
  )
}

export default function LegalPolicyBody({ sections }) {
  return sections.map((section) => (
    <PolicySection key={section.title} title={section.title}>
      {section.blocks.map((block, i) => (
        <PolicyBlock key={i} block={block} />
      ))}
    </PolicySection>
  ))
}

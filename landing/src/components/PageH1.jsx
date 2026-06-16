/** Single-line H1 aligned with the route title (no nested markup). */
export default function PageH1({ children, className = '' }) {
  return (
    <h1
      className={`font-display text-[clamp(2.2rem,4.8vw,3.8rem)] font-bold leading-[1.1] tracking-tight ${className}`}
    >
      {children}
    </h1>
  )
}

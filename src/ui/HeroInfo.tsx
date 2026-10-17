import { AnimatePresence, motion } from 'framer-motion'
import { displayName, sideOf } from '../lib/anatomyData'
import { useAnatomyStore } from '../store/useAnatomyStore'
import { summary, useDetails } from './useDetails'

function splitTitle(name: string): [string, string] {
  const words = name.split(' ')
  if (words.length === 1) return ['', words[0]]
  return [words.slice(0, -1).join(' '), words[words.length - 1]]
}

const BIG = 'text-[clamp(26px,2.1vw,36px)]'

/** Breadcrumb, large title, tagline, description and location chip (top-left of the viewer). */
export function HeroInfo() {
  const { system, sel, description } = useDetails()
  const mode = useAnatomyStore((s) => s.mode)
  const select = useAnatomyStore((s) => s.select)

  const exploded = mode === 'exploded'
  const [first, second] = sel ? splitTitle(displayName(sel)) : system.title
  const crumbs = exploded ? ['Body', 'All systems'] : ['Body', system.title[0], ...(sel ? [displayName(sel)] : [])]
  const tagline = exploded ? 'Eleven systems · One body' : sel ? (sel.path.slice(-2).join(' · ') || system.title[0]) : system.tagline
  const text = sel
    ? description
      ? summary(description.text)
      : 'Loading description…'
    : system.description
  const side = sel ? sideOf(sel) : null
  const chip = sel ? (side === 'Midline' ? 'Midline structure' : side === 'Both sides' ? 'Left and right' : `${side} side`) : system.location

  return (
    <div>
      <nav className="label flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span>/</span>}
            {i === 1 && sel ? (
              <button type="button" className="label hover:text-ink" onClick={() => select(null)}>
                {c}
              </button>
            ) : (
              <span className={i === crumbs.length - 1 ? 'text-accent' : ''}>{c}</span>
            )}
          </span>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={sel?.key ?? `${mode}-${system.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28 }}
        >
          <h1 className="mt-3 font-display font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
            {exploded ? (
              <>
                <span className={`block ${BIG}`}>Human</span>
                <span className={`block text-accent ${BIG}`}>Anatomy</span>
              </>
            ) : (
              <>
                {first && <span className={`block ${sel ? 'text-[clamp(18px,1.4vw,24px)]' : BIG}`}>{first}</span>}
                <span className={`block text-accent ${sel ? 'text-[clamp(22px,1.8vw,32px)]' : BIG}`}>{second}</span>
              </>
            )}
          </h1>
          <div className="label mt-3 text-[10.5px] tracking-[0.26em] text-ink/70">{tagline}</div>
          {!exploded && !sel && <p className="mt-3 text-[13.5px] leading-relaxed text-ink/75">{text}</p>}
          {!exploded && (
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#bfe3ef] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1b8db5]">
              <span className="h-2 w-2 rounded-full bg-[#1b8db5]" />
              {chip}
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

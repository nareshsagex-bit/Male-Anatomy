import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SYSTEMS } from '../data/systems'
import { displayName, findKey, getSelection, sideOf } from '../lib/anatomyData'
import { useAnatomyStore } from '../store/useAnatomyStore'
import { useDetails } from './useDetails'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="label flex items-center gap-2 text-[13px] text-ink">
      <span className="h-3.5 w-[3px] rounded-full bg-ink" />
      {children}
    </h2>
  )
}

function SpecRow({ label, value, bar }: { label: string; value: string; bar?: number }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="label w-[46%] shrink-0 text-[11px] leading-tight text-muted">{label}</span>
      <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-line">
        {bar !== undefined && (
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(4, bar * 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </span>
      <span className="label max-w-[38%] text-right text-[13px] leading-tight text-ink">{value}</span>
    </div>
  )
}

/** Right column: specifications + key structures for a system, or full info for the selected part. */
export function SpecsPanel() {
  const { system, sel, description } = useDetails()
  const index = useAnatomyStore((s) => s.index)
  const mode = useAnatomyStore((s) => s.mode)
  const { select, openSystem } = useAnatomyStore.getState()
  const [expanded, setExpanded] = useState(false)

  const keyParts = useMemo(() => {
    if (!index) return []
    return system.keyStructures
      .map((name) => findKey(index, name))
      .filter((key): key is string => !!key)
      .map((key) => getSelection(index, key)!)
  }, [index, system])

  const partsInSystem = useMemo(
    () => (index ? Object.values(index).filter((p) => p.system === system.id).length : 0),
    [index, system.id],
  )

  if (mode === 'exploded') {
    return (
      <aside className="card scroll-thin flex min-h-0 flex-col gap-2 overflow-y-auto p-5">
        <SectionTitle>All systems</SectionTitle>
        <div className="mt-2 flex flex-col gap-2">
          {SYSTEMS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => openSystem(s.id)}
              className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-left transition hover:border-accent/50"
            >
              <span>
                <span className="label block text-[13px] text-ink">{s.title[0]}</span>
                <span className="block text-[12px] text-muted">{s.tagline}</span>
              </span>
              <span className="text-accent">→</span>
            </button>
          ))}
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex min-h-0 flex-col gap-4">
      <AnimatePresence mode="wait">
        <motion.section
          key={sel?.key ?? system.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="card scroll-thin min-h-0 overflow-y-auto p-5"
        >
          {sel ? (
            <>
              <div className="flex items-center justify-between">
                <SectionTitle>Structure</SectionTitle>
                <button type="button" onClick={() => select(null)} className="label text-[11px] text-muted hover:text-accent">
                  ← {system.title[0]}
                </button>
              </div>
              <div className="mt-3">
                <SpecRow label="Name" value={displayName(sel)} />
                <SpecRow label="System" value={system.title[0]} />
                {sel.kind === 'group' && <SpecRow label="Parts in model" value={String(sel.ids.length)} />}
                <SpecRow label="Side" value={sideOf(sel)} />
                <SpecRow label="Size (approx.)" value={`${Math.round(Math.max(...sel.size) * 100)} cm`} />
              </div>
              {sel.path.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sel.path.map((p) => (
                    <span key={p} className="rounded-full bg-page px-2.5 py-1 text-[11px] text-ink/70">
                      {p}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 text-[13px] leading-relaxed text-ink/80">
                {description ? (
                  <>
                    {description.from !== sel.baseName && (
                      <p className="label mb-1 text-[10px] text-muted">About the {description.from}</p>
                    )}
                    <p className={expanded ? '' : 'line-clamp-[8]'}>{description.text}</p>
                    {description.text.length > 420 && (
                      <button type="button" onClick={() => setExpanded(!expanded)} className="label mt-2 text-[11px] text-accent">
                        {expanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                    <p className="mt-3 text-[10px] text-muted">Source: Z-Anatomy / Wikipedia (CC BY-SA)</p>
                  </>
                ) : (
                  <p className="text-muted">Loading description…</p>
                )}
              </div>
            </>
          ) : (
            <>
              <SectionTitle>Specifications</SectionTitle>
              <div className="mt-3">
                {system.specs.map((s) => (
                  <SpecRow key={s.label} {...s} />
                ))}
                <SpecRow label="Parts in model" value={partsInSystem.toLocaleString()} />
              </div>
            </>
          )}
        </motion.section>
      </AnimatePresence>

      {!sel && keyParts.length > 0 && (
        <section className="card min-h-0 p-5">
          <SectionTitle>Key structures</SectionTitle>
          <div className="mt-3 flex flex-col gap-2">
            {keyParts.slice(0, 4).map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => select(k.key)}
                className="group flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left transition hover:border-accent/50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">◉</span>
                <span className="min-w-0 flex-1">
                  <span className="label block truncate text-[13px] text-ink">{displayName(k)}</span>
                  <span className="block truncate text-[12px] text-muted">{k.kind === 'group' ? `${k.ids.length} parts` : (k.path[k.path.length - 1] ?? system.title[0])}</span>
                </span>
                <span className="text-accent transition group-hover:translate-x-0.5">→</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => useAnatomyStore.getState().toggleLabels()}
            className="label mt-3 w-full rounded-xl border border-accent/60 py-2.5 text-[11px] text-accent transition hover:bg-accent-soft"
          >
            Show labels on model →
          </button>
        </section>
      )}
    </aside>
  )
}

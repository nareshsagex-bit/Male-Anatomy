import { motion } from 'framer-motion'
import { SYSTEMS, type SystemInfo } from '../data/systems'
import { activeSystem, useAnatomyStore } from '../store/useAnatomyStore'

function LayerCard({ info, active }: { info: SystemInfo; active: boolean }) {
  const openSystem = useAnatomyStore((s) => s.openSystem)
  return (
    <motion.button
      type="button"
      layout
      onClick={() => openSystem(info.id)}
      className={`group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
        active ? 'border-accent/70 bg-accent-soft' : 'border-transparent bg-white hover:border-line'
      }`}
      style={{ boxShadow: active ? '0 6px 20px rgb(232 50 43 / 0.12)' : '0 1px 2px rgb(20 24 40 / 0.04)' }}
    >
      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f1f1f4]">
        <img
          src={`/thumbs/${info.id}.png`}
          alt=""
          className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
        />
        <span className="label absolute bottom-1 left-1 rounded bg-white/85 px-1 text-[9px] text-muted">L{info.layer}</span>
      </span>
      <span className="min-w-0">
        <span className="label block text-[10px] text-muted">{info.kind === 'layer' ? `Layer ${info.layer}` : 'Organ system'}</span>
        <span className={`label block truncate text-[14px] leading-tight tracking-[0.1em] ${active ? 'text-accent' : 'text-ink'}`}>{info.title[0]}</span>
        <span className="label block truncate text-[10px] text-muted">{info.tagline.split(' · ')[0]}</span>
      </span>
    </motion.button>
  )
}

export function LayerList() {
  const current = useAnatomyStore(activeSystem)
  const mode = useAnatomyStore((s) => s.mode)
  const explored = useAnatomyStore((s) => s.explored)
  const seen = SYSTEMS.filter((s) => explored[`system:${s.id}`]).length
  const layers = SYSTEMS.filter((s) => s.kind === 'layer')
  const organs = SYSTEMS.filter((s) => s.kind === 'organ')

  return (
    <aside className="card flex min-h-0 flex-col p-3">
      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        <div className="label px-1 pt-1 text-[10px] text-muted">Body layers</div>
        {layers.map((s) => (
          <LayerCard key={s.id} info={s} active={mode === 'body' && current === s.id} />
        ))}
        <div className="label px-1 pt-3 text-[10px] text-muted">Organ systems</div>
        {organs.map((s) => (
          <LayerCard key={s.id} info={s} active={mode === 'body' && current === s.id} />
        ))}
      </div>
      <div className="mt-3 border-t border-line px-1 pt-3">
        <div className="flex items-center justify-between">
          <span className="label text-[11px] text-muted">Systems explored</span>
          <span className="label text-[12px] text-accent">
            {seen} / {SYSTEMS.length}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(seen / SYSTEMS.length) * 100}%` }} />
        </div>
      </div>
    </aside>
  )
}

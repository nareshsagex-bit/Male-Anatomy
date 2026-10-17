import { useEffect } from 'react'
import { SYSTEMS, SYSTEM_BY_ID, type SystemId } from '../data/systems'
import { activeSystem, useAnatomyStore, type ViewPreset } from '../store/useAnatomyStore'

const PRESETS: { id: ViewPreset; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'top', label: 'Top' },
]

const tool = (active = false) =>
  `label rounded-lg border px-2.5 py-1.5 text-[10px] transition ${
    active ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-white/90 text-ink/80 hover:text-ink'
  }`

/** Camera presets plus view tools (labels, hide, show all, rotate, reset). */
export function ViewControls() {
  const camera = useAnatomyStore((s) => s.camera)
  const labels = useAnatomyStore((s) => s.labels)
  const autoRotate = useAnatomyStore((s) => s.autoRotate)
  const selected = useAnatomyStore((s) => s.selected)
  const hiddenCount = useAnatomyStore((s) => Object.keys(s.hidden).length)
  const mode = useAnatomyStore((s) => s.mode)
  const { viewPreset, toggleLabels, toggleAutoRotate, hideSelected, showAll, resetView } = useAnatomyStore.getState()

  return (
    <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5">
      {PRESETS.map((p) => (
        <button key={p.id} type="button" className={tool(camera.kind === 'preset' && camera.preset === p.id)} onClick={() => viewPreset(p.id)}>
          {p.label}
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-line" />
      <button type="button" className={tool(labels)} onClick={toggleLabels} disabled={mode === 'exploded'}>
        Labels
      </button>
      <button type="button" className={tool(autoRotate)} onClick={toggleAutoRotate}>
        Rotate
      </button>
      {selected && (
        <button type="button" className={tool()} onClick={hideSelected}>
          Hide part
        </button>
      )}
      {hiddenCount > 0 && (
        <button type="button" className={tool()} onClick={showAll}>
          Show all ({hiddenCount})
        </button>
      )}
      <button type="button" className={tool()} onClick={resetView}>
        Reset
      </button>
    </div>
  )
}

function ArrowButton({ dir, target }: { dir: -1 | 1; target: SystemId }) {
  const openSystem = useAnatomyStore((s) => s.openSystem)
  const info = SYSTEM_BY_ID[target]
  return (
    <button
      type="button"
      onClick={() => openSystem(target)}
      aria-label={`${dir < 0 ? 'Previous' : 'Next'}: ${info.title.join(' ')}`}
      className="group pointer-events-auto flex flex-col items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full border border-line bg-white/90 text-[26px] leading-none text-ink shadow-[0_6px_20px_rgb(20_24_40/0.08)] backdrop-blur transition group-hover:border-accent group-hover:bg-accent group-hover:text-white sm:h-14 sm:w-14">
        {dir < 0 ? '‹' : '›'}
      </span>
      <span className="label hidden whitespace-nowrap text-center text-[9px] leading-tight text-muted transition group-hover:text-accent sm:block">
        {info.title[0]}
      </span>
    </button>
  )
}

/** ‹ › buttons either side of the body: step to the previous / next system (also ← → keys). */
export function SystemNav() {
  const current = useAnatomyStore(activeSystem)
  const mode = useAnatomyStore((s) => s.mode)
  const i = SYSTEMS.findIndex((s) => s.id === current)
  const prev = SYSTEMS[(i - 1 + SYSTEMS.length) % SYSTEMS.length].id
  const next = SYSTEMS[(i + 1) % SYSTEMS.length].id

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useAnatomyStore.getState().mode !== 'body') return
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
      if (e.key === 'ArrowLeft') useAnatomyStore.getState().openSystem(prev)
      if (e.key === 'ArrowRight') useAnatomyStore.getState().openSystem(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  if (mode === 'exploded') return null
  return (
    <>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 sm:left-6">
        <ArrowButton dir={-1} target={prev} />
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-6">
        <ArrowButton dir={1} target={next} />
      </div>
    </>
  )
}

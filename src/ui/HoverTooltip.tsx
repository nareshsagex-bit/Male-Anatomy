import { useEffect, useRef } from 'react'
import { SYSTEM_BY_ID } from '../data/systems'
import { useAnatomyStore } from '../store/useAnatomyStore'

/** Part name that follows the cursor while hovering the model. */
export function HoverTooltip() {
  const ref = useRef<HTMLDivElement>(null)
  const hovered = useAnatomyStore((s) => s.hovered)
  const part = useAnatomyStore((s) => (s.hovered && s.index ? s.index[s.hovered] : null))
  const mode = useAnatomyStore((s) => s.mode)

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 14}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const show = hovered && part
  return (
    <div ref={ref} className="pointer-events-none fixed left-0 top-0 z-50" style={{ opacity: show ? 1 : 0, transition: 'opacity 120ms' }}>
      {part && (
        <div className="rounded-lg bg-ink/90 px-3 py-2 text-white shadow-lg backdrop-blur">
          <div className="text-[13px] font-medium leading-tight">{mode === 'exploded' ? SYSTEM_BY_ID[part.system].title.join(' ') : part.name}</div>
          <div className="label mt-0.5 text-[9px] text-white/60">
            {mode === 'exploded' ? 'Click to open' : SYSTEM_BY_ID[part.system].title[0]}
          </div>
        </div>
      )}
    </div>
  )
}

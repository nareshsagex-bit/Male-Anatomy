import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { SYSTEM_BY_ID } from '../data/systems'
import { displayName, findKey, getSelection } from '../lib/anatomyData'
import { activeSystem, useAnatomyStore } from '../store/useAnatomyStore'
import { EXPLODED_ORDER, explodedOffset } from './layout'

/** Pinned labels for the active system's key structures (labels mode). */
export function PartLabels() {
  const index = useAnatomyStore((s) => s.index)
  const labels = useAnatomyStore((s) => s.labels)
  const mode = useAnatomyStore((s) => s.mode)
  const system = useAnatomyStore(activeSystem)

  const items = useMemo(() => {
    if (!index) return []
    return SYSTEM_BY_ID[system].keyStructures
      .map((name) => findKey(index, name))
      .filter((key): key is string => !!key)
      .map((key) => getSelection(index, key)!)
  }, [index, system])

  if (!labels || mode !== 'body') return null
  return (
    <>
      {items.map((item, i) => {
        const side = i % 2 === 0 ? 1 : -1
        return (
          <Html key={item.key} position={item.center} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div className="relative" style={{ transform: `translate(${side > 0 ? 0 : -100}%, -50%)` }}>
              <button
                type="button"
                onClick={() => useAnatomyStore.getState().select(item.key)}
                className={`pointer-events-auto flex items-center gap-2 whitespace-nowrap ${side > 0 ? '' : 'flex-row-reverse'}`}
              >
                <span className="h-2 w-2 rounded-full bg-accent ring-4 ring-accent/25" />
                <span className="h-px w-10 bg-ink/40" />
                <span className="label rounded-md bg-white/90 px-2 py-1 text-[11px] text-ink shadow-sm backdrop-blur">
                  {displayName(item)}
                </span>
              </button>
            </div>
          </Html>
        )
      })}
    </>
  )
}

/** Floating system names above each figure in the exploded line-up (reference image 1). */
export function ExplodedLabels() {
  const index = useAnatomyStore((s) => s.index)
  const mode = useAnatomyStore((s) => s.mode)
  if (mode !== 'exploded' || !index) return null
  return (
    <>
      {EXPLODED_ORDER.map((id, i) => {
        const [x, , z] = explodedOffset(id)
        const above = i % 2 === 0
        const info = SYSTEM_BY_ID[id]
        return (
          <Html key={id} position={[x, above ? 1.95 : -0.22, z]} center zIndexRange={[20, 0]}>
            <button
              type="button"
              onClick={() => useAnatomyStore.getState().openSystem(id)}
              className="label whitespace-nowrap rounded-full border border-line bg-white/85 px-3 py-1.5 text-[11px] text-ink shadow-sm backdrop-blur transition hover:border-accent hover:text-accent"
              title={`Open ${info.title.join(' ')}`}
            >
              {info.title[0]} <span className="text-accent">▸</span>
            </button>
          </Html>
        )
      })}
    </>
  )
}

import type { SystemId } from '../data/systems'
import type { PartsIndex } from '../lib/anatomyData'

/** Order of systems in the exploded line-up (left to right). */
export const EXPLODED_ORDER: SystemId[] = [
  'skin',
  'muscular',
  'skeletal',
  'nervous',
  'cardiovascular',
  'lymphatic',
  'respiratory',
  'digestive',
  'urinary',
  'endocrine',
  'reproductive',
]

const SPACING = 0.56

/** Line-up position of a system in exploded view: a shallow arc facing the camera. */
export function explodedOffset(system: SystemId): [number, number, number] {
  const i = EXPLODED_ORDER.indexOf(system)
  const mid = (EXPLODED_ORDER.length - 1) / 2
  const t = i - mid
  return [t * SPACING, 0, -Math.abs(t) * 0.18]
}

export const EXPLODED_CAMERA = { position: [0, 1.55, 11.8] as const, target: [0, 1.3, -0.4] as const }

/** Bounding box of a whole system, from the parts index. */
export function systemBounds(index: PartsIndex, system: SystemId) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const p of Object.values(index)) {
    if (p.system !== system) continue
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], p.center[i] - p.size[i] / 2)
      max[i] = Math.max(max[i], p.center[i] + p.size[i] / 2)
    }
  }
  const center = min.map((v, i) => (v + max[i]) / 2) as [number, number, number]
  const size = min.map((v, i) => max[i] - v) as [number, number, number]
  return { center, size, min: min as [number, number, number] }
}

import type { SystemId } from '../data/systems'

export interface PartInfo {
  name: string
  baseName: string
  system: SystemId
  /** Anatomical group path from Z-Anatomy, outermost first. */
  path: string[]
  color: string | null
  isCurve: boolean
  /** Bounding-box centre and size in scene units (metres, Y-up). */
  center: [number, number, number]
  size: [number, number, number]
}

export type PartsIndex = Record<string, PartInfo>

/** A selectable thing: one mesh part, or a named anatomical group of parts (e.g. "Heart"). */
export interface Selection {
  key: string
  kind: 'part' | 'group'
  name: string
  baseName: string
  system: SystemId
  path: string[]
  center: [number, number, number]
  size: [number, number, number]
  ids: string[]
}

const GROUP_PREFIX = 'group:'

let indexPromise: Promise<PartsIndex> | null = null
let descPromise: Promise<Record<string, string>> | null = null

export function loadPartsIndex() {
  indexPromise ??= fetch('/data/parts-index.json').then((r) => r.json())
  return indexPromise
}

export function loadDescriptions() {
  descPromise ??= fetch('/data/descriptions.json').then((r) => r.json())
  return descPromise
}

export function modelUrl(system: SystemId) {
  return `/models/${system}.glb`
}

/** Selection key for a name: a single part (left side preferred for pairs) or a group of parts. */
export function findKey(index: PartsIndex, name: string): string | undefined {
  const lower = name.toLowerCase()
  const matches = Object.entries(index).filter(([, p]) => p.baseName.toLowerCase() === lower)
  if (matches.length) return (matches.find(([id]) => id.endsWith('_l')) ?? matches[0])[0]
  if (Object.values(index).some((p) => p.path.includes(name))) return GROUP_PREFIX + name
  return undefined
}

const cache = new WeakMap<PartsIndex, Map<string, Selection | null>>()

export function getSelection(index: PartsIndex, key: string): Selection | null {
  let byKey = cache.get(index)
  if (!byKey) cache.set(index, (byKey = new Map()))
  if (byKey.has(key)) return byKey.get(key)!
  const sel = buildSelection(index, key)
  byKey.set(key, sel)
  return sel
}

function buildSelection(index: PartsIndex, key: string): Selection | null {
  if (!key.startsWith(GROUP_PREFIX)) {
    const p = index[key]
    return p ? { key, kind: 'part', name: p.name, baseName: p.baseName, system: p.system, path: p.path, center: p.center, size: p.size, ids: [key] } : null
  }
  const name = key.slice(GROUP_PREFIX.length)
  const ids = Object.keys(index).filter((id) => index[id].path.includes(name))
  if (!ids.length) return null
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  const systems = new Map<SystemId, number>()
  for (const id of ids) {
    const p = index[id]
    systems.set(p.system, (systems.get(p.system) ?? 0) + 1)
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], p.center[i] - p.size[i] / 2)
      max[i] = Math.max(max[i], p.center[i] + p.size[i] / 2)
    }
  }
  const first = index[ids[0]].path
  return {
    key,
    kind: 'group',
    name,
    baseName: name,
    system: [...systems.entries()].sort((a, b) => b[1] - a[1])[0][0],
    path: first.slice(0, first.indexOf(name)),
    center: min.map((v, i) => (v + max[i]) / 2) as [number, number, number],
    size: min.map((v, i) => max[i] - v) as [number, number, number],
    ids,
  }
}

/** Finds a description for a selection, falling back up its group path. */
export function describe(descriptions: Record<string, string>, sel: Pick<Selection, 'baseName' | 'path'>) {
  for (const name of [sel.baseName, ...[...sel.path].reverse()]) {
    if (descriptions[name]) return { text: descriptions[name], from: name }
  }
  return null
}

export function sideOf(sel: Selection) {
  const sides = new Set(sel.ids.map((id) => (id.endsWith('_l') ? 'Left' : id.endsWith('_r') ? 'Right' : 'Midline')))
  if (sides.size === 1) return [...sides][0]
  return sides.has('Left') && sides.has('Right') ? 'Both sides' : 'Midline'
}

export function displayName(sel: Selection) {
  return sel.name.replace(/\s*\((Left|Right)\)$/, '')
}

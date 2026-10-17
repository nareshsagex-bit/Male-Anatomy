import { create } from 'zustand'
import { LAYER_ORDER, SYSTEM_BY_ID, type SystemId } from '../data/systems'
import type { PartsIndex } from '../lib/anatomyData'

export type ViewPreset = 'front' | 'back' | 'left' | 'right' | 'top'
export type CameraRequest =
  | { kind: 'preset'; preset: ViewPreset; n: number }
  | { kind: 'part'; id: string; n: number }
  | { kind: 'overview'; n: number }

interface AnatomyState {
  index: PartsIndex | null
  /** Peel depth target: 0 = skin, 1 = muscles, 2 = skeleton (fractions allowed while dragging). */
  depth: number
  /** Organ system brought to the front (skeleton shown faintly for context). */
  focus: SystemId | null
  mode: 'body' | 'exploded'
  selected: string | null
  hovered: string | null
  hidden: Record<string, true>
  isolate: boolean
  xray: boolean
  labels: boolean
  autoRotate: boolean
  quality: 'high' | 'low'
  camera: CameraRequest
  explored: Record<string, true>

  setIndex: (index: PartsIndex) => void
  setDepth: (depth: number) => void
  openSystem: (id: SystemId) => void
  setMode: (mode: 'body' | 'exploded') => void
  select: (id: string | null, flyTo?: boolean) => void
  hover: (id: string | null) => void
  hideSelected: () => void
  showAll: () => void
  toggleIsolate: () => void
  toggleXray: () => void
  toggleLabels: () => void
  toggleAutoRotate: () => void
  toggleQuality: () => void
  viewPreset: (preset: ViewPreset) => void
  resetView: () => void
}

function loadExplored(): Record<string, true> {
  try {
    return JSON.parse(localStorage.getItem('anatomy:explored') ?? '{}')
  } catch {
    return {}
  }
}

function saveExplored(explored: Record<string, true>) {
  try {
    localStorage.setItem('anatomy:explored', JSON.stringify(explored))
  } catch {
    /* storage unavailable: progress just isn't remembered */
  }
}

let n = 0

export const useAnatomyStore = create<AnatomyState>((set, get) => ({
  index: null,
  depth: 0,
  focus: null,
  mode: 'body',
  selected: null,
  hovered: null,
  hidden: {},
  isolate: false,
  xray: false,
  labels: false,
  autoRotate: true,
  quality: 'high',
  camera: { kind: 'overview', n: n++ },
  explored: loadExplored(),

  setIndex: (index) => set({ index }),

  setDepth: (depth) => set({ depth, focus: null, isolate: false }),

  openSystem: (id) => {
    const info = SYSTEM_BY_ID[id]
    const explored = { ...get().explored, [`system:${id}`]: true as const }
    saveExplored(explored)
    set({
      mode: 'body',
      selected: null,
      isolate: false,
      explored,
      ...(info.kind === 'layer' ? { depth: LAYER_ORDER.indexOf(id), focus: null } : { depth: 2, focus: id }),
      camera: { kind: 'overview', n: n++ },
    })
  },

  setMode: (mode) => set({ mode, selected: null, isolate: false, camera: { kind: 'overview', n: n++ } }),

  select: (id, flyTo = true) => {
    if (!id) return set({ selected: null, isolate: false })
    const explored = { ...get().explored, [id]: true as const }
    saveExplored(explored)
    set({ selected: id, explored, autoRotate: false, ...(flyTo ? { camera: { kind: 'part', id, n: n++ } } : {}) })
  },

  hover: (id) => set({ hovered: id }),

  hideSelected: () => {
    const { selected, hidden } = get()
    if (!selected) return
    set({ hidden: { ...hidden, [selected]: true }, selected: null, isolate: false })
  },

  showAll: () => set({ hidden: {}, isolate: false }),
  toggleIsolate: () => set((s) => ({ isolate: s.selected ? !s.isolate : false })),
  toggleXray: () => set((s) => ({ xray: !s.xray })),
  toggleLabels: () => set((s) => ({ labels: !s.labels })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleQuality: () => set((s) => ({ quality: s.quality === 'high' ? 'low' : 'high' })),
  viewPreset: (preset) => set({ camera: { kind: 'preset', preset, n: n++ }, autoRotate: false }),
  resetView: () => set({ camera: { kind: 'overview', n: n++ }, selected: null, isolate: false, hidden: {} }),
}))

/** The system whose info the dashboard shows when nothing is selected. */
export function activeSystem(state: Pick<AnatomyState, 'focus' | 'depth'>): SystemId {
  return state.focus ?? LAYER_ORDER[Math.min(2, Math.max(0, Math.round(state.depth)))]
}

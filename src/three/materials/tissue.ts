import * as THREE from 'three'
import type { SystemId } from '../../data/systems'
import type { PartInfo } from '../../lib/anatomyData'
import { injectTissueShader, TISSUE_KINDS, type TissueKind, type TissueUniforms } from '../shaders/tissueShader'

export type Variant = 'solid' | 'hover' | 'selected'

interface Look {
  kind: TissueKind
  color: string
}

const has = (text: string, ...words: string[]) => words.some((w) => text.includes(w))

/** Picks a realistic tissue type and colour for a part from its name, group path and system. */
export function lookFor(part: PartInfo): Look {
  const name = part.baseName.toLowerCase()
  const path = part.path.join(' / ').toLowerCase()
  const all = `${name} / ${path}`

  switch (part.system) {
    case 'skin':
      return { kind: 'skin', color: '#c98d73' }
    case 'muscular':
      if (has(name, 'tendon', 'aponeurosis', 'fascia', 'retinacul', 'sheath', 'ligament', 'tract', 'linea', 'raphe'))
        return { kind: 'tendon', color: '#e7ddcd' }
      return { kind: 'muscle', color: '#9c2f27' }
    case 'skeletal':
      if (has(all, 'tooth', 'incisor', 'molar', 'canine', 'premolar', 'teeth')) return { kind: 'bone', color: '#f3efe3' }
      if (has(name, 'cartilage', 'disc', 'meniscus', 'labrum', 'symphysis')) return { kind: 'cartilage', color: '#bfd6d8' }
      if (has(name, 'ligament', 'membrane', 'capsule', 'joint', 'suture', 'syndesmosis')) return { kind: 'tendon', color: '#ddd3bd' }
      return { kind: 'bone', color: '#e7dcc4' }
    case 'cardiovascular':
      if (has(all, 'heart', 'atri', 'ventric', 'valve', 'cusp', 'auricle', 'myocard', 'septum'))
        return { kind: 'organ', color: '#a9342c' }
      if (has(all, 'vein', 'venous', 'sinus', 'vena', 'veins')) return { kind: 'vessel', color: '#3560b8' }
      return { kind: 'vessel', color: '#cc2b26' }
    case 'nervous':
      if (has(all, 'eyeball', 'sclera', 'cornea', 'lens', 'vitreous', 'iris')) return { kind: 'organ', color: '#efe9df' }
      if (part.isCurve || has(name, 'nerve', 'plexus', 'ganglion', 'branch', 'ramus', 'root', 'trunk'))
        return { kind: 'nerve', color: '#e6c24a' }
      if (has(all, 'spinal cord', 'cauda', 'filum')) return { kind: 'nerve', color: '#eedcbc' }
      if (has(all, 'white matter', 'corpus callosum', 'tract')) return { kind: 'brain', color: '#efe4d8' }
      return { kind: 'brain', color: '#d9ada1' }
    case 'respiratory':
      if (has(name, 'lobe', 'lung', 'pleura')) return { kind: 'organ', color: '#d98b90' }
      return { kind: 'cartilage', color: '#e5c5b6' }
    case 'digestive':
      if (has(name, 'liver', 'hepat')) return { kind: 'organ', color: '#7d2b21' }
      if (has(name, 'gallbladder', 'bile', 'cystic')) return { kind: 'organ', color: '#5f7d3b' }
      if (has(name, 'pancrea')) return { kind: 'organ', color: '#e0b07d' }
      if (has(name, 'tongue', 'gingiva', 'palate', 'uvula')) return { kind: 'organ', color: '#c0605a' }
      if (has(name, 'omentum', 'mesocolon', 'meso', 'peritone')) return { kind: 'organ', color: '#f0d39c' }
      return { kind: 'organ', color: '#d39581' }
    case 'lymphatic':
      if (has(name, 'spleen', 'splenic')) return { kind: 'organ', color: '#6e2a3c' }
      if (has(name, 'thymus')) return { kind: 'organ', color: '#d8b48d' }
      if (has(name, 'tonsil')) return { kind: 'organ', color: '#c97a72' }
      return { kind: 'node', color: '#7dbb63' }
    case 'urinary':
      if (has(name, 'kidney', 'renal')) return { kind: 'organ', color: '#7f302b' }
      return { kind: 'organ', color: '#dcab88' }
    case 'endocrine':
      if (has(name, 'thyroid')) return { kind: 'organ', color: '#9e3d3a' }
      return { kind: 'organ', color: '#d6a07c' }
    case 'reproductive':
      if (has(name, 'testis', 'epididymis')) return { kind: 'organ', color: '#e2c4b3' }
      if (has(name, 'ductus', 'duct')) return { kind: 'vessel', color: '#e7cdb2' }
      return { kind: 'organ', color: '#cf9283' }
  }
}

const PHYSICAL: Record<TissueKind, THREE.MeshPhysicalMaterialParameters & { bump: number; tone: number }> = {
  skin: { roughness: 0.5, sheen: 0.7, sheenColor: '#ffb8a0', sheenRoughness: 0.55, clearcoat: 0.08, clearcoatRoughness: 0.5, specularIntensity: 0.45, bump: 0.035, tone: 0.07 },
  muscle: { roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.32, sheen: 0.35, sheenColor: '#ff8a78', sheenRoughness: 0.5, bump: 0.06, tone: 0.24 },
  tendon: { roughness: 0.32, clearcoat: 0.55, clearcoatRoughness: 0.3, sheen: 0.4, sheenColor: '#ffffff', bump: 0.03, tone: 0.06 },
  bone: { roughness: 0.68, clearcoat: 0.06, specularIntensity: 0.4, bump: 0.035, tone: 0.1 },
  cartilage: { roughness: 0.25, clearcoat: 0.75, clearcoatRoughness: 0.2, bump: 0.012, tone: 0.06 },
  organ: { roughness: 0.32, clearcoat: 0.75, clearcoatRoughness: 0.22, sheen: 0.25, sheenColor: '#ffd0c4', bump: 0.02, tone: 0.14 },
  vessel: { roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25, bump: 0.008, tone: 0.08 },
  nerve: { roughness: 0.42, clearcoat: 0.35, bump: 0.01, tone: 0.08 },
  brain: { roughness: 0.48, clearcoat: 0.45, clearcoatRoughness: 0.35, bump: 0.03, tone: 0.1 },
  node: { roughness: 0.38, clearcoat: 0.45, bump: 0.01, tone: 0.08 },
}

/** Per-system uniforms shared by all of that system's materials (one dissolve value drives the whole layer). */
export const systemUniforms = new Map<SystemId, { uDissolve: { value: number }; uEdgeColor: { value: THREE.Color } }>()
export function uniformsFor(system: SystemId) {
  let u = systemUniforms.get(system)
  if (!u) {
    u = { uDissolve: { value: 0 }, uEdgeColor: { value: new THREE.Color('#ff5a3c') } }
    systemUniforms.set(system, u)
  }
  return u
}

/** Shared pulse driven each frame for the selected part. */
export const selectionPulse = { value: 0 }
const HOVER = { value: 0.1 }
const NONE = { value: 0 }

const cache = new Map<string, THREE.MeshPhysicalMaterial>()

export function tissueMaterial(system: SystemId, look: Look, variant: Variant): THREE.MeshPhysicalMaterial {
  const key = `${system}|${look.kind}|${look.color}|${variant}`
  const hit = cache.get(key)
  if (hit) return hit

  const { bump, tone, ...params } = PHYSICAL[look.kind]
  const mat = new THREE.MeshPhysicalMaterial({ ...params, color: look.color })
  Object.assign(mat, { defines: { TISSUE_KIND: TISSUE_KINDS[look.kind] } })
  mat.side = THREE.DoubleSide
  const shared = uniformsFor(system)
  const uniforms: TissueUniforms = {
    uDissolve: shared.uDissolve,
    uEdgeColor: shared.uEdgeColor,
    uHighlight: variant === 'selected' ? selectionPulse : variant === 'hover' ? HOVER : NONE,
    uHighlightColor: { value: new THREE.Color(variant === 'selected' ? '#ff3b2f' : '#ff8a6a') },
    uBump: { value: bump },
    uToneVar: { value: tone },
  }
  mat.onBeforeCompile = (shader) => injectTissueShader(shader, uniforms)
  mat.customProgramCacheKey = () => 'tissue'
  cache.set(key, mat)
  return mat
}

const ghostCache = new Map<string, THREE.MeshStandardMaterial>()

/** Faint see-through material used for context layers (x-ray, isolate, organ focus). */
export function ghostMaterial(color: string, opacity = 0.09): THREE.MeshStandardMaterial {
  const key = `${color}|${opacity}`
  let mat = ghostCache.get(key)
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      roughness: 0.6,
      side: THREE.FrontSide,
    })
    ghostCache.set(key, mat)
  }
  return mat
}

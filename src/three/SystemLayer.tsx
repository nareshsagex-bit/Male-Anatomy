import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { SystemId } from '../data/systems'
import { modelUrl } from '../lib/anatomyData'
import { useAnatomyStore } from '../store/useAnatomyStore'
import { useSelection } from '../ui/useDetails'
import { ghostMaterial, lookFor, tissueMaterial, uniformsFor } from './materials/tissue'

export type Display = 'solid' | 'ghost' | 'hidden'

interface Props {
  system: SystemId
  display: Display
  /** 0 = fully present, 1 = fully peeled away. */
  dissolve: number
  offset: [number, number, number]
  exploded: boolean
}

const noRaycast = () => {}
const DRAG_PX = 5

export function SystemLayer({ system, display, dissolve, offset, exploded }: Props) {
  const { scene } = useGLTF(modelUrl(system))
  const group = useRef<THREE.Group>(null)
  const index = useAnatomyStore((s) => s.index)
  const selection = useSelection()
  const hovered = useAnatomyStore((s) => s.hovered)
  const hidden = useAnatomyStore((s) => s.hidden)
  const isolate = useAnatomyStore((s) => s.isolate)

  const meshes = useMemo(() => {
    const list: THREE.Mesh[] = []
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh
        mesh.userData.partId = mesh.name
        if (!mesh.geometry.boundsTree) mesh.geometry.computeBoundsTree()
        mesh.castShadow = false
        mesh.receiveShadow = false
        list.push(mesh)
      }
    })
    return list
  }, [scene])

  // Assign materials and pickability whenever display state or selection changes.
  useEffect(() => {
    if (!index) return
    const pickable = display === 'solid' && dissolve < 0.5
    const chosen = new Set(selection?.ids)
    for (const mesh of meshes) {
      const id = mesh.userData.partId as string
      const part = index[id]
      mesh.visible = !hidden[id]
      if (!part) continue
      const look = lookFor(part)
      const isolatedOut = isolate && selection !== null && !chosen.has(id)
      if (display === 'ghost' || isolatedOut) {
        mesh.material = ghostMaterial(look.color, isolatedOut ? 0.05 : 0.09)
        mesh.raycast = noRaycast
        mesh.renderOrder = 2
      } else {
        const variant = chosen.has(id) ? 'selected' : id === hovered ? 'hover' : 'solid'
        mesh.material = tissueMaterial(system, look, variant)
        mesh.raycast = pickable ? THREE.Mesh.prototype.raycast : noRaycast
        mesh.renderOrder = 0
      }
    }
  }, [meshes, index, display, dissolve < 0.5, selection, hovered, hidden, isolate, system]) // eslint-disable-line react-hooks/exhaustive-deps

  // Animate peel (dissolve) and exploded position.
  const target = useMemo(() => new THREE.Vector3(...offset), [offset])
  useFrame((_, delta) => {
    const u = uniformsFor(system).uDissolve
    const goal = display === 'hidden' ? 1 : display === 'ghost' ? 0 : dissolve
    u.value = THREE.MathUtils.damp(u.value, goal, 4, delta)
    if (Math.abs(u.value - goal) < 0.002) u.value = goal
    const g = group.current
    if (!g) return
    g.visible = u.value < 0.999
    g.position.lerp(target, 1 - Math.exp(-5 * delta))
  })

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const id = e.object.userData.partId as string
    if (useAnatomyStore.getState().hovered !== id) useAnatomyStore.getState().hover(id)
  }
  const onLeave = () => useAnatomyStore.getState().hover(null)
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.delta > DRAG_PX) return
    const store = useAnatomyStore.getState()
    if (exploded) store.openSystem(system)
    else store.select(e.object.userData.partId as string)
  }

  return (
    <group ref={group} onPointerMove={onMove} onPointerLeave={onLeave} onClick={onClick}>
      <primitive object={scene} />
    </group>
  )
}

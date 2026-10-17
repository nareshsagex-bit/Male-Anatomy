import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import * as THREE from 'three'
import { getSelection } from '../lib/anatomyData'
import { useAnatomyStore, type ViewPreset } from '../store/useAnatomyStore'
import { EXPLODED_CAMERA, systemBounds } from './layout'

const BODY_TARGET = new THREE.Vector3(0, 0.86, 0)
const BODY_DISTANCE = 3.85

/** Drives the orbit camera: overview framing, view presets, fly-to-part and idle auto-rotation. */
export function CameraRig() {
  const controls = useRef<CameraControls>(null)
  const size = useThree((s) => s.size)
  const camera = useAnatomyStore((s) => s.camera)
  const autoRotate = useAnatomyStore((s) => s.autoRotate)

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const { index, focus, mode } = useAnatomyStore.getState()
    // The body is centred in the viewer (the info lives in the left sidebar).
    const shift = 0

    let target = BODY_TARGET.clone()
    let distance = BODY_DISTANCE
    if (mode === 'exploded') {
      c.setFocalOffset(0, 0, 0, true)
      c.setLookAt(...EXPLODED_CAMERA.position, ...EXPLODED_CAMERA.target, true)
      return
    }
    if (focus && index) {
      const b = systemBounds(index, focus)
      target = new THREE.Vector3(...b.center)
      distance = Math.max(b.size[1], b.size[0] * 1.3) * 2.0 + 0.5
    }

    const sel = camera.kind === 'part' && index ? getSelection(index, camera.id) : null
    if (sel) {
      const center = new THREE.Vector3(...sel.center)
      const dist = Math.max(...sel.size) * 3.4 + 0.55
      const dir = new THREE.Vector3()
      c.getPosition(dir).sub(c.getTarget(new THREE.Vector3())).normalize()
      if (dir.lengthSq() < 0.5) dir.set(0, 0, 1)
      const pos = center.clone().addScaledVector(dir, dist)
      c.setFocalOffset(shift * dist, 0, 0, true)
      c.setLookAt(pos.x, pos.y, pos.z, center.x, center.y, center.z, true)
      return
    }

    const dirs: Record<ViewPreset, [number, number, number]> = {
      front: [0, 0.08, 1],
      back: [0, 0.08, -1],
      left: [1, 0.08, 0],
      right: [-1, 0.08, 0],
      top: [0, 1, 0.02],
    }
    const dir = new THREE.Vector3(...(camera.kind === 'preset' ? dirs[camera.preset] : dirs.front)).normalize()
    const pos = target.clone().addScaledVector(dir, distance)
    c.setFocalOffset(shift * distance, 0, 0, true)
    c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true)
  }, [camera, size.width])

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const stop = () => {
      if (useAnatomyStore.getState().autoRotate) useAnatomyStore.getState().toggleAutoRotate()
    }
    c.addEventListener('controlstart', stop)
    return () => c.removeEventListener('controlstart', stop)
  }, [])

  useFrame((_, delta) => {
    if (autoRotate && controls.current) controls.current.azimuthAngle += 0.12 * delta
  })

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={0.12}
      maxDistance={14}
      smoothTime={0.55}
      draggingSmoothTime={0.12}
      dollyToCursor
    />
  )
}

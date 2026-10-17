import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Radial gradient texture (stops are [offset, rgba]). */
function radialTexture(stops: [number, string][]) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [o, c] of stops) g.addColorStop(o, c)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Glowing platform ring under the body, like the reference's display stage. */
export function Platform({ y, radius = 0.62, visible = true }: { y: number; radius?: number; visible?: boolean }) {
  const ring = useRef<THREE.Mesh>(null)
  const glow = useMemo(
    () =>
      radialTexture([
        [0, 'rgba(232,50,43,0.20)'],
        [0.55, 'rgba(232,50,43,0.08)'],
        [0.78, 'rgba(232,50,43,0.22)'],
        [0.84, 'rgba(232,50,43,0.06)'],
        [1, 'rgba(232,50,43,0)'],
      ]),
    [],
  )
  // Soft baked contact shadow under the feet (cheaper than re-rendering the body for real shadows).
  const shadow = useMemo(
    () =>
      radialTexture([
        [0, 'rgba(30,20,20,0.42)'],
        [0.45, 'rgba(30,20,20,0.18)'],
        [1, 'rgba(30,20,20,0)'],
      ]),
    [],
  )

  useFrame(({ clock }) => {
    const m = ring.current?.material as THREE.MeshBasicMaterial | undefined
    if (m) m.opacity = 0.55 + Math.sin(clock.elapsedTime * 1.6) * 0.15
  })

  return (
    <group position={[0, y, 0]} visible={visible}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.001}>
        <planeGeometry args={[radius * 3, radius * 3]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.0015} scale={[1, 0.62, 1]}>
        <planeGeometry args={[radius * 1.25, radius * 1.25]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[radius, radius + 0.012, 128]} />
        <meshBasicMaterial color="#ff4a3d" transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[radius * 1.18, radius * 1.18 + 0.004, 128]} />
        <meshBasicMaterial color="#ff9a90" transparent opacity={0.45} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

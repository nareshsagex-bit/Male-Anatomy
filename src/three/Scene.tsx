import { Suspense, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { SYSTEMS, type SystemId } from '../data/systems'
import { modelUrl } from '../lib/anatomyData'
import { useAnatomyStore } from '../store/useAnatomyStore'
import { CameraRig } from './CameraRig'
import { ExplodedLabels, PartLabels } from './Labels3D'
import { EXPLODED_ORDER, explodedOffset } from './layout'
import { selectionPulse } from './materials/tissue'
import { Platform } from './Platform'
import { SystemLayer, type Display } from './SystemLayer'

const FLOOR_Y = -0.075
const ORIGIN: [number, number, number] = [0, 0, 0]
// Whole-body networks (vessels, nerves, lymph) would bury the skeleton, so the skeleton layer
// only reveals the compact internal organs; the networks appear when their system is opened.
const VISCERA: SystemId[] = ['respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive']

interface LayerState {
  display: Display
  dissolve: number
}

/** Decides how each system is drawn from the peel depth, organ focus, x-ray and view mode. */
function useLayerStates(): Record<SystemId, LayerState> {
  const depth = useAnatomyStore((s) => s.depth)
  const focus = useAnatomyStore((s) => s.focus)
  const xray = useAnatomyStore((s) => s.xray)
  const mode = useAnatomyStore((s) => s.mode)

  const out = {} as Record<SystemId, LayerState>
  for (const s of SYSTEMS) out[s.id] = { display: 'hidden', dissolve: 1 }

  if (mode === 'exploded') {
    for (const id of EXPLODED_ORDER) out[id] = { display: 'solid', dissolve: 0 }
    return out
  }
  if (focus) {
    out[focus] = { display: 'solid', dissolve: 0 }
    out.skeletal = { display: 'ghost', dissolve: 0 }
    if (xray) out.skin = { display: 'ghost', dissolve: 0 }
    return out
  }

  const skinPeel = THREE.MathUtils.clamp(depth, 0, 1)
  const musclePeel = THREE.MathUtils.clamp(depth - 1, 0, 1)
  out.skin = xray && skinPeel < 1 ? { display: 'ghost', dissolve: 0 } : { display: skinPeel >= 1 ? 'hidden' : 'solid', dissolve: skinPeel }
  const showMuscle = depth > 0.35 || xray
  out.muscular = !showMuscle
    ? { display: 'hidden', dissolve: 1 }
    : xray && musclePeel < 1 && depth >= 1
      ? { display: 'ghost', dissolve: 0 }
      : { display: musclePeel >= 1 ? 'hidden' : 'solid', dissolve: musclePeel }
  const showDeep = depth > 1.35 || (xray && depth >= 1)
  out.skeletal = showDeep ? { display: 'solid', dissolve: 0 } : { display: 'hidden', dissolve: 1 }
  for (const id of VISCERA) out[id] = showDeep ? { display: 'solid', dissolve: 0 } : { display: 'hidden', dissolve: 1 }
  return out
}

/** Mounts a system's model the first time it is needed and keeps it afterwards (so it never reloads). */
function Systems() {
  const states = useLayerStates()
  const mode = useAnatomyStore((s) => s.mode)
  const [mounted, setMounted] = useState<Partial<Record<SystemId, true>>>({ skin: true })

  useEffect(() => {
    const need = SYSTEMS.filter((s) => states[s.id].display !== 'hidden' && !mounted[s.id])
    if (need.length) setMounted((m) => ({ ...m, ...Object.fromEntries(need.map((s) => [s.id, true])) }))
  }, [states, mounted])

  return (
    <>
      {SYSTEMS.filter((s) => mounted[s.id]).map((s) => (
        <Suspense key={s.id} fallback={null}>
          <SystemLayer
            system={s.id}
            display={states[s.id].display}
            dissolve={states[s.id].dissolve}
            offset={mode === 'exploded' ? explodedOffset(s.id) : ORIGIN}
            exploded={mode === 'exploded'}
          />
        </Suspense>
      ))}
    </>
  )
}

function SelectionPulse() {
  useFrame(({ clock }) => {
    selectionPulse.value = 0.22 + Math.sin(clock.elapsedTime * 3.2) * 0.12
  })
  return null
}

/** Applies renderer tone mapping only when the post-processing chain (which tone-maps itself) is off. */
function RendererSettings({ quality }: { quality: 'high' | 'low' }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    gl.toneMapping = quality === 'high' ? THREE.NoToneMapping : THREE.NeutralToneMapping
    gl.toneMappingExposure = 1
  }, [gl, quality])
  return null
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-2.5, 4, 3.5]} intensity={1.7} color="#fff6ee" />
      <directionalLight position={[3, 2.2, 2.5]} intensity={0.55} color="#e8f0ff" />
      {/* Rim lights from behind give the bright edges seen in the reference renders. */}
      <directionalLight position={[2.5, 2.5, -4]} intensity={1.6} color="#ffe2d6" />
      <directionalLight position={[-3, 1.2, -3.5]} intensity={1.1} color="#dfe9ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[6, 3, 1]} target={[0, 0.9, 0]} />
        <Lightformer form="rect" intensity={1.2} position={[-4, 1.5, 1]} scale={[3, 4, 1]} target={[0, 0.9, 0]} />
        <Lightformer form="rect" intensity={1.6} position={[4, 1.5, -2]} scale={[3, 4, 1]} target={[0, 0.9, 0]} color="#ffe8de" />
        <Lightformer form="ring" intensity={1} position={[0, 0.5, -4]} scale={3} target={[0, 0.9, 0]} />
        <mesh scale={30}>
          <sphereGeometry />
          <meshBasicMaterial color="#9aa0aa" side={THREE.BackSide} />
        </mesh>
      </Environment>
    </>
  )
}

export function Scene() {
  const quality = useAnatomyStore((s) => s.quality)
  const mode = useAnatomyStore((s) => s.mode)
  const index = useAnatomyStore((s) => s.index)

  useEffect(() => {
    // Warm the cache for the next layers once the page is up.
    const t = setTimeout(() => {
      useGLTF.preload(modelUrl('muscular'))
      useGLTF.preload(modelUrl('skeletal'))
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <Canvas
      dpr={quality === 'high' ? [1, 2] : 1}
      camera={{ fov: 30, near: 0.02, far: 60, position: [0, 1, 4.3] }}
      gl={{ antialias: quality === 'low', powerPreference: 'high-performance' }}
      onPointerMissed={() => useAnatomyStore.getState().select(null)}
    >
      <color attach="background" args={['#f6f6f8']} />
      <RendererSettings quality={quality} />
      <Lighting />
      <CameraRig />
      <SelectionPulse />
      {index && <Systems />}
      <Platform y={FLOOR_Y} visible={mode === 'body'} />
      <PartLabels />
      <ExplodedLabels />
      {quality === 'high' && (
        <EffectComposer multisampling={0}>
          <N8AO aoRadius={0.06} distanceFalloff={0.4} intensity={2.4} halfRes />
          <Bloom luminanceThreshold={1} intensity={0.6} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  )
}

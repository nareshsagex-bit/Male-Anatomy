import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'
import App from './App.tsx'
import './styles/index.css'

// Fast, precise picking on high-poly anatomy meshes.
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree as unknown as typeof THREE.BufferGeometry.prototype.computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

// Dev only: lets automated screenshot checks drive the app.
if (import.meta.env.DEV) import('./store/useAnatomyStore').then((m) => Object.assign(window, { __anatomy: m.useAnatomyStore }))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
